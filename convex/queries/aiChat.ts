import { query } from "../_generated/server";
import { v } from "convex/values";

export const getMessages = query({
  args: { userClerkId: v.string(), conversationId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.conversationId) {
      return await ctx.db
        .query("aiChatMessages")
        .withIndex("by_conversationId", (q) =>
          q.eq("conversationId", args.conversationId!)
        )
        .collect();
    }
    // Fallback: get all messages for user (legacy support)
    return await ctx.db
      .query("aiChatMessages")
      .withIndex("by_userClerkId", (q) =>
        q.eq("userClerkId", args.userClerkId)
      )
      .collect();
  },
});

export const getConversations = query({
  args: { userClerkId: v.string() },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("aiChatConversations")
      .withIndex("by_userClerkId", (q) =>
        q.eq("userClerkId", args.userClerkId)
      )
      .collect();

    // Sort by last message time descending
    return conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  },
});
