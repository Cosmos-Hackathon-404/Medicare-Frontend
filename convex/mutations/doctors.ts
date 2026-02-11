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
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!doctor) throw new Error("Doctor profile not found");

    await ctx.db.patch(doctor._id, {
      availableSlots: args.availableSlots,
    });

    return doctor._id;
  },
});
