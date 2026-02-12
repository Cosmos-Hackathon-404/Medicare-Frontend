import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    patientId: v.id("patientProfiles"),
    doctorId: v.id("doctorProfiles"),
    patientClerkId: v.string(),
    doctorClerkId: v.string(),
    dateTime: v.string(),
    notes: v.optional(v.string()),
    sharedReportIds: v.optional(v.array(v.id("reports"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("appointments", {
      ...args,
      status: "scheduled",
    });
  },
});

export const updateStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.string(), // "scheduled" | "completed" | "cancelled"
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.appointmentId, { status: args.status });
  },
});

export const cancel = mutation({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.appointmentId, { status: "cancelled" });
  },
});
