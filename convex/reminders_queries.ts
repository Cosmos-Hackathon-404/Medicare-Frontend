import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal queries used by the reminder cron system.
 * Not exposed to clients.
 */

// Get all "scheduled" appointments that are in the future (within next 25 hours)
export const getUpcomingScheduledAppointments = internalQuery({
  args: {},
  handler: async (ctx) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .collect();

    const now = Date.now();
    const twentyFiveHoursFromNow = now + 25 * 60 * 60 * 1000;

    // Filter to only appointments within the next 25 hours
    const upcoming = [];
    for (const apt of appointments) {
      const aptTime = new Date(apt.dateTime).getTime();
      if (aptTime > now && aptTime <= twentyFiveHoursFromNow) {
        // Enrich with patient and doctor info
        const patient = await ctx.db
          .query("patientProfiles")
          .withIndex("by_clerkUserId", (q) =>
            q.eq("clerkUserId", apt.patientClerkId)
          )
          .first();

        const doctor = await ctx.db
          .query("doctorProfiles")
          .withIndex("by_clerkUserId", (q) =>
            q.eq("clerkUserId", apt.doctorClerkId)
          )
          .first();

        upcoming.push({
          ...apt,
          patientName: patient?.name ?? "Patient",
          patientEmail: patient?.email ?? null,
          doctorName: doctor?.name ?? "Doctor",
          doctorEmail: doctor?.email ?? null,
        });
      }
    }

    return upcoming;
  },
});

// Check if a specific reminder was already sent
export const wasReminderSent = internalQuery({
  args: {
    appointmentId: v.id("appointments"),
    userClerkId: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("remindersSent")
      .withIndex("by_appointment_user_type", (q) =>
        q
          .eq("appointmentId", args.appointmentId)
          .eq("userClerkId", args.userClerkId)
          .eq("type", args.type)
      )
      .first();
    return existing !== null;
  },
});
