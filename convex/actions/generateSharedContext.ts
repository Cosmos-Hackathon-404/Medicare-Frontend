"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { GoogleGenAI } from "@google/genai";
import Supermemory from "supermemory";
import {
  SHARE_CONTEXT_PROMPT,
  fillPrompt,
} from "../../lib/prompts";

/**
 * generateSharedContext action
 *
 * Pipeline: Supermemory profile(patientId) → Gemini consolidation →
 *           save sharedContext to Convex
 */
export const generateSharedContext = action({
  args: {
    patientClerkId: v.string(),
    fromDoctorClerkId: v.string(),
    toDoctorClerkId: v.string(),
    sessionIds: v.array(v.id("sessions")),
    reportIds: v.array(v.id("reports")),
  },
  handler: async (ctx, args): Promise<{
    sharedContextId: Id<"sharedContexts">;
    consolidatedSummary: Record<string, unknown>;
  }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });
    const supermemory = new Supermemory({
      apiKey: process.env.SUPERMEMORY_API_KEY!,
    });

    // Step 1: Get full patient profile from Supermemory
    let staticFacts = "No profile data available.";
    let dynamicContext = "No recent history available.";
    let memories = "No records available.";

    try {
      const profileResult = await supermemory.profile({
        containerTag: args.patientClerkId,
      });
      const profile = profileResult.profile;
      const searchResults = profileResult.searchResults;

      if (profile?.static?.length) {
        staticFacts = profile.static.join("\n");
      }
      if (profile?.dynamic?.length) {
        dynamicContext = profile.dynamic.join("\n");
      }
      if (searchResults?.results?.length) {
        memories = searchResults.results
          .map((r: unknown) => (r as { memory: string }).memory)
          .join("\n\n");
      }
    } catch {
      // No memories yet — use defaults
    }

    // Step 2: Generate consolidated summary with Gemini
    const prompt = fillPrompt(SHARE_CONTEXT_PROMPT, {
      staticFacts,
      dynamicContext,
      memories,
    });

    const summaryResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });
    const summaryText = summaryResponse.text ?? "";

    // Parse JSON
    let parsed;
    try {
      let cleaned = summaryText.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      parsed = JSON.parse(cleaned.trim());
    } catch {
      parsed = {
        patient_overview: summaryText,
        chronological_summary: "",
        active_conditions: [],
        current_medications: [],
        allergies: [],
        critical_alerts: [],
        recommended_follow_ups: [],
      };
    }

    const consolidatedSummary = JSON.stringify(parsed);

    // Step 3: Create shared context in Convex
    const sharedContextId = await ctx.runMutation(
      api.mutations.sharedContexts.create,
      {
        patientClerkId: args.patientClerkId,
        fromDoctorClerkId: args.fromDoctorClerkId,
        toDoctorClerkId: args.toDoctorClerkId,
        sessionIds: args.sessionIds,
        reportIds: args.reportIds,
        aiConsolidatedSummary: consolidatedSummary,
      }
    );

    return {
      sharedContextId,
      consolidatedSummary: parsed,
    };
  },
});
