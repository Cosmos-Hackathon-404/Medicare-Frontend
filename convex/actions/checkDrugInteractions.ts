"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { GoogleGenAI } from "@google/genai";
import Supermemory from "supermemory";

export const checkDrugInteractions = action({
  args: {
    patientClerkId: v.string(),
    prescriptions: v.array(
      v.object({
        medication: v.string(),
        dosage: v.string(),
        frequency: v.string(),
        duration: v.string(),
        instructions: v.string(),
      })
    ),
  },
  handler: async (ctx, args): Promise<{
    safe: boolean;
    alerts: Array<{
      type: "allergy" | "interaction" | "contraindication" | "dosage";
      severity: "critical" | "warning" | "info";
      medication: string;
      message: string;
      details: string;
    }>;
    checkedAt: string;
  }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });
    const supermemory = new Supermemory({
      apiKey: process.env.SUPERMEMORY_API_KEY!,
    });

    // Get patient profile for allergies
    const patient = await ctx.runQuery(api.queries.patients.getByClerkId, {
      clerkUserId: args.patientClerkId,
    });

    const allergies = patient?.allergies ?? "None reported";

    // Get patient's existing medications from Supermemory
    let existingMedications = "No known existing medications.";
    try {
      const profileResult = await supermemory.profile({
        containerTag: args.patientClerkId,
        q: "current medications prescriptions drugs",
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
        existingMedications = `Static facts: ${staticFacts}\nRecent context: ${dynamicContext}\nRelevant memories: ${memories}`;
      }
    } catch {
      // No memories yet
    }

    const prescriptionsList = args.prescriptions
      .map(
        (p) =>
          `- ${p.medication} ${p.dosage}, ${p.frequency} for ${p.duration} (${p.instructions})`
      )
      .join("\n");

    const prompt = `You are a pharmaceutical safety AI assistant. Perform a comprehensive drug safety check.

PATIENT ALLERGIES:
${allergies}

PATIENT EXISTING MEDICATIONS & MEDICAL HISTORY:
${existingMedications}

NEW PRESCRIPTIONS TO CHECK:
${prescriptionsList}

Analyze for:
1. ALLERGY CONFLICTS — Do any new prescriptions conflict with known allergies?
2. DRUG-DRUG INTERACTIONS — Do any new prescriptions interact with existing medications or with each other?
3. CONTRAINDICATIONS — Are there any contraindications based on patient history?
4. DOSAGE CONCERNS — Are any dosages unusual or potentially dangerous?

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "safe": true/false,
  "alerts": [
    {
      "type": "allergy" | "interaction" | "contraindication" | "dosage",
      "severity": "critical" | "warning" | "info",
      "medication": "Name of the medication with the issue",
      "message": "Short one-line alert message",
      "details": "Detailed explanation of the risk and recommended action"
    }
  ]
}

If everything looks safe, return { "safe": true, "alerts": [] }.
Be thorough but avoid false alarms. Flag only medically significant issues.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    const responseText = response.text ?? "";

    let parsed;
    try {
      let cleaned = responseText.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      parsed = JSON.parse(cleaned.trim());
    } catch {
      parsed = { safe: true, alerts: [] };
    }

    return {
      safe: parsed.safe ?? true,
      alerts: (parsed.alerts ?? []).map(
        (a: {
          type: string;
          severity: string;
          medication: string;
          message: string;
          details: string;
        }) => ({
          type: a.type ?? "interaction",
          severity: a.severity ?? "warning",
          medication: a.medication ?? "Unknown",
          message: a.message ?? "Potential issue detected",
          details: a.details ?? "",
        })
      ),
      checkedAt: new Date().toISOString(),
    };
  },
});
