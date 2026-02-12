import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export const saveMessage = mutation({
  args: {
    userClerkId: v.string(),
    role: v.string(),
    content: v.string(),
    conversationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiChatMessages", {
      userClerkId: args.userClerkId,
      conversationId: args.conversationId ?? "default",
      role: args.role,
      content: args.content,
    });
  },
});

export const createConversation = mutation({
  args: {
    userClerkId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("aiChatConversations", {
      userClerkId: args.userClerkId,
      title: args.title,
      lastMessageTime: Date.now(),
      messageCount: 0,
    });
    return id;
  },
});

export const sendMessage = mutation({
  args: {
    userClerkId: v.string(),
    message: v.string(),
    conversationId: v.string(),
    reportIds: v.optional(v.array(v.string())),
    useMemory: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Save user message immediately so it appears in the UI
    await ctx.db.insert("aiChatMessages", {
      userClerkId: args.userClerkId,
      conversationId: args.conversationId,
      role: "user",
      content: args.message,
    });

    // Update conversation metadata
    const conversations = await ctx.db
      .query("aiChatConversations")
      .filter((q) => q.eq(q.field("_id"), args.conversationId as any))
      .collect();
    
    if (conversations.length > 0) {
      const conv = conversations[0];
      await ctx.db.patch(conv._id, {
        lastMessageTime: Date.now(),
        messageCount: conv.messageCount + 1,
      });
    }

    // Schedule AI response as background job
    await ctx.scheduler.runAfter(0, api.actions.aiChat.chat, {
      userClerkId: args.userClerkId,
      message: args.message,
      conversationId: args.conversationId,
      reportIds: args.reportIds,
      useMemory: args.useMemory ?? true,
    });
  },
});

export const clearHistory = mutation({
  args: { userClerkId: v.string(), conversationId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.conversationId) {
      // Delete messages for specific conversation
      const messages = await ctx.db
        .query("aiChatMessages")
        .withIndex("by_conversationId", (q) =>
          q.eq("conversationId", args.conversationId!)
        )
        .collect();

      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }

      // Delete the conversation record
      const conversations = await ctx.db
        .query("aiChatConversations")
        .filter((q) => q.eq(q.field("_id"), args.conversationId as any))
        .collect();
      
      for (const conv of conversations) {
        await ctx.db.delete(conv._id);
      }

      return messages.length;
    }

    // Legacy: clear all messages for user
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

export const deleteConversation = mutation({
  args: { conversationId: v.id("aiChatConversations") },
  handler: async (ctx, args) => {
    // Delete all messages in this conversation
    const convDoc = await ctx.db.get(args.conversationId);
    if (!convDoc) return;

    const messages = await ctx.db
      .query("aiChatMessages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.conversationId);
  },
});
