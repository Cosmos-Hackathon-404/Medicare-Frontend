import { query } from "../_generated/server";
import { v } from "convex/values";

export const getActiveForDoctor = query({
  args: { doctorClerkId: v.string() },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("criticalAlerts")
      .withIndex("by_status", (q) =>
        q.eq("doctorClerkId", args.doctorClerkId).eq("status", "active")
      )
      .collect();

    // Enrich with patient names
    const enriched = await Promise.all(
      alerts.map(async (alert) => {
        const patient = await ctx.db
          .query("patientProfiles")
          .withIndex("by_clerkUserId", (q) =>
            q.eq("clerkUserId", alert.patientClerkId)
          )
          .first();
        return {
          ...alert,
          patientName: patient?.name ?? "Unknown Patient",
        };
      })
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getAllForDoctor = query({
  args: { doctorClerkId: v.string() },
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("criticalAlerts")
      .withIndex("by_doctorClerkId", (q) =>
        q.eq("doctorClerkId", args.doctorClerkId)
      )
      .collect();

    const enriched = await Promise.all(
      alerts.map(async (alert) => {
        const patient = await ctx.db
          .query("patientProfiles")
          .withIndex("by_clerkUserId", (q) =>
            q.eq("clerkUserId", alert.patientClerkId)
          )
          .first();
        return {
          ...alert,
          patientName: patient?.name ?? "Unknown Patient",
        };
      })
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getForPatient = query({
  args: { patientClerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("criticalAlerts")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();
  },
});
