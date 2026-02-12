import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const record = mutation({
  args: {
    patientClerkId: v.string(),
    recordedAt: v.string(),
    type: v.string(),
    value: v.number(),
    secondaryValue: v.optional(v.number()),
    unit: v.string(),
    notes: v.optional(v.string()),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("vitals", {
      patientClerkId: args.patientClerkId,
      recordedAt: args.recordedAt,
      type: args.type,
      value: args.value,
      secondaryValue: args.secondaryValue,
      unit: args.unit,
      notes: args.notes,
      source: args.source,
    });
  },
});

export const recordBatch = mutation({
  args: {
    vitals: v.array(
      v.object({
        patientClerkId: v.string(),
        recordedAt: v.string(),
        type: v.string(),
        value: v.number(),
        secondaryValue: v.optional(v.number()),
        unit: v.string(),
        notes: v.optional(v.string()),
        source: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const vital of args.vitals) {
      const id = await ctx.db.insert("vitals", vital);
      ids.push(id);
    }
    return ids;
  },
});

export const remove = mutation({
  args: { vitalId: v.id("vitals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.vitalId);
  },
});
