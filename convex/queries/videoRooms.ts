import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByAppointment = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videoRooms")
      .withIndex("by_appointmentId", (q) =>
        q.eq("appointmentId", args.appointmentId)
      )
      .first();
  },
});

export const getByRoomId = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videoRooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();
  },
});

export const getSignals = query({
  args: {
    roomId: v.string(),
    excludeSenderClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const signals = await ctx.db
      .query("videoRoomSignals")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();

    return signals.filter((s) => s.senderClerkId !== args.excludeSenderClerkId);
  },
});

export const getActiveForDoctor = query({
  args: { doctorClerkId: v.string() },
  handler: async (ctx, args) => {
    const rooms = await ctx.db
      .query("videoRooms")
      .withIndex("by_doctorClerkId", (q) =>
        q.eq("doctorClerkId", args.doctorClerkId)
      )
      .collect();

    return rooms.filter((r) => r.status !== "ended");
  },
});

export const getActiveForPatient = query({
  args: { patientClerkId: v.string() },
  handler: async (ctx, args) => {
    const rooms = await ctx.db
      .query("videoRooms")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();

    return rooms.filter((r) => r.status !== "ended");
  },
});
