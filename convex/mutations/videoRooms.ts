import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const joinRoom = mutation({
  args: {
    appointmentId: v.id("appointments"),
    clerkUserId: v.string(),
    role: v.string(), // "doctor" | "patient"
  },
  handler: async (ctx, args) => {
    const videoRoom = await ctx.db
      .query("videoRooms")
      .withIndex("by_appointmentId", (q) =>
        q.eq("appointmentId", args.appointmentId)
      )
      .first();

    if (!videoRoom) {
      throw new Error("Video room not found for this appointment");
    }

    const now = new Date().toISOString();
    const updates: Record<string, string> = {};

    if (args.role === "doctor") {
      updates.doctorJoinedAt = now;
    } else {
      updates.patientJoinedAt = now;
    }

    // If both participants have joined, set to active
    const doctorJoined = args.role === "doctor" || !!videoRoom.doctorJoinedAt;
    const patientJoined = args.role === "patient" || !!videoRoom.patientJoinedAt;

    if (doctorJoined && patientJoined) {
      updates.status = "active";
    }

    await ctx.db.patch(videoRoom._id, updates as Record<string, string>);

    return videoRoom;
  },
});

export const endRoom = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const videoRoom = await ctx.db
      .query("videoRooms")
      .withIndex("by_appointmentId", (q) =>
        q.eq("appointmentId", args.appointmentId)
      )
      .first();

    if (!videoRoom) {
      throw new Error("Video room not found");
    }

    const now = new Date().toISOString();
    let duration: number | undefined;

    // Calculate duration if both joined
    if (videoRoom.doctorJoinedAt && videoRoom.patientJoinedAt) {
      const startTime = new Date(
        Math.max(
          new Date(videoRoom.doctorJoinedAt).getTime(),
          new Date(videoRoom.patientJoinedAt).getTime()
        )
      );
      duration = Math.round((Date.now() - startTime.getTime()) / 1000);
    }

    await ctx.db.patch(videoRoom._id, {
      status: "ended",
      endedAt: now,
      ...(duration !== undefined ? { duration } : {}),
    });

    return { duration };
  },
});

export const updateSignal = mutation({
  args: {
    roomId: v.string(),
    senderClerkId: v.string(),
    signal: v.string(), // JSON stringified WebRTC signaling data
  },
  handler: async (ctx, args) => {
    // Store signaling data in a separate signals collection for real-time exchange
    // We use the videoRoomSignals table for WebRTC signaling
    return await ctx.db.insert("videoRoomSignals", {
      roomId: args.roomId,
      senderClerkId: args.senderClerkId,
      signal: args.signal,
      createdAt: Date.now(),
    });
  },
});

export const clearSignals = mutation({
  args: {
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    const signals = await ctx.db
      .query("videoRoomSignals")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();

    for (const signal of signals) {
      await ctx.db.delete(signal._id);
    }
  },
});
