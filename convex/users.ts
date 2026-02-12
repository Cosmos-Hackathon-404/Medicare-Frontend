import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ===== Nepal Medical Council (NMC) Recognized Hospitals =====
const NMC_RECOGNIZED_HOSPITALS = [
  "Tribhuvan University Teaching Hospital",
  "B.P. Koirala Institute of Health Sciences",
  "Bir Hospital",
  "Patan Hospital",
  "Kanti Children's Hospital",
  "Nepal Medical College",
  "Kathmandu Medical College",
  "KIST Medical College",
  "Manipal College of Medical Sciences",
  "Lumbini Medical College",
  "Universal College of Medical Sciences",
  "College of Medical Sciences",
  "National Academy of Medical Sciences",
  "Nepalgunj Medical College",
  "Chitwan Medical College",
  "Nobel Medical College",
  "Kathmandu University School of Medical Sciences",
  "Gandaki Medical College",
  "Pokhara Academy of Health Sciences",
  "Rapti Academy of Health Sciences",
  "Karnali Academy of Health Sciences",
  "Birat Medical College",
  "Devdaha Medical College",
  "Janaki Medical College",
  "National Medical College",
  "Nepal Army Institute of Health Sciences",
  "Nepal Police Hospital",
  "Grande International Hospital",
  "Norvic International Hospital",
  "Sumeru Hospital",
  "Om Hospital",
  "Hams Hospital",
  "Star Hospital",
  "Mediciti Hospital",
  "Vayodha Hospital",
];

// Validate NMC number format (numeric, 4-6 digits)
function isValidNmcNumber(nmcNumber: string): boolean {
  return /^\d{4,6}$/.test(nmcNumber.trim());
}

// ===== Create Doctor Profile =====
export const createDoctorProfile = mutation({
  args: {
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    specialization: v.string(),
    licenseNumber: v.string(),
    nmcNumber: v.string(),
    hospital: v.optional(v.string()),
    bio: v.optional(v.string()),
    availableSlots: v.optional(
      v.array(
        v.object({
          day: v.string(),
          startTime: v.string(),
          endTime: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query("doctorProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existing) return existing._id;

    // Validate NMC number format
    if (!isValidNmcNumber(args.nmcNumber)) {
      throw new Error(
        "Invalid NMC number. Must be a 4-6 digit number issued by Nepal Medical Council."
      );
    }

    // Check NMC number is not already registered
    const nmcExists = await ctx.db
      .query("doctorProfiles")
      .withIndex("by_nmcNumber", (q) => q.eq("nmcNumber", args.nmcNumber.trim()))
      .first();

    if (nmcExists) {
      throw new Error(
        "This NMC number is already registered with another doctor."
      );
    }

    // Verify hospital is in the recognized list (if provided)
    const hospitalVerified = args.hospital
      ? NMC_RECOGNIZED_HOSPITALS.some(
          (h) => h.toLowerCase() === args.hospital!.toLowerCase()
        )
      : false;

    // Doctor is verified if NMC number format is valid AND hospital is recognized
    const verified = hospitalVerified;

    return await ctx.db.insert("doctorProfiles", {
      ...args,
      nmcNumber: args.nmcNumber.trim(),
      verified,
    });
  },
});

// ===== Create Patient Profile =====
export const createPatientProfile = mutation({
  args: {
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    age: v.number(),
    bloodGroup: v.optional(v.string()),
    allergies: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query("patientProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("patientProfiles", args);
  },
});

// ===== Get Doctor Profile by Clerk User ID =====
export const getDoctorProfile = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("doctorProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
  },
});

// ===== Get Patient Profile by Clerk User ID =====
export const getPatientProfile = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("patientProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
  },
});

// ===== Get User Role (check both tables) =====
export const getUserRole = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const doctor = await ctx.db
      .query("doctorProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (doctor) return { role: "doctor" as const, profile: doctor };

    const patient = await ctx.db
      .query("patientProfiles")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (patient) return { role: "patient" as const, profile: patient };

    return null;
  },
});
