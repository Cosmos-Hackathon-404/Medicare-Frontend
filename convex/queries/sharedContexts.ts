import { query } from "../_generated/server";
import { v } from "convex/values";

export const getForDoctor = query({
  args: { doctorClerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sharedContexts")
      .withIndex("by_toDoctorClerkId", (q) =>
        q.eq("toDoctorClerkId", args.doctorClerkId)
      )
      .collect();
  },
});

export const getByPatient = query({
  args: { patientClerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sharedContexts")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();
  },
});
