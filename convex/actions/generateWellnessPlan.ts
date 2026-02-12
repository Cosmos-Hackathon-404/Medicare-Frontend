"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { GoogleGenAI } from "@google/genai";
import Supermemory from "supermemory";
import { WELLNESS_PLAN_PROMPT, fillPrompt } from "../../lib/prompts";

/**
 * generateWellnessPlan action
 *
 * Pipeline: Gather ALL patient data from Convex + Supermemory memory layer →
 *           Build comprehensive patient context →
 *           Gemini generates personalized nutrition, exercise, lifestyle plan →
 *           Save to Convex
 */
export const generateWellnessPlan = action({
  args: {
    patientClerkId: v.string(),
    planId: v.id("wellnessPlans"),
  },
  handler: async (ctx, args) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });
    const supermemory = new Supermemory({
      apiKey: process.env.SUPERMEMORY_API_KEY!,
    });

    try {
      // ===== Step 0: Check data sufficiency =====
      const readiness = await ctx.runQuery(
        api.queries.wellnessPlans.getDataReadiness,
        { patientClerkId: args.patientClerkId }
      );

      if (!readiness.ready) {
        await ctx.runMutation(api.mutations.wellnessPlans.updateStatus, {
          planId: args.planId,
          status: "failed",
          errorMessage:
            readiness.missingHint ??
            "Not enough medical data to generate a personalized wellness plan. Please complete your profile, upload reports, or record vitals.",
        });
        return { success: false, planId: args.planId };
      }

      // ===== Step 1: Gather ALL patient data from Convex =====

      // Patient profile
      const patient = await ctx.runQuery(api.queries.patients.getByClerkId, {
        clerkUserId: args.patientClerkId,
      });

      const patientProfileStr = patient
        ? `Name: ${patient.name}
Age: ${patient.age}
Blood Group: ${patient.bloodGroup ?? "Unknown"}
Allergies: ${patient.allergies ?? "None reported"}
Emergency Contact: ${patient.emergencyContact ?? "Not specified"}`
        : "No patient profile found.";

      // Vitals data
      const vitals = await ctx.runQuery(api.queries.vitals.getByPatient, {
        patientClerkId: args.patientClerkId,
      });

      let vitalsDataStr = "No vitals data available.";
      if (vitals && vitals.length > 0) {
        // Group by type and get latest readings
        const vitalsByType = new Map<string, typeof vitals>();
        for (const v of vitals) {
          const existing = vitalsByType.get(v.type) ?? [];
          existing.push(v);
          vitalsByType.set(v.type, existing);
        }

        const vitalsSummary: string[] = [];
        for (const [type, readings] of vitalsByType) {
          const sorted = readings.sort(
            (a, b) =>
              new Date(b.recordedAt).getTime() -
              new Date(a.recordedAt).getTime()
          );
          const latest = sorted[0];
          const secondaryStr = latest.secondaryValue
            ? `/${latest.secondaryValue}`
            : "";
          vitalsSummary.push(
            `${type}: ${latest.value}${secondaryStr} ${latest.unit} (recorded ${latest.recordedAt}, ${sorted.length} total readings)`
          );

          // Add trend info if we have multiple readings
          if (sorted.length >= 3) {
            const recent3 = sorted.slice(0, 3);
            const avg =
              recent3.reduce((sum, r) => sum + r.value, 0) / recent3.length;
            vitalsSummary.push(
              `  → 3-reading average: ${avg.toFixed(1)} ${latest.unit}`
            );
          }
        }
        vitalsDataStr = vitalsSummary.join("\n");
      }

      // Reports data
      const reports = await ctx.runQuery(api.queries.reports.getByPatient, {
        patientClerkId: args.patientClerkId,
      });

      let reportsSummaryStr = "No medical reports available.";
      if (reports && reports.length > 0) {
        const reportSummaries = reports
          .filter((r) => r.aiSummary)
          .map((r) => {
            const flags =
              r.criticalFlags && r.criticalFlags.length > 0
                ? `Critical Flags: ${r.criticalFlags.map((f) => `${f.issue} [${f.severity}]: ${f.details}`).join("; ")}`
                : "No critical flags";
            const recs =
              r.recommendations && r.recommendations.length > 0
                ? `Recommendations: ${r.recommendations.join(", ")}`
                : "";
            return `Report: ${r.fileName}\nSummary: ${r.aiSummary}\n${flags}\n${recs}`;
          });
        if (reportSummaries.length > 0) {
          reportsSummaryStr = reportSummaries.join("\n---\n");
        }
      }

      // Sessions data (diagnoses, prescriptions, summaries)
      const sessions = await ctx.runQuery(api.queries.sessions.getByPatient, {
        patientClerkId: args.patientClerkId,
      });

      let sessionsDataStr = "No session history available.";
      if (sessions && sessions.length > 0) {
        const sessionSummaries = sessions
          .filter((s) => s.aiSummary)
          .map((s) => {
            let parsed;
            try {
              parsed = JSON.parse(s.aiSummary!);
            } catch {
              parsed = { diagnosis: s.aiSummary };
            }
            const prescStr = s.prescriptions
              ? (() => {
                  try {
                    const presc = JSON.parse(s.prescriptions);
                    return Array.isArray(presc)
                      ? presc
                          .map(
                            (p: {
                              medication: string;
                              dosage: string;
                              frequency: string;
                              duration: string;
                            }) =>
                              `${p.medication} ${p.dosage} - ${p.frequency} for ${p.duration}`
                          )
                          .join(", ")
                      : s.prescriptions;
                  } catch {
                    return s.prescriptions;
                  }
                })()
              : "None";
            const keyDec =
              s.keyDecisions && s.keyDecisions.length > 0
                ? `Key Decisions: ${s.keyDecisions.join(", ")}`
                : "";
            return `Session with Dr. ${s.doctorName ?? "Unknown"} (${s.doctorSpecialization ?? ""})
Chief Complaint: ${parsed.chiefComplaint ?? parsed.chief_complaint ?? "N/A"}
Diagnosis: ${parsed.diagnosis ?? "N/A"}
Prescriptions: ${prescStr}
${keyDec}`;
          });
        if (sessionSummaries.length > 0) {
          sessionsDataStr = sessionSummaries.join("\n---\n");
        }
      }

      // Critical alerts
      const alerts = await ctx.runQuery(
        api.queries.criticalAlerts.getForPatient,
        { patientClerkId: args.patientClerkId }
      );

      let criticalAlertsStr = "No active critical alerts.";
      if (alerts && alerts.length > 0) {
        const activeAlerts = alerts.filter((a) => a.status === "active");
        if (activeAlerts.length > 0) {
          criticalAlertsStr = activeAlerts
            .map((a) => `[${a.severity}] ${a.title}: ${a.message}`)
            .join("\n");
        }
      }

      // ===== Step 2: Get patient context from Supermemory (memory layer) =====
      let memoryContextStr = "No memory context available.";
      try {
        const profileResult = await supermemory.profile({
          containerTag: args.patientClerkId,
          q: "complete medical history, diagnoses, medications, lifestyle, diet, exercise, conditions, allergies",
        });

        const profile = profileResult.profile;
        const searchResults = profileResult.searchResults;

        const staticFacts = profile?.static?.join("\n") ?? "";
        const dynamicContext = profile?.dynamic?.join("\n") ?? "";
        const memories =
          searchResults?.results
            ?.map((r: unknown) => (r as { memory: string }).memory)
            .join("\n") ?? "";

        if (staticFacts || dynamicContext || memories) {
          memoryContextStr = `Known Facts:\n${staticFacts}\n\nRecent Context:\n${dynamicContext}\n\nRelevant Memories:\n${memories}`;
        }
      } catch {
        // Supermemory not available — continue with Convex data only
      }

      // ===== Step 3: Track data sources =====
      const dataSources: string[] = [];
      if (patient) dataSources.push("Patient Profile");
      if (vitals && vitals.length > 0)
        dataSources.push(`${vitals.length} Vital Readings`);
      if (reports && reports.length > 0)
        dataSources.push(`${reports.length} Medical Reports`);
      if (sessions && sessions.length > 0)
        dataSources.push(`${sessions.length} Doctor Sessions`);
      if (alerts && alerts.length > 0)
        dataSources.push(`${alerts.length} Critical Alerts`);
      if (memoryContextStr !== "No memory context available.")
        dataSources.push("Supermemory Patient Context");

      // ===== Step 4: Generate wellness plan with Gemini =====
      const prompt = fillPrompt(WELLNESS_PLAN_PROMPT, {
        patientProfile: patientProfileStr,
        memoryContext: memoryContextStr,
        vitalsData: vitalsDataStr,
        reportsSummary: reportsSummaryStr,
        sessionsData: sessionsDataStr,
        criticalAlerts: criticalAlertsStr,
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          maxOutputTokens: 4096,
          temperature: 0.6,
        },
      });

      const responseText = response.text ?? "";

      // ===== Step 5: Parse the JSON response =====
      let parsed;
      try {
        let cleaned = responseText.trim();
        if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
        else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
        if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
        parsed = JSON.parse(cleaned.trim());
      } catch {
        // If parsing fails, save error
        await ctx.runMutation(api.mutations.wellnessPlans.updateStatus, {
          planId: args.planId,
          status: "failed",
          errorMessage: "Failed to parse AI response. Please try regenerating.",
        });
        throw new Error("Failed to parse wellness plan JSON");
      }

      // ===== Step 6: Save the plan to Convex =====
      await ctx.runMutation(api.mutations.wellnessPlans.updatePlan, {
        planId: args.planId,
        nutrition: parsed.nutrition ?? null,
        exercise: parsed.exercise ?? null,
        lifestyle: parsed.lifestyle ?? null,
        mentalWellness: parsed.mentalWellness ?? parsed.mental_wellness ?? null,
        additionalNotes:
          parsed.additionalNotes ?? parsed.additional_notes ?? null,
        reviewDate: parsed.reviewDate ?? parsed.review_date ?? null,
        aiConfidence: parsed.aiConfidence ?? parsed.ai_confidence ?? "medium",
        dataSources,
      });

      return { success: true, planId: args.planId };
    } catch (error) {
      // Mark plan as failed
      await ctx.runMutation(api.mutations.wellnessPlans.updateStatus, {
        planId: args.planId,
        status: "failed",
        errorMessage:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
      throw error;
    }
  },
});
