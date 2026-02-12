import { query } from "../_generated/server";
import { v } from "convex/values";

export const search = query({
  args: {
    specialization: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let results;

    if (args.specialization) {
      results = await ctx.db
        .query("doctorProfiles")
        .withIndex("by_specialization", (q) =>
          q.eq("specialization", args.specialization!)
        )
        .collect();
    } else {
      results = await ctx.db.query("doctorProfiles").collect();
    }

    // Filter by name if provided (case-insensitive)
    if (args.name) {
      const searchName = args.name.toLowerCase();
      results = results.filter((doc) =>
        doc.name.toLowerCase().includes(searchName)
      );
    }

    return results;
  },
});

export const getById = query({
  args: { doctorId: v.id("doctorProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.doctorId);
  },
});

export const getByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("doctorProfiles")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .first();
  },
});

export const getAvailableSlots = query({
  args: { doctorId: v.id("doctorProfiles") },
  handler: async (ctx, args) => {
    const doctor = await ctx.db.get(args.doctorId);
    return doctor?.availableSlots ?? [];
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("doctorProfiles").collect();
  },
});
