import Supermemory from "supermemory";

// Initialize Supermemory client
const supermemory = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY!,
});

/**
 * Configure Supermemory settings (run once at app init)
 */
export async function configureSupermemory() {
  await fetch("https://api.supermemory.ai/v3/settings", {
    method: "PATCH",
    headers: {
      "x-supermemory-api-key": process.env.SUPERMEMORY_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shouldLLMFilter: true,
      filterPrompt: `This is Medicare AI, a medical platform connecting doctors and patients.
        containerTag is the patient's Clerk userId.
        We store: session summaries, medical report analyses, prescriptions, diagnoses,
        doctor visit history, critical health flags, and ongoing treatments.`,
    }),
  });
}

/**
 * Store a session summary in patient's memory
 */
export async function storeSessionMemory(
  patientClerkId: string,
  content: string
) {
  return await supermemory.add({
    content,
    containerTag: patientClerkId,
  });
}

/**
 * Store a report analysis in patient's memory
 */
export async function storeReportMemory(
  patientClerkId: string,
  content: string
) {
  return await supermemory.add({
    content,
    containerTag: patientClerkId,
  });
}

/**
 * Get patient profile + relevant memories for context-aware AI
 */
export async function getPatientContext(
  patientClerkId: string,
  query?: string
) {
  try {
    const result = await supermemory.profile({
      containerTag: patientClerkId,
      q: query,
    });

    const profile = result.profile;
    const searchResults = result.searchResults;

    return {
      staticFacts: profile?.static ?? [],
      dynamicContext: profile?.dynamic ?? [],
      relevantMemories:
        searchResults?.results?.map((r: unknown) => (r as { memory: string }).memory) ?? [],
    };
  } catch {
    // If patient has no memories yet, return empty context
    return {
      staticFacts: [],
      dynamicContext: [],
      relevantMemories: [],
    };
  }
}

/**
 * Upload file directly to Supermemory for extraction
 */
export async function uploadFileToMemory(
  patientClerkId: string,
  fileBlob: Blob
) {
  const formData = new FormData();
  formData.append("file", fileBlob);
  formData.append("containerTag", patientClerkId);

  return await fetch("https://api.supermemory.ai/v3/documents/file", {
    method: "POST",
    headers: { "x-supermemory-api-key": process.env.SUPERMEMORY_API_KEY! },
    body: formData,
  });
}

export { supermemory };
