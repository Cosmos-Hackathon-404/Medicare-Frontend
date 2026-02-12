import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const send = mutation({
  args: {
    senderClerkId: v.string(),
    receiverClerkId: v.string(),
    senderRole: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      senderClerkId: args.senderClerkId,
      receiverClerkId: args.receiverClerkId,
      senderRole: args.senderRole,
      content: args.content,
      read: false,
    });
  },
});

export const markAsRead = mutation({
  args: {
    senderClerkId: v.string(),
    receiverClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Mark all messages from sender to receiver as read
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q
          .eq("senderClerkId", args.senderClerkId)
          .eq("receiverClerkId", args.receiverClerkId)
      )
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    for (const msg of unread) {
      await ctx.db.patch(msg._id, { read: true });
    }

    return unread.length;
  },
});
