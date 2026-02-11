"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { GoogleGenAI } from "@google/genai";
import Supermemory from "supermemory";
import {
  SESSION_SUMMARY_PROMPT,
  fillPrompt,
} from "../../lib/prompts";

/**
 * summarizeSession action
 *
 * Pipeline: audio storageId → fetch audio → Gemini transcription →
 *           fetch Supermemory patient context → Gemini summary →
 *           save to Convex + Supermemory
 */
export const summarizeSession = action({
  args: {
    appointmentId: v.id("appointments"),
    audioStorageId: v.id("_storage"),
    patientClerkId: v.string(),
    doctorClerkId: v.string(),
  },
  handler: async (ctx, args): Promise<{
    sessionId: Id<"sessions">;
    transcript: string;
    summary: Record<string, unknown>;
    keyDecisions: string[];
    prescriptions: string;
  }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });
    const supermemory = new Supermemory({
      apiKey: process.env.SUPERMEMORY_API_KEY!,
    });

    // Step 1: Fetch audio from Convex storage
    const audioUrl = await ctx.storage.getUrl(args.audioStorageId);
    if (!audioUrl) throw new Error("Audio file not found in storage");

    const audioResponse = await fetch(audioUrl);
    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    // Step 2: Transcribe with Gemini
    const transcriptionResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Transcribe the following audio recording of a doctor-patient medical session. Provide a clean, accurate transcription of the conversation.",
            },
            {
              inlineData: {
                mimeType: "audio/webm",
                data: audioBase64,
              },
            },
          ],
        },
      ],
    });
    const transcript = transcriptionResponse.text ?? "";

    // Step 3: Get patient context from Supermemory
    let patientContextStr = "No previous patient context available.";
    try {
      const profileResult = await supermemory.profile({
        containerTag: args.patientClerkId,
        q: transcript,
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
        patientContextStr = `Static facts: ${staticFacts}\nRecent context: ${dynamicContext}\nRelevant memories: ${memories}`;
      }
    } catch {
      // No memories yet — continue with empty context
    }

    // Step 4: Generate summary with Gemini
    const prompt = fillPrompt(SESSION_SUMMARY_PROMPT, {
      patientContext: patientContextStr,
      transcript: transcript,
    });

    const summaryResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const summaryText = summaryResponse.text ?? "";

    // Parse JSON response
    let parsed;
    try {
      let cleaned = summaryText.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      parsed = JSON.parse(cleaned.trim());
    } catch {
      parsed = {
        chief_complaint: "Unable to parse",
        diagnosis: summaryText,
        prescriptions: "",
        follow_up_actions: [],
        key_decisions: [],
      };
    }

    // Step 5: Create session in Convex
    const sessionId = await ctx.runMutation(
      api.mutations.sessions.create,
      {
        appointmentId: args.appointmentId,
        patientClerkId: args.patientClerkId,
        doctorClerkId: args.doctorClerkId,
        audioStorageId: args.audioStorageId,
      }
    );

    // Update session with transcript + summary
    await ctx.runMutation(api.mutations.sessions.update, {
      sessionId,
      transcript,
      aiSummary: JSON.stringify(parsed),
      keyDecisions: parsed.key_decisions ?? [],
      prescriptions: parsed.prescriptions ?? "",
    });

    // Update appointment status to completed
    await ctx.runMutation(api.mutations.appointments.updateStatus, {
      appointmentId: args.appointmentId,
      status: "completed",
    });

    // Step 6: Store in Supermemory for future context
    let supermemoryDocId: string | undefined;
    try {
      const memResult = await supermemory.add({
        content: `Session on ${new Date().toISOString()}:
Summary: ${parsed.chief_complaint}
Diagnosis: ${parsed.diagnosis}
Prescriptions: ${parsed.prescriptions}
Key Decisions: ${(parsed.key_decisions ?? []).join(", ")}
Follow-up: ${(parsed.follow_up_actions ?? []).join(", ")}`,
        containerTags: [args.patientClerkId],
        customId: `session_${sessionId}`,
      });
      supermemoryDocId = memResult?.id;
    } catch {
      // Supermemory storage failed — non-critical
    }

    if (supermemoryDocId) {
      await ctx.runMutation(api.mutations.sessions.update, {
        sessionId,
        supermemoryDocId,
      });
    }

    return {
      sessionId,
      transcript,
      summary: parsed,
      keyDecisions: parsed.key_decisions ?? [],
      prescriptions: parsed.prescriptions ?? "",
    };
  },
});
