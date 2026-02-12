import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByPatient = query({
  args: { patientClerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vitals")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();
  },
});

export const getByType = query({
  args: {
    patientClerkId: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("vitals")
      .withIndex("by_type", (q) =>
        q.eq("patientClerkId", args.patientClerkId).eq("type", args.type)
      )
      .collect();
  },
});
