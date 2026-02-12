import { query } from "../_generated/server";
import { v } from "convex/values";

// Get all messages between two users (both directions), sorted by time
export const getConversation = query({
  args: {
    userAClerkId: v.string(),
    userBClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Messages from A → B
    const aToBMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q
          .eq("senderClerkId", args.userAClerkId)
          .eq("receiverClerkId", args.userBClerkId)
      )
      .collect();

    // Messages from B → A
    const bToAMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q
          .eq("senderClerkId", args.userBClerkId)
          .eq("receiverClerkId", args.userAClerkId)
      )
      .collect();

    // Merge and sort by creation time
    const allMessages = [...aToBMessages, ...bToAMessages].sort(
      (a, b) => a._creationTime - b._creationTime
    );

    return allMessages;
  },
});

// Get all unique conversation partners for a user, with last message preview
export const getConversations = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    // Messages sent by user
    const sent = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("senderClerkId", args.clerkUserId)
      )
      .collect();

    // Messages received by user
    const received = await ctx.db
      .query("messages")
      .withIndex("by_receiverClerkId", (q) =>
        q.eq("receiverClerkId", args.clerkUserId)
      )
      .collect();

    // Build a map of partner → latest message
    const partnerMap = new Map<
      string,
      {
        partnerClerkId: string;
        lastMessage: string;
        lastMessageTime: number;
        unreadCount: number;
      }
    >();

    for (const msg of [...sent, ...received]) {
      const partnerId =
        msg.senderClerkId === args.clerkUserId
          ? msg.receiverClerkId
          : msg.senderClerkId;

      const existing = partnerMap.get(partnerId);
      const isUnread =
        msg.receiverClerkId === args.clerkUserId && !msg.read;

      if (!existing || msg._creationTime > existing.lastMessageTime) {
        partnerMap.set(partnerId, {
          partnerClerkId: partnerId,
          lastMessage: msg.content,
          lastMessageTime: msg._creationTime,
          unreadCount: (existing?.unreadCount ?? 0) + (isUnread ? 1 : 0),
        });
      } else if (isUnread) {
        existing.unreadCount += 1;
      }
    }

    // Sort by most recent message
    return Array.from(partnerMap.values()).sort(
      (a, b) => b.lastMessageTime - a.lastMessageTime
    );
  },
});

// Get unread message count for a user
export const getUnreadCount = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_receiverClerkId", (q) =>
        q.eq("receiverClerkId", args.clerkUserId)
      )
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    return unread.length;
  },
});
