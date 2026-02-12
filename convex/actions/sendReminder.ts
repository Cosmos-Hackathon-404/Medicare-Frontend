"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Resend } from "resend";

/**
 * sendReminderEmail — sends an appointment reminder email via Resend.
 *
 * Requires RESEND_API_KEY environment variable.
 * Set the FROM_EMAIL env var or defaults to "Medicare AI <reminders@yourdomain.com>".
 */
export const sendReminderEmail = internalAction({
  args: {
    to: v.string(), // recipient email
    recipientName: v.string(),
    role: v.string(), // "doctor" | "patient"
    otherPartyName: v.string(), // the other person's name
    appointmentDateTime: v.string(), // ISO string
    appointmentType: v.string(), // "online" | "offline"
    reminderType: v.string(), // "24h" | "1h"
    appointmentId: v.id("appointments"),
    userClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const fromEmail = process.env.FROM_EMAIL || "Medicare AI <onboarding@resend.dev>";

    const date = new Date(args.appointmentDateTime);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const timeLabel = args.reminderType === "24h" ? "tomorrow" : "in 1 hour";
    const roleLabel = args.role === "doctor" ? "Patient" : "Doctor";
    const typeLabel = args.appointmentType === "online" ? "Video Call" : "In-Person";

    const subject = `⏰ Appointment Reminder — ${timeLabel} at ${formattedTime}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); border-radius: 12px; padding: 24px; color: white; text-align: center; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 24px;">Medicare AI</h1>
          <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">Appointment Reminder</p>
        </div>

        <p style="font-size: 16px; color: #333;">Hello <strong>${args.recipientName}</strong>,</p>
        
        <p style="font-size: 16px; color: #333;">
          This is a friendly reminder that you have an appointment <strong>${timeLabel}</strong>.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📅 Date</td>
              <td style="padding: 8px 0; font-weight: 600; font-size: 14px; text-align: right;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">⏰ Time</td>
              <td style="padding: 8px 0; font-weight: 600; font-size: 14px; text-align: right;">${formattedTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">👤 ${roleLabel}</td>
              <td style="padding: 8px 0; font-weight: 600; font-size: 14px; text-align: right;">${args.otherPartyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📍 Type</td>
              <td style="padding: 8px 0; font-weight: 600; font-size: 14px; text-align: right;">${typeLabel}</td>
            </tr>
          </table>
        </div>

        ${
          args.appointmentType === "online"
            ? `<p style="font-size: 14px; color: #0f766e; background: #f0fdfa; border-radius: 6px; padding: 12px; text-align: center;">
                💻 This is a video appointment. You can join the call from your dashboard when it's time.
              </p>`
            : `<p style="font-size: 14px; color: #0f766e; background: #f0fdfa; border-radius: 6px; padding: 12px; text-align: center;">
                🏥 This is an in-person appointment. Please arrive on time.
              </p>`
        }

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          This is an automated reminder from Medicare AI. Please do not reply to this email.
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: fromEmail,
        to: args.to,
        subject,
        html,
      });

      // Record that email reminder was sent
      await ctx.runMutation(internal.mutations.notifications.recordReminderSent, {
        appointmentId: args.appointmentId,
        userClerkId: args.userClerkId,
        type: args.reminderType,
        channel: "email",
      });
    } catch (error) {
      console.error("Failed to send reminder email:", error);
      // Don't throw — we still want in-app notifications even if email fails
    }
  },
});
