import { query } from "../_generated/server";
import { v } from "convex/values";

export const getDataReadiness = query({
  args: { patientClerkId: v.string() },
  handler: async (ctx, args) => {
    // Check patient profile completeness
    const patient = await ctx.db
      .query("patientProfiles")
      .withIndex("by_clerkUserId", (q) =>
        q.eq("clerkUserId", args.patientClerkId)
      )
      .first();

    const hasProfile = !!patient;
    const hasAge = !!patient?.age;
    const hasBloodGroup = !!patient?.bloodGroup;
    const hasAllergies = !!patient?.allergies;

    const profileFields = [hasAge, hasBloodGroup, hasAllergies].filter(Boolean).length;
    const profileComplete = profileFields >= 2; // at least 2 of 3 fields

    // Check vitals
    const vitals = await ctx.db
      .query("vitals")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();
    const hasVitals = vitals.length > 0;
    const vitalsCount = vitals.length;

    // Check reports
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();
    const analyzedReports = reports.filter((r) => r.analysisStatus === "completed");
    const hasReports = analyzedReports.length > 0;
    const reportsCount = analyzedReports.length;

    // Check sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();
    const completedSessions = sessions.filter((s) => s.aiSummary);
    const hasSessions = completedSessions.length > 0;
    const sessionsCount = completedSessions.length;

    // Scoring: profile basics = required, rest are bonus
    // Minimum: profile complete + at least 1 of (vitals, reports, sessions)
    const dataPoints = [
      profileComplete,
      hasVitals,
      hasReports,
      hasSessions,
    ].filter(Boolean).length;

    const ready = hasProfile && profileComplete && dataPoints >= 2;

    const sources = [];
    if (hasProfile) {
      sources.push({
        key: "profile",
        label: "Patient Profile",
        description: hasAge && hasBloodGroup && hasAllergies
          ? "Fully completed"
          : `${profileFields}/3 key fields filled`,
        present: true,
        sufficient: profileComplete,
      });
    } else {
      sources.push({
        key: "profile",
        label: "Patient Profile",
        description: "Profile not found",
        present: false,
        sufficient: false,
      });
    }

    sources.push({
      key: "vitals",
      label: "Health Vitals",
      description: hasVitals
        ? `${vitalsCount} reading${vitalsCount !== 1 ? "s" : ""} recorded`
        : "No vitals recorded yet",
      present: hasVitals,
      sufficient: hasVitals,
    });

    sources.push({
      key: "reports",
      label: "Medical Reports",
      description: hasReports
        ? `${reportsCount} analyzed report${reportsCount !== 1 ? "s" : ""}`
        : "No analyzed reports",
      present: hasReports,
      sufficient: hasReports,
    });

    sources.push({
      key: "sessions",
      label: "Doctor Sessions",
      description: hasSessions
        ? `${sessionsCount} session${sessionsCount !== 1 ? "s" : ""} with AI summary`
        : "No session history",
      present: hasSessions,
      sufficient: hasSessions,
    });

    return {
      ready,
      dataPoints,
      totalPossible: 4,
      sources,
      missingHint: !hasProfile
        ? "Complete your patient profile in Settings first."
        : !profileComplete
          ? "Fill in your blood group and allergies in Settings to help personalize your plan."
          : dataPoints < 2
            ? "Upload a medical report, record your vitals in Health Trends, or complete a doctor session to give AI enough context."
            : null,
    };
  },
});

export const getLatest = query({
  args: { patientClerkId: v.string() },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("wellnessPlans")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();

    if (plans.length === 0) return null;

    // Return the most recent plan
    return plans.sort((a, b) => b._creationTime - a._creationTime)[0];
  },
});

export const getAll = query({
  args: { patientClerkId: v.string() },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("wellnessPlans")
      .withIndex("by_patientClerkId", (q) =>
        q.eq("patientClerkId", args.patientClerkId)
      )
      .collect();

    return plans.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getById = query({
  args: { planId: v.id("wellnessPlans") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.planId);
  },
});
