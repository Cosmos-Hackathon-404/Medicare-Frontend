import { query } from "../_generated/server";
import { v } from "convex/values";

export const getByDoctor = query({
  args: { doctorClerkId: v.string() },
  handler: async (ctx, args) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorClerkId", (q) =>
        q.eq("doctorClerkId", args.doctorClerkId)
      )
      .collect();

    // Enrich with patient names
    const enriched = await Promise.all(
      appointments.map(async (apt) => {
        const patient = await ctx.db
          .query("patientProfiles")
          .withIndex("by_clerkUserId", (q) =>
            q.eq("clerkUserId", apt.patientClerkId)
          )
          .first();
        return {
          ...apt,
          patientName: patient?.name ?? "Unknown Patient",
        };
      })
    );
    return enriched;
  },
});

export const getByPatient = query({
  args: { patientClerkId: v.string() },
  handler: async (ctx, args) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();

    // Enrich with doctor names
    const enriched = await Promise.all(
      appointments.map(async (apt) => {
        const doctor = await ctx.db
          .query("doctorProfiles")
          .withIndex("by_clerkUserId", (q) =>
            q.eq("clerkUserId", apt.doctorClerkId)
          )
          .first();
        return {
          ...apt,
          doctorName: doctor?.name ?? "Unknown Doctor",
          doctorSpecialization: doctor?.specialization ?? "",
        };
      })
    );
    return enriched;
  },
});

export const getById = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.appointmentId);
  },
});

// Get unique doctors the patient has appointments with
export const getDoctorsForPatient = query({
  args: { patientClerkId: v.string() },
  handler: async (ctx, args) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();

    // Get unique doctor clerk IDs
    const uniqueDoctorIds = [
      ...new Set(appointments.map((a) => a.doctorClerkId)),
    ];

    // Fetch doctor profiles
    const doctors = await Promise.all(
      uniqueDoctorIds.map(async (clerkId) => {
        const doctor = await ctx.db
          .query("doctorProfiles")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkId))
          .first();
        return doctor
          ? {
              clerkUserId: doctor.clerkUserId,
              name: doctor.name,
              specialization: doctor.specialization,
            }
          : null;
      })
    );

    return doctors.filter(Boolean);
  },
});

// Get unique patients the doctor has appointments with
export const getPatientsForDoctor = query({
  args: { doctorClerkId: v.string() },
  handler: async (ctx, args) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorClerkId", (q) =>
        q.eq("doctorClerkId", args.doctorClerkId)
      )
      .collect();

    // Get unique patient clerk IDs
    const uniquePatientIds = [
      ...new Set(appointments.map((a) => a.patientClerkId)),
    ];

    // Fetch patient profiles
    const patients = await Promise.all(
      uniquePatientIds.map(async (clerkId) => {
        const patient = await ctx.db
          .query("patientProfiles")
          .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkId))
          .first();
        return patient
          ? {
              clerkUserId: patient.clerkUserId,
              name: patient.name,
            }
          : null;
      })
    );

    return patients.filter(Boolean);
  },
});
