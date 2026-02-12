import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    patientId: v.id("patientProfiles"),
    doctorId: v.id("doctorProfiles"),
    patientClerkId: v.string(),
    doctorClerkId: v.string(),
    dateTime: v.string(),
    type: v.optional(v.string()), // "offline" | "online"
    notes: v.optional(v.string()),
    sharedReportIds: v.optional(v.array(v.id("reports"))),
  },
  handler: async (ctx, args) => {
    const appointmentId = await ctx.db.insert("appointments", {
      ...args,
      type: args.type ?? "offline",
      status: "scheduled",
    });

    // If online appointment, auto-create a video room
    if (args.type === "online") {
      const roomId = `room_${appointmentId}_${Date.now()}`;
      await ctx.db.insert("videoRooms", {
        appointmentId,
        roomId,
        doctorClerkId: args.doctorClerkId,
        patientClerkId: args.patientClerkId,
        status: "waiting",
      });
    }

    return appointmentId;
  },
});

export const updateStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.string(), // "scheduled" | "completed" | "cancelled"
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.appointmentId, { status: args.status });

    // If cancelled, also end any active video room
    if (args.status === "cancelled") {
      const videoRoom = await ctx.db
        .query("videoRooms")
        .withIndex("by_appointmentId", (q) =>
          q.eq("appointmentId", args.appointmentId)
        )
        .first();
      if (videoRoom && videoRoom.status !== "ended") {
        await ctx.db.patch(videoRoom._id, {
          status: "ended",
          endedAt: new Date().toISOString(),
        });
      }
    }
  },
});

export const cancel = mutation({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.appointmentId, { status: "cancelled" });

    // End any active video room
    const videoRoom = await ctx.db
      .query("videoRooms")
      .withIndex("by_appointmentId", (q) =>
        q.eq("appointmentId", args.appointmentId)
      )
      .first();
    if (videoRoom && videoRoom.status !== "ended") {
      await ctx.db.patch(videoRoom._id, {
        status: "ended",
        endedAt: new Date().toISOString(),
      });
    }
  },
});
