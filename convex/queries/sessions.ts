import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByPatient = query({
  args: { patientClerkId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();

    // Enrich with doctor names
    const enriched = await Promise.all(
      sessions.map(async (session) => {
        const doctor = await ctx.db
          .query("doctorProfiles")
          .withIndex("by_clerkUserId", (q) =>
            q.eq("clerkUserId", session.doctorClerkId)
          )
          .first();
        return {
          ...session,
          doctorName: doctor?.name ?? "Unknown Doctor",
          doctorSpecialization: doctor?.specialization ?? "",
        };
      })
    );
    return enriched;
  },
});

export const getByDoctor = query({
  args: { doctorClerkId: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_doctorClerkId", (q) =>
        q.eq("doctorClerkId", args.doctorClerkId)
      )
      .collect();

    const enriched = await Promise.all(
      sessions.map(async (session) => {
        const patient = await ctx.db
          .query("patientProfiles")
          .withIndex("by_clerkUserId", (q) =>
            q.eq("clerkUserId", session.patientClerkId)
          )
          .first();
        return {
          ...session,
          patientName: patient?.name ?? "Unknown Patient",
        };
      })
    );
    return enriched;
  },
});

export const getByAppointment = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_appointmentId", (q) =>
        q.eq("appointmentId", args.appointmentId)
      )
      .first();
  },
});

export const getByIds = query({
  args: { sessionIds: v.array(v.id("sessions")) },
  handler: async (ctx, args) => {
    const sessions = await Promise.all(
      args.sessionIds.map((id) => ctx.db.get(id))
    );
    return sessions.filter(Boolean);
  },
});

export const getAudioUrl = query({
  args: { audioStorageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.audioStorageId);
  },
});
