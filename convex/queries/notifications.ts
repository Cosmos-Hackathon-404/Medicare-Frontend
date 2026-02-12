import { query } from "../_generated/server";
import { v } from "convex/values";

// Get all notifications for a user (newest first)
export const getForUser = query({
  args: { userClerkId: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userClerkId", (q) =>
        q.eq("userClerkId", args.userClerkId)
      )
      .order("desc")
      .take(50);
    return notifications;
  },
});

// Get unread notification count
export const getUnreadCount = query({
  args: { userClerkId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userClerkId_read", (q) =>
        q.eq("userClerkId", args.userClerkId).eq("read", false)
      )
      .collect();
    return unread.length;
  },
});
