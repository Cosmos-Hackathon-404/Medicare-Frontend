import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export const create = mutation({
  args: {
    patientClerkId: v.string(),
    doctorClerkId: v.optional(v.string()),
    fileStorageId: v.id("_storage"),
    additionalFileStorageIds: v.optional(v.array(v.id("_storage"))),
    fileName: v.string(),
    fileType: v.union(v.literal("pdf"), v.literal("image")),
    fileSize: v.optional(v.number()),
    totalPages: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reports", {
      patientClerkId: args.patientClerkId,
      doctorClerkId: args.doctorClerkId,
      fileStorageId: args.fileStorageId,
      additionalFileStorageIds: args.additionalFileStorageIds,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      totalPages: args.totalPages,
      analysisStatus: "pending",
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
    recommendations: v.optional(v.array(v.string())),
    preDiagnosisInsights: v.optional(v.string()),
    supermemoryDocId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { reportId, ...updates } = args;
    await ctx.db.patch(reportId, {
      ...updates,
      analysisStatus: "completed",
    });
  },
});

export const updateAnalysisStatus = mutation({
  args: {
    reportId: v.id("reports"),
    analysisStatus: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      analysisStatus: args.analysisStatus,
    });
  },
});

export const deleteReport = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    // Delete the primary file from storage
    try {
      await ctx.storage.delete(report.fileStorageId);
    } catch {
      // File may already be deleted
    }

    // Delete additional page files from storage
    if (report.additionalFileStorageIds) {
      for (const storageId of report.additionalFileStorageIds) {
        try {
          await ctx.storage.delete(storageId);
        } catch {
          // File may already be deleted
        }
      }
    }

    // Delete associated critical alerts
    const alerts = await ctx.db
      .query("criticalAlerts")
      .filter((q) => q.eq(q.field("reportId"), args.reportId))
      .collect();
    for (const alert of alerts) {
      await ctx.db.delete(alert._id);
    }

    // Delete the report
    await ctx.db.delete(args.reportId);
  },
});

export const scheduleAnalysis = mutation({
  args: {
    reportId: v.id("reports"),
    fileStorageId: v.id("_storage"),
    additionalFileStorageIds: v.optional(v.array(v.id("_storage"))),
    fileType: v.string(),
    patientClerkId: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Mark as analyzing immediately so UI updates
    await ctx.db.patch(args.reportId, { analysisStatus: "analyzing" });
    // Schedule the AI analysis action to run in the background
    await ctx.scheduler.runAfter(0, api.actions.analyzeReport.analyzeReport, {
      reportId: args.reportId,
      fileStorageId: args.fileStorageId,
      additionalFileStorageIds: args.additionalFileStorageIds,
      fileType: args.fileType,
      patientClerkId: args.patientClerkId,
      language: args.language,
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
