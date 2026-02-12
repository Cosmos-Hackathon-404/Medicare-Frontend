import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByPatient = query({
  args: { patientClerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();
  },
});

export const getByDoctor = query({
  args: { doctorClerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_doctorClerkId", (q) =>
        q.eq("doctorClerkId", args.doctorClerkId)
      )
      .collect();
  },
});

export const getById = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.reportId);
  },
});

export const getByIds = query({
  args: { reportIds: v.array(v.id("reports")) },
  handler: async (ctx, args) => {
    const reports = await Promise.all(
      args.reportIds.map((id) => ctx.db.get(id))
    );
    return reports.filter(Boolean);
  },
});

export const getFileUrl = query({
  args: { fileStorageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileStorageId);
  },
});
