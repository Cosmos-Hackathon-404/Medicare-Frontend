import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Create a notification (internal — called by cron/actions)
export const create = internalMutation({
  args: {
    userClerkId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    appointmentId: v.optional(v.id("appointments")),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      read: false,
    });
  },
});

// Mark a single notification as read
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

// Mark all notifications as read for a user
export const markAllAsRead = mutation({
  args: { userClerkId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userClerkId_read", (q) =>
        q.eq("userClerkId", args.userClerkId).eq("read", false)
      )
      .collect();
    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { read: true }))
    );
  },
});

// Record that a reminder was sent (internal — prevents duplicates)
export const recordReminderSent = internalMutation({
  args: {
    appointmentId: v.id("appointments"),
    userClerkId: v.string(),
    type: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("remindersSent", {
      ...args,
      sentAt: new Date().toISOString(),
    });
  },
});
