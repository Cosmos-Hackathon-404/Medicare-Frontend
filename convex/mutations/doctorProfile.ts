import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const updateAvailableSlots = mutation({
  args: {
    clerkUserId: v.string(),
    availableSlots: v.array(
      v.object({
        day: v.string(),
        startTime: v.string(),
        endTime: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const doctor = await ctx.db
      .query("doctorProfiles")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .first();

    if (!doctor) throw new Error("Doctor profile not found");

    await ctx.db.patch(doctor._id, {
      availableSlots: args.availableSlots,
    });

    return doctor._id;
  },
});

export const updateProfile = mutation({
  args: {
    clerkUserId: v.string(),
    name: v.optional(v.string()),
    specialization: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doctor = await ctx.db
      .query("doctorProfiles")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .first();

    if (!doctor) throw new Error("Doctor profile not found");

    const updates: Record<string, string> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.specialization !== undefined) updates.specialization = args.specialization;
    if (args.licenseNumber !== undefined) updates.licenseNumber = args.licenseNumber;
    if (args.bio !== undefined) updates.bio = args.bio;

    await ctx.db.patch(doctor._id, updates);
    return doctor._id;
  },
});
