import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// Reset an ended room back to "waiting" so participants can rejoin
export const rejoinRoom = mutation({
  args: {
    roomId: v.string(),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const videoRoom = await ctx.db
      .query("videoRooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!videoRoom) throw new Error("Video room not found");

    // Only a participant can reset the room
    if (
      videoRoom.doctorClerkId !== args.clerkUserId &&
      videoRoom.patientClerkId !== args.clerkUserId
    ) {
      throw new Error("Not authorized");
    }

    // Only reset if currently ended
    if (videoRoom.status !== "ended") return videoRoom;

    await ctx.db.patch(videoRoom._id, {
      status: "waiting",
      doctorJoinedAt: undefined,
      patientJoinedAt: undefined,
      endedAt: undefined,
      duration: undefined,
    });

    // Clear stale signals
    const signals = await ctx.db
      .query("videoRoomSignals")
      .withIndex("by_roomId", (q) => q.eq("roomId", videoRoom.roomId))
      .collect();
    for (const signal of signals) {
      await ctx.db.delete(signal._id);
    }

    return { ...videoRoom, status: "waiting" };
  },
});

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

// End room + upload audio + create session + trigger AI summarization
export const endRoomWithSession = mutation({
  args: {
    appointmentId: v.id("appointments"),
    audioStorageId: v.optional(v.id("_storage")),
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

    // Calculate duration
    const now = new Date().toISOString();
    let duration: number | undefined;
    if (videoRoom.doctorJoinedAt && videoRoom.patientJoinedAt) {
      const startTime = new Date(
        Math.max(
          new Date(videoRoom.doctorJoinedAt).getTime(),
          new Date(videoRoom.patientJoinedAt).getTime()
        )
      );
      duration = Math.round((Date.now() - startTime.getTime()) / 1000);
    }

    // End the video room
    await ctx.db.patch(videoRoom._id, {
      status: "ended",
      endedAt: now,
      ...(duration !== undefined ? { duration } : {}),
    });

    // Clear signals
    const signals = await ctx.db
      .query("videoRoomSignals")
      .withIndex("by_roomId", (q) => q.eq("roomId", videoRoom.roomId))
      .collect();
    for (const signal of signals) {
      await ctx.db.delete(signal._id);
    }

    // If audio was recorded, create session and trigger AI summarization
    if (args.audioStorageId) {
      const sessionId = await ctx.db.insert("sessions", {
        appointmentId: args.appointmentId,
        patientClerkId: videoRoom.patientClerkId,
        doctorClerkId: videoRoom.doctorClerkId,
        audioStorageId: args.audioStorageId,
        processingStatus: "processing",
      });

      // Schedule AI summarization in background
      await ctx.scheduler.runAfter(
        0,
        api.actions.summarizeSession.summarizeSession,
        {
          sessionId,
          appointmentId: args.appointmentId,
          audioStorageId: args.audioStorageId,
          patientClerkId: videoRoom.patientClerkId,
          doctorClerkId: videoRoom.doctorClerkId,
        }
      );

      return { duration, sessionId, roomId: videoRoom.roomId };
    }

    return { duration, sessionId: null, roomId: videoRoom.roomId };
  },
});
