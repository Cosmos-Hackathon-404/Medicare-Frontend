import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByDoctor = query({
  args: { doctorClerkId: v.string() },
  handler: async (ctx, args) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorClerkId", (q) =>
        q.eq("doctorClerkId", args.doctorClerkId)
      )
      .collect();

    // Enrich with patient names
    const enriched = await Promise.all(
      appointments.map(async (apt) => {
        const patient = await ctx.db
          .query("patientProfiles")
          .withIndex("by_clerkUserId", (q) =>
            q.eq("clerkUserId", apt.patientClerkId)
          )
          .first();
        return {
          ...apt,
          patientName: patient?.name ?? "Unknown Patient",
        };
      })
    );
    return enriched;
  },
});

export const getByPatient = query({
  args: { patientClerkId: v.string() },
  handler: async (ctx, args) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();

    // Enrich with doctor names
    const enriched = await Promise.all(
      appointments.map(async (apt) => {
        const doctor = await ctx.db
          .query("doctorProfiles")
          .withIndex("by_clerkUserId", (q) =>
            q.eq("clerkUserId", apt.doctorClerkId)
          )
          .first();
        return {
          ...apt,
          doctorName: doctor?.name ?? "Unknown Doctor",
          doctorSpecialization: doctor?.specialization ?? "",
        };
      })
    );
    return enriched;
  },
});

export const getById = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.appointmentId);
  },
});
