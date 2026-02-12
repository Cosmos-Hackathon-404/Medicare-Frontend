import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export const create = mutation({
  args: {
    patientClerkId: v.string(),
    skipReadinessCheck: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Pre-check: does the patient have enough data?
    if (!args.skipReadinessCheck) {
      const patient = await ctx.db
        .query("patientProfiles")
        .withIndex("by_clerkUserId", (q) =>
          q.eq("clerkUserId", args.patientClerkId)
        )
        .first();

      if (!patient) {
        throw new Error(
          "Patient profile not found. Please complete your profile in Settings first."
        );
      }

      const hasBloodGroup = !!patient.bloodGroup;
      const hasAllergies = !!patient.allergies;
      if (!hasBloodGroup && !hasAllergies) {
        throw new Error(
          "Your profile is incomplete. Please add your blood group or allergies in Settings before generating a wellness plan."
        );
      }
    }

    const planId = await ctx.db.insert("wellnessPlans", {
      patientClerkId: args.patientClerkId,
      generatedAt: new Date().toISOString(),
      status: "generating",
    });

    // Schedule the AI action to generate the plan
    await ctx.scheduler.runAfter(
      0,
      api.actions.generateWellnessPlan.generateWellnessPlan,
      {
        patientClerkId: args.patientClerkId,
        planId,
      }
    );

    return planId;
  },
});

export const updatePlan = mutation({
  args: {
    planId: v.id("wellnessPlans"),
    nutrition: v.optional(
      v.any()
    ),
    exercise: v.optional(
      v.any()
    ),
    lifestyle: v.optional(
      v.any()
    ),
    mentalWellness: v.optional(
      v.any()
    ),
    additionalNotes: v.optional(v.string()),
    reviewDate: v.optional(v.string()),
    aiConfidence: v.optional(v.string()),
    dataSources: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { planId, ...updates } = args;
    const cleanUpdates: Record<string, unknown> = { status: "completed" };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== null) {
        cleanUpdates[key] = value;
      }
    }
    await ctx.db.patch(planId, cleanUpdates);
  },
});

export const updateStatus = mutation({
  args: {
    planId: v.id("wellnessPlans"),
    status: v.string(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { status: args.status };
    if (args.errorMessage !== undefined) {
      updates.errorMessage = args.errorMessage;
    }
    await ctx.db.patch(args.planId, updates);
  },
});

export const deletePlan = mutation({
  args: { planId: v.id("wellnessPlans") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.planId);
  },
});
