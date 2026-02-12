"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Reminder System
 *
 * Runs every 15 minutes via cron. For each "scheduled" appointment:
 *   - If it's within 24 hours → send 24h reminder (in-app + email)
 *   - If it's within 1 hour  → send 1h reminder  (in-app + email)
 *
 * Uses the `remindersSent` table to avoid duplicate sends.
 */
export const checkAndSendReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    // 1. Get all scheduled appointments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appointments: Record<string, any>[] = await ctx.runQuery(
      internal.reminders_queries.getUpcomingScheduledAppointments,
    );

    const now = Date.now();

    for (const apt of appointments) {
      const aptTime = new Date(apt.dateTime).getTime();
      const hoursUntil = (aptTime - now) / (1000 * 60 * 60);

      // Skip appointments in the past
      if (hoursUntil <= 0) continue;

      // Determine which reminders to send
      const remindersToSend: string[] = [];
      if (hoursUntil <= 1) {
        remindersToSend.push("1h");
      }
      if (hoursUntil <= 24) {
        remindersToSend.push("24h");
      }

      for (const reminderType of remindersToSend) {
        // Check & send for PATIENT
        const patientAlreadySent: boolean = await ctx.runQuery(
          internal.reminders_queries.wasReminderSent,
          {
            appointmentId: apt._id,
            userClerkId: apt.patientClerkId,
            type: reminderType,
          },
        );

        if (!patientAlreadySent) {
          const timeLabel = reminderType === "24h" ? "in 24 hours" : "in 1 hour";

          // Create in-app notification for patient
          await ctx.runMutation(internal.mutations.notifications.create, {
            userClerkId: apt.patientClerkId,
            type: `appointment_reminder_${reminderType}`,
            title: "Appointment Reminder",
            message: `Your appointment with Dr. ${apt.doctorName} is ${timeLabel} (${new Date(apt.dateTime).toLocaleString()})`,
            appointmentId: apt._id,
            link: "/patient/appointments",
          });

          // Record in-app reminder sent
          await ctx.runMutation(internal.mutations.notifications.recordReminderSent, {
            appointmentId: apt._id,
            userClerkId: apt.patientClerkId,
            type: reminderType,
            channel: "in_app",
          });

          // Send email to patient
          if (apt.patientEmail) {
            await ctx.runAction(internal.actions.sendReminder.sendReminderEmail, {
              to: apt.patientEmail,
              recipientName: apt.patientName,
              role: "patient",
              otherPartyName: apt.doctorName,
              appointmentDateTime: apt.dateTime,
              appointmentType: apt.type ?? "offline",
              reminderType,
              appointmentId: apt._id,
              userClerkId: apt.patientClerkId,
            });
          }
        }

        // Check & send for DOCTOR
        const doctorAlreadySent: boolean = await ctx.runQuery(
          internal.reminders_queries.wasReminderSent,
          {
            appointmentId: apt._id,
            userClerkId: apt.doctorClerkId,
            type: reminderType,
          },
        );

        if (!doctorAlreadySent) {
          const timeLabel = reminderType === "24h" ? "in 24 hours" : "in 1 hour";

          // Create in-app notification for doctor
          await ctx.runMutation(internal.mutations.notifications.create, {
            userClerkId: apt.doctorClerkId,
            type: `appointment_reminder_${reminderType}`,
            title: "Appointment Reminder",
            message: `Your appointment with ${apt.patientName} is ${timeLabel} (${new Date(apt.dateTime).toLocaleString()})`,
            appointmentId: apt._id,
            link: "/doctor/appointments",
          });

          // Record in-app reminder sent
          await ctx.runMutation(internal.mutations.notifications.recordReminderSent, {
            appointmentId: apt._id,
            userClerkId: apt.doctorClerkId,
            type: reminderType,
            channel: "in_app",
          });

          // Send email to doctor
          if (apt.doctorEmail) {
            await ctx.runAction(internal.actions.sendReminder.sendReminderEmail, {
              to: apt.doctorEmail,
              recipientName: apt.doctorName,
              role: "doctor",
              otherPartyName: apt.patientName,
              appointmentDateTime: apt.dateTime,
              appointmentType: apt.type ?? "offline",
              reminderType,
              appointmentId: apt._id,
              userClerkId: apt.doctorClerkId,
            });
          }
        }
      }
    }
  },
});
