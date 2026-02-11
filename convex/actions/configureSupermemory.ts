"use node";

import { action } from "../_generated/server";
import Supermemory from "supermemory";

/**
 * configureSupermemory action
 *
 * Configures Supermemory organization settings (filterPrompt, shouldLLMFilter).
 * Run once at app initialization or whenever settings need updating.
 */
export const configureSupermemory = action({
  args: {},
  handler: async () => {
    const client = new Supermemory({
      apiKey: process.env.SUPERMEMORY_API_KEY!,
    });

    await client.settings.update({
      shouldLLMFilter: true,
      filterPrompt: `This is Medicare AI, a medical platform connecting doctors and patients.
containerTag is the patient's Clerk userId.
We store: session summaries, medical report analyses, prescriptions, diagnoses,
doctor visit history, critical health flags, ongoing treatments, allergies,
and patient demographics.
Prioritize: clinical findings, diagnoses, prescriptions, allergies, critical flags,
and follow-up actions.
Skip: greetings, small talk, scheduling logistics, and duplicate information.`,
    });

    return { success: true, message: "Supermemory settings configured." };
  },
});
