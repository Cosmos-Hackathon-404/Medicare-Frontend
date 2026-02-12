"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { GoogleGenAI } from "@google/genai";

const AI_CHAT_SYSTEM_PROMPT = `You are Medicare AI, a helpful and empathetic medical assistant chatbot. You help patients understand their health conditions, medications, and medical reports in simple, clear language.

IMPORTANT GUIDELINES:
- Be empathetic, professional, and supportive
- Explain medical terms in plain language
- Never provide definitive diagnoses — always recommend consulting a doctor
- If the patient shares report data, analyze it and provide helpful insights
- Be concise but thorough in your responses
- If asked about emergencies, always advise calling emergency services immediately
- You can discuss general health topics, medication information, and lifestyle advice
- Always clarify that your responses are informational and not a substitute for professional medical advice

PATIENT CONTEXT:
{context}`;

export const chat = action({
  args: {
    userClerkId: v.string(),
    message: v.string(),
    reportIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });

    // Save user message
    await ctx.runMutation(api.mutations.aiChat.saveMessage, {
      userClerkId: args.userClerkId,
      role: "user",
      content: args.message,
    });

    // Get chat history for context
    const history = await ctx.runQuery(api.queries.aiChat.getMessages, {
      userClerkId: args.userClerkId,
    });

    // Build context with optional report data
    let contextStr = "";

    if (args.reportIds && args.reportIds.length > 0) {
      // Fetch only selected reports
      const allReports = await ctx.runQuery(api.queries.reports.getByPatient, {
        patientClerkId: args.userClerkId,
      });

      const selectedReports = allReports?.filter((r) =>
        args.reportIds!.includes(r._id)
      );

      if (selectedReports && selectedReports.length > 0) {
        const reportSummaries = selectedReports
          .filter((r) => r.aiSummary)
          .map(
            (r) =>
              `Report: ${r.fileName}\nSummary: ${r.aiSummary}\nCritical Flags: ${
                r.criticalFlags
                  ? r.criticalFlags
                      .map((f) => `${f.issue} (${f.severity}): ${f.details}`)
                      .join("; ")
                  : "None"
              }`
          )
          .join("\n\n");

        contextStr = `\n\nPATIENT REPORTS:\n${reportSummaries}`;
      }
    }

    // Get patient profile for context
    const patient = await ctx.runQuery(api.queries.patients.getByClerkId, {
      clerkUserId: args.userClerkId,
    });

    if (patient) {
      contextStr += `\n\nPATIENT INFO:\nName: ${patient.name}\nAge: ${patient.age}\nBlood Group: ${patient.bloodGroup ?? "Unknown"}\nAllergies: ${patient.allergies ?? "None reported"}`;
    }

    const systemPrompt = AI_CHAT_SYSTEM_PROMPT.replace("{context}", contextStr);

    // Build conversation history for Gemini
    const conversationHistory = history.slice(-20).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.content }],
    }));

    // Add current message
    conversationHistory.push({
      role: "user" as const,
      parts: [{ text: args.message }],
    });

    // Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: conversationHistory,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const aiResponse =
      response.text?.trim() ??
      "I'm sorry, I couldn't generate a response. Please try again.";

    // Save AI response
    await ctx.runMutation(api.mutations.aiChat.saveMessage, {
      userClerkId: args.userClerkId,
      role: "assistant",
      content: aiResponse,
    });

    return aiResponse;
  },
});
