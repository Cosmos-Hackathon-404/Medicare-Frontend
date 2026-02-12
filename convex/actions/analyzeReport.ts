"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { GoogleGenAI } from "@google/genai";
import Supermemory from "supermemory";
import {
  REPORT_ANALYSIS_PROMPT,
  fillPrompt,
} from "../../lib/prompts";

/**
 * analyzeReport action
 *
 * Pipeline: file storageId → fetch file → Gemini multimodal analysis →
 *           extract critical flags → save to Convex + Supermemory
 */
export const analyzeReport = action({
  args: {
    reportId: v.id("reports"),
    fileStorageId: v.id("_storage"),
    additionalFileStorageIds: v.optional(v.array(v.id("_storage"))),
    fileType: v.string(), // "pdf" | "image"
    patientClerkId: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });
    const supermemory = new Supermemory({
      apiKey: process.env.SUPERMEMORY_API_KEY!,
    });

    // Mark analysis as in-progress (idempotent — may already be set by scheduling mutation)
    await ctx.runMutation(api.mutations.reports.updateAnalysisStatus, {
      reportId: args.reportId,
      analysisStatus: "analyzing",
    });

    try {

    // Step 1: Fetch ALL files from Convex storage (primary + additional pages)
    const allStorageIds = [
      args.fileStorageId,
      ...(args.additionalFileStorageIds ?? []),
    ];

    // Determine MIME type from file type
    const imageMimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
    };
    const mimeType =
      args.fileType === "pdf"
        ? "application/pdf"
        : imageMimeMap[args.fileType.toLowerCase()] ?? "image/png";

    // Fetch all files and convert to base64
    const fileParts: { mimeType: string; data: string; buffer: ArrayBuffer }[] = [];
    for (const storageId of allStorageIds) {
      const fileUrl = await ctx.storage.getUrl(storageId);
      if (!fileUrl) throw new Error(`File not found in storage: ${storageId}`);
      const fileResponse = await fetch(fileUrl);
      const fileBuffer = await fileResponse.arrayBuffer();
      const fileBase64 = Buffer.from(fileBuffer).toString("base64");
      fileParts.push({ mimeType, data: fileBase64, buffer: fileBuffer });
    }

    // For backward compat, keep a reference to the first file
    const fileBuffer = fileParts[0].buffer;
    const fileBase64 = fileParts[0].data;

    // Step 2: Get patient context from Supermemory
    let patientContextStr = "No previous patient context available.";
    try {
      const profileResult = await supermemory.profile({
        containerTag: args.patientClerkId,
      });
      const profile = profileResult.profile;

      const staticFacts = profile?.static?.join("\n") ?? "";
      const dynamicContext = profile?.dynamic?.join("\n") ?? "";

      if (staticFacts || dynamicContext) {
        patientContextStr = `Static facts: ${staticFacts}\nRecent context: ${dynamicContext}`;
      }
    } catch {
      // No memories yet
    }

    // Step 3: Analyze with Gemini multimodal
    const languageInstruction = args.language && args.language !== "English"
      ? `\n\nIMPORTANT: Provide the entire analysis in ${args.language}. The plain_language_summary, critical flag details, recommendations, and pre_diagnosis_insights should ALL be written in ${args.language}. Keep medical terms in English but explain them in ${args.language}.`
      : "";

    const prompt = fillPrompt(REPORT_ANALYSIS_PROMPT, {
      patientContext: patientContextStr,
    }) + languageInstruction;

    // Build content parts: prompt text + ALL file pages
    const contentParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: prompt },
    ];
    // Add a label for multi-page context
    if (fileParts.length > 1) {
      contentParts.push({
        text: `This report consists of ${fileParts.length} pages/images. Analyze ALL of them together as a single report.`,
      });
    }
    for (let i = 0; i < fileParts.length; i++) {
      contentParts.push({
        inlineData: { mimeType: fileParts[i].mimeType, data: fileParts[i].data },
      });
    }

    const analysisResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: contentParts,
        },
      ],
    });
    const analysisText = analysisResponse.text ?? "";

    // Parse JSON response
    let parsed;
    try {
      let cleaned = analysisText.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      parsed = JSON.parse(cleaned.trim());
    } catch {
      parsed = {
        plain_language_summary: analysisText,
        critical_flags: [],
        recommendations: [],
        pre_diagnosis_insights: "",
      };
    }

    // Extract critical flags
    const criticalFlags = (parsed.critical_flags ?? []).map(
      (flag: { issue: string; severity: string; details: string }) => ({
        issue: flag.issue,
        severity: flag.severity,
        details: flag.details,
      })
    );

    // Step 4: Store analysis in Supermemory
    let supermemoryDocId: string | undefined;
    try {
      const memResult = await supermemory.add({
        content: `Medical Report Analysis (${new Date().toISOString()}):
Summary: ${parsed.plain_language_summary}
Critical Flags: ${criticalFlags.map((f: { issue: string; severity: string; details: string }) => `${f.issue} (${f.severity}): ${f.details}`).join("; ")}
Recommendations: ${(parsed.recommendations ?? []).join(", ")}
Pre-diagnosis Insights: ${parsed.pre_diagnosis_insights}`,
        containerTags: [args.patientClerkId],
        customId: `report_${args.reportId}`,
      });
      supermemoryDocId = memResult?.id;
    } catch {
      // Non-critical failure
    }

    // Step 4b: Upload original file to Supermemory for OCR extraction
    try {
      const fileBlob = new Blob([fileBuffer], { type: mimeType });
      const formData = new FormData();
      formData.append("file", fileBlob, `report_${args.reportId}.${args.fileType === "pdf" ? "pdf" : "png"}`);
      formData.append("containerTags", args.patientClerkId);
      formData.append("customId", `report_file_${args.reportId}`);

      await fetch("https://api.supermemory.ai/v3/documents/file", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SUPERMEMORY_API_KEY!}`,
        },
        body: formData,
      });
    } catch {
      // File upload to Supermemory failed — non-critical
    }

    // Step 5: Update report in Convex with analysis + optional supermemoryDocId
    await ctx.runMutation(api.mutations.reports.updateAnalysis, {
      reportId: args.reportId,
      aiSummary: parsed.plain_language_summary ?? analysisText,
      criticalFlags,
      recommendations: parsed.recommendations ?? [],
      preDiagnosisInsights: parsed.pre_diagnosis_insights ?? "",
      ...(supermemoryDocId ? { supermemoryDocId } : {}),
    });

    // Step 6: Auto-create critical alerts for high-severity flags
    const highFlags = criticalFlags.filter(
      (f: { severity: string }) => f.severity === "high"
    );
    if (highFlags.length > 0) {
      // Find doctors associated with this patient via appointments
      const appointments = await ctx.runQuery(
        api.queries.appointments.getByPatient,
        { patientClerkId: args.patientClerkId }
      );
      const doctorClerkIds = [
        ...new Set(
          appointments
            ?.filter((a: { status: string }) => a.status !== "cancelled")
            .map((a: { doctorClerkId: string }) => a.doctorClerkId) ?? []
        ),
      ];

      for (const doctorClerkId of doctorClerkIds) {
        try {
          await ctx.runMutation(api.mutations.criticalAlerts.create, {
            patientClerkId: args.patientClerkId,
            doctorClerkId,
            reportId: args.reportId,
            type: "report_critical_flag",
            title: `Critical finding in report`,
            message: highFlags
              .map(
                (f: { issue: string; details: string }) =>
                  `${f.issue}: ${f.details}`
              )
              .join(" | "),
            severity: "critical",
          });
        } catch {
          // Alert creation failed — non-critical
        }
      }
    }

    return {
      summary: parsed.plain_language_summary,
      criticalFlags,
      recommendations: parsed.recommendations ?? [],
      preDiagnosisInsights: parsed.pre_diagnosis_insights ?? "",
    };

    } catch (error) {
      // Mark analysis as failed so the user can retry
      await ctx.runMutation(api.mutations.reports.updateAnalysisStatus, {
        reportId: args.reportId,
        analysisStatus: "failed",
      });
      throw error;
    }
  },
});
