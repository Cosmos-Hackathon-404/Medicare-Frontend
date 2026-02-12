import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const updateProfile = mutation({
  args: {
    clerkUserId: v.string(),
    name: v.optional(v.string()),
    age: v.optional(v.number()),
    bloodGroup: v.optional(v.string()),
    allergies: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db
      .query("patientProfiles")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .first();

    if (!patient) throw new Error("Patient profile not found");

    const updates: Record<string, string | number | undefined> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.age !== undefined) updates.age = args.age;
    if (args.bloodGroup !== undefined) updates.bloodGroup = args.bloodGroup;
    if (args.allergies !== undefined) updates.allergies = args.allergies;
    if (args.emergencyContact !== undefined)
      updates.emergencyContact = args.emergencyContact;

    await ctx.db.patch(patient._id, updates);
    return patient._id;
  },
});
