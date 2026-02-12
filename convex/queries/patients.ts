import { query } from "../_generated/server";
import { v } from "convex/values";

export const getById = query({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.patientId);
  },
});

export const getByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("patientProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
  },
});
