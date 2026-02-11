import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ===== Create Doctor Profile =====
export const createDoctorProfile = mutation({
  args: {
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    specialization: v.string(),
    licenseNumber: v.string(),
    bio: v.optional(v.string()),
    availableSlots: v.optional(
      v.array(
        v.object({
          day: v.string(),
          startTime: v.string(),
          endTime: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query("doctorProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("doctorProfiles", args);
  },
});

// ===== Create Patient Profile =====
export const createPatientProfile = mutation({
  args: {
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    age: v.number(),
    bloodGroup: v.optional(v.string()),
    allergies: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query("patientProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("patientProfiles", args);
  },
});

// ===== Get Doctor Profile by Clerk User ID =====
export const getDoctorProfile = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("doctorProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
  },
});

// ===== Get Patient Profile by Clerk User ID =====
export const getPatientProfile = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("patientProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
  },
});

// ===== Get User Role (check both tables) =====
export const getUserRole = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const doctor = await ctx.db
      .query("doctorProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (doctor) return { role: "doctor" as const, profile: doctor };

    const patient = await ctx.db
      .query("patientProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (patient) return { role: "patient" as const, profile: patient };

    return null;
  },
});
