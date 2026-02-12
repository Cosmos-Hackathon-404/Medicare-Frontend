import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    appointmentId: v.id("appointments"),
    patientClerkId: v.string(),
    doctorClerkId: v.string(),
    audioStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", {
      appointmentId: args.appointmentId,
      patientClerkId: args.patientClerkId,
      doctorClerkId: args.doctorClerkId,
      audioStorageId: args.audioStorageId,
    });
  },
});

export const update = mutation({
  args: {
    sessionId: v.id("sessions"),
    audioStorageId: v.optional(v.id("_storage")),
    transcript: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    keyDecisions: v.optional(v.array(v.string())),
    prescriptions: v.optional(v.string()),
    supermemoryDocId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updates } = args;
    // Remove undefined values
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }
    await ctx.db.patch(sessionId, cleanUpdates);
  },
});

export const updateProcessingStatus = mutation({
  args: {
    sessionId: v.id("sessions"),
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
    await ctx.db.patch(args.sessionId, updates);
  },
});

export const createAndProcess = mutation({
  args: {
    appointmentId: v.id("appointments"),
    patientClerkId: v.string(),
    doctorClerkId: v.string(),
    audioStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Create session record with processing status
    const sessionId = await ctx.db.insert("sessions", {
      appointmentId: args.appointmentId,
      patientClerkId: args.patientClerkId,
      doctorClerkId: args.doctorClerkId,
      audioStorageId: args.audioStorageId,
      processingStatus: "processing",
    });

    // Schedule AI summarization as background job
    await ctx.scheduler.runAfter(0, api.actions.summarizeSession.summarizeSession, {
      sessionId,
      appointmentId: args.appointmentId,
      audioStorageId: args.audioStorageId,
      patientClerkId: args.patientClerkId,
      doctorClerkId: args.doctorClerkId,
    });

    return sessionId;
  },
});
