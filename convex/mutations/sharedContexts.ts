import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export const create = mutation({
  args: {
    patientClerkId: v.string(),
    fromDoctorClerkId: v.string(),
    toDoctorClerkId: v.string(),
    sessionIds: v.array(v.id("sessions")),
    reportIds: v.array(v.id("reports")),
    aiConsolidatedSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sharedContexts", {
      ...args,
      status: "pending",
    });
  },
});

export const markViewed = mutation({
  args: { sharedContextId: v.id("sharedContexts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sharedContextId, { status: "viewed" });
  },
});

export const updateSummary = mutation({
  args: {
    sharedContextId: v.id("sharedContexts"),
    aiConsolidatedSummary: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sharedContextId, {
      aiConsolidatedSummary: args.aiConsolidatedSummary,
    });
  },
});

export const updateProcessingStatus = mutation({
  args: {
    sharedContextId: v.id("sharedContexts"),
    processingStatus: v.string(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      processingStatus: args.processingStatus,
    };
    if (args.errorMessage !== undefined) {
      updates.errorMessage = args.errorMessage;
    }
    await ctx.db.patch(args.sharedContextId, updates);
  },
});

export const createAndGenerate = mutation({
  args: {
    patientClerkId: v.string(),
    fromDoctorClerkId: v.string(),
    toDoctorClerkId: v.string(),
    sessionIds: v.array(v.id("sessions")),
    reportIds: v.array(v.id("reports")),
  },
  handler: async (ctx, args) => {
    // Create shared context record with processing status
    const sharedContextId = await ctx.db.insert("sharedContexts", {
      patientClerkId: args.patientClerkId,
      fromDoctorClerkId: args.fromDoctorClerkId,
      toDoctorClerkId: args.toDoctorClerkId,
      sessionIds: args.sessionIds,
      reportIds: args.reportIds,
      status: "pending",
      processingStatus: "processing",
    });

    // Schedule AI generation as background job
    await ctx.scheduler.runAfter(0, api.actions.generateSharedContext.generateSharedContext, {
      patientClerkId: args.patientClerkId,
      fromDoctorClerkId: args.fromDoctorClerkId,
      toDoctorClerkId: args.toDoctorClerkId,
      sessionIds: args.sessionIds,
      reportIds: args.reportIds,
      sharedContextId,
    });

    return sharedContextId;
  },
});
