import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    patientClerkId: v.string(),
    doctorClerkId: v.string(),
    reportId: v.optional(v.id("reports")),
    sessionId: v.optional(v.id("sessions")),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    severity: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("criticalAlerts", {
      patientClerkId: args.patientClerkId,
      doctorClerkId: args.doctorClerkId,
      reportId: args.reportId,
      sessionId: args.sessionId,
      type: args.type,
      title: args.title,
      message: args.message,
      severity: args.severity,
      status: "active",
    });
  },
});

export const acknowledge = mutation({
  args: { alertId: v.id("criticalAlerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      status: "acknowledged",
      acknowledgedAt: new Date().toISOString(),
    });
  },
});

export const resolve = mutation({
  args: { alertId: v.id("criticalAlerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, {
      status: "resolved",
      acknowledgedAt: new Date().toISOString(),
    });
  },
});
