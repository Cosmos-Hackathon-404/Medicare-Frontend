import { query } from "../_generated/server";
import { v } from "convex/values";

export const getMessages = query({
  args: { userClerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiChatMessages")
      .withIndex("by_userClerkId", (q) =>
        q.eq("userClerkId", args.userClerkId)
      )
      .collect();
  },
});
