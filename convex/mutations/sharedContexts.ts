import { mutation } from "../_generated/server";
import { v } from "convex/values";

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
