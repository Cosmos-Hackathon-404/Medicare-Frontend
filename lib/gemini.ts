import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });

const MODEL = "gemini-2.0-flash";

/**
 * Generate text content using Gemini
 */
export async function generateText(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });
  return response.text ?? "";
}

/**
 * Analyze an image or PDF using Gemini's multimodal capabilities
 */
export async function analyzeFile(
  prompt: string,
  fileData: string, // base64 encoded
  mimeType: string // e.g. "image/png", "application/pdf"
): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: fileData } },
        ],
      },
    ],
  });
  return response.text ?? "";
}

/**
 * Transcribe audio using Gemini
 */
export async function transcribeAudio(
  audioData: string, // base64 encoded
  mimeType: string = "audio/webm"
): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Transcribe the following audio recording of a doctor-patient medical session. Provide a clean, accurate transcription of the conversation.",
          },
          { inlineData: { mimeType, data: audioData } },
        ],
      },
    ],
  });
  return response.text ?? "";
}

/**
 * Parse JSON from Gemini response, handling markdown code blocks
 */
export function parseJsonResponse<T>(text: string): T {
  // Strip markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
}
