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

// Get room with full participant details for the session page
export const getRoomWithParticipants = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("videoRooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!room) return null;

    const appointment = await ctx.db.get(room.appointmentId);

    const doctor = await ctx.db
      .query("doctorProfiles")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", room.doctorClerkId)
      )
      .first();

    const patient = await ctx.db
      .query("patientProfiles")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", room.patientClerkId)
      )
      .first();

    return {
      ...room,
      appointment,
      doctorName: doctor?.name ?? "Doctor",
      doctorSpecialization: doctor?.specialization ?? "",
      patientName: patient?.name ?? "Patient",
      patientAge: patient?.age,
      patientAllergies: patient?.allergies,
    };
  },
});

// Get session summary for a completed room
export const getSessionForRoom = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("videoRooms")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!room) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_appointmentId", (q) =>
        q.eq("appointmentId", room.appointmentId)
      )
      .first();

    if (!session) return null;

    const doctor = await ctx.db
      .query("doctorProfiles")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", room.doctorClerkId)
      )
      .first();

    const patient = await ctx.db
      .query("patientProfiles")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", room.patientClerkId)
      )
      .first();

    return {
      ...session,
      room,
      doctorName: doctor?.name ?? "Doctor",
      doctorSpecialization: doctor?.specialization ?? "",
      patientName: patient?.name ?? "Patient",
    };
  },
});
