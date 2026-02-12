import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveMessage = mutation({
  args: {
    userClerkId: v.string(),
    role: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiChatMessages", {
      userClerkId: args.userClerkId,
      role: args.role,
      content: args.content,
    });
  },
});

export const clearHistory = mutation({
  args: { userClerkId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_userClerkId", (q) =>
        q.eq("userClerkId", args.userClerkId)
      )
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    return messages.length;
  },
});
