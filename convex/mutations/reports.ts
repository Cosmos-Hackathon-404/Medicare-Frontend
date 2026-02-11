import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    patientClerkId: v.string(),
    doctorClerkId: v.optional(v.string()),
    fileStorageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(), // "pdf" | "image"
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reports", {
      patientClerkId: args.patientClerkId,
      doctorClerkId: args.doctorClerkId,
      fileStorageId: args.fileStorageId,
      fileName: args.fileName,
      fileType: args.fileType,
    });
  },
});

export const updateAnalysis = mutation({
  args: {
    reportId: v.id("reports"),
    aiSummary: v.string(),
    criticalFlags: v.array(
      v.object({
        issue: v.string(),
        severity: v.string(),
        details: v.string(),
      })
    ),
    supermemoryDocId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { reportId, ...updates } = args;
    await ctx.db.patch(reportId, updates);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
