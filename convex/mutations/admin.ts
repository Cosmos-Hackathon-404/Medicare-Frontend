import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Toggle doctor verification status (for admin use)
export const setDoctorVerified = mutation({
  args: {
    doctorId: v.id("doctorProfiles"),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const doctor = await ctx.db.get(args.doctorId);
    if (!doctor) throw new Error("Doctor not found");

    await ctx.db.patch(args.doctorId, { verified: args.verified });
    return args.doctorId;
  },
});

// Delete a doctor profile (for admin cleanup)
export const deleteDoctorProfile = mutation({
  args: { doctorId: v.id("doctorProfiles") },
  handler: async (ctx, args) => {
    const doctor = await ctx.db.get(args.doctorId);
    if (!doctor) throw new Error("Doctor not found");
    await ctx.db.delete(args.doctorId);
    return args.doctorId;
  },
});
