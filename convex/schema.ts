import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Clerk handles auth — we store profile data here
  doctorProfiles: defineTable({
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    specialization: v.string(),
    licenseNumber: v.string(),
    bio: v.optional(v.string()),
    availableSlots: v.optional(
      v.array(
        v.object({
          day: v.string(), // "monday", "tuesday", etc.
          startTime: v.string(), // "09:00"
          endTime: v.string(), // "17:00"
        })
      )
    ),
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_specialization", ["specialization"]),

  patientProfiles: defineTable({
    clerkUserId: v.string(),
    name: v.string(),
    email: v.string(),
    age: v.number(),
    bloodGroup: v.optional(v.string()),
    allergies: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
  }).index("by_clerkUserId", ["clerkUserId"]),

  appointments: defineTable({
    patientId: v.id("patientProfiles"),
    doctorId: v.id("doctorProfiles"),
    patientClerkId: v.string(),
    doctorClerkId: v.string(),
    dateTime: v.string(), // ISO string
    status: v.string(), // "scheduled" | "completed" | "cancelled"
    type: v.optional(v.string()), // "offline" | "online" — defaults to "offline" for backward compat
    notes: v.optional(v.string()),
    sharedReportIds: v.optional(v.array(v.id("reports"))), // Reports shared with doctor for this appointment
  })
    .index("by_doctorClerkId", ["doctorClerkId"])
    .index("by_patientClerkId", ["patientClerkId"])
    .index("by_status", ["status"]),

  // ===== Video Rooms for Online Appointments =====
  videoRooms: defineTable({
    appointmentId: v.id("appointments"),
    roomId: v.string(), // Unique room identifier
    doctorClerkId: v.string(),
    patientClerkId: v.string(),
    status: v.string(), // "waiting" | "active" | "ended"
    doctorJoinedAt: v.optional(v.string()),
    patientJoinedAt: v.optional(v.string()),
    endedAt: v.optional(v.string()),
    duration: v.optional(v.number()), // Duration in seconds
  })
    .index("by_appointmentId", ["appointmentId"])
    .index("by_roomId", ["roomId"])
    .index("by_doctorClerkId", ["doctorClerkId"])
    .index("by_patientClerkId", ["patientClerkId"]),

  // ===== Video Room Signaling (WebRTC) =====
  videoRoomSignals: defineTable({
    roomId: v.string(),
    senderClerkId: v.string(),
    signal: v.string(), // JSON stringified WebRTC signaling data
    createdAt: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_senderClerkId", ["senderClerkId"]),

  sessions: defineTable({
    appointmentId: v.id("appointments"),
    patientClerkId: v.string(),
    doctorClerkId: v.string(),
    audioStorageId: v.optional(v.id("_storage")),
    transcript: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    keyDecisions: v.optional(v.array(v.string())),
    prescriptions: v.optional(v.string()),
    supermemoryDocId: v.optional(v.string()), // Supermemory document ID for this session
    processingStatus: v.optional(v.string()), // "processing" | "completed" | "failed"
    errorMessage: v.optional(v.string()), // Error details for failed processing
  })
    .index("by_appointmentId", ["appointmentId"])
    .index("by_patientClerkId", ["patientClerkId"])
    .index("by_doctorClerkId", ["doctorClerkId"]),

  reports: defineTable({
    patientClerkId: v.string(),
    doctorClerkId: v.optional(v.string()), // null if patient uploads before seeing doctor
    fileStorageId: v.id("_storage"),
    additionalFileStorageIds: v.optional(v.array(v.id("_storage"))), // extra pages of same report
    fileName: v.string(),
    fileType: v.union(v.literal("pdf"), v.literal("image")), // enforced file type
    fileSize: v.optional(v.number()), // file size in bytes
    totalPages: v.optional(v.number()), // total number of files/pages in this report
    aiSummary: v.optional(v.string()),
    analysisStatus: v.optional(v.string()), // "pending" | "analyzing" | "completed" | "failed"
    criticalFlags: v.optional(
      v.array(
        v.object({
          issue: v.string(),
          severity: v.string(), // "high" | "medium" | "low"
          details: v.string(),
        })
      )
    ),
    recommendations: v.optional(v.array(v.string())),
    preDiagnosisInsights: v.optional(v.string()),
    supermemoryDocId: v.optional(v.string()),
  })
    .index("by_patientClerkId", ["patientClerkId"])
    .index("by_doctorClerkId", ["doctorClerkId"]),

  sharedContexts: defineTable({
    patientClerkId: v.string(),
    fromDoctorClerkId: v.string(),
    toDoctorClerkId: v.string(),
    sessionIds: v.array(v.id("sessions")),
    reportIds: v.array(v.id("reports")),
    aiConsolidatedSummary: v.optional(v.string()),
    status: v.string(), // "pending" | "viewed"
    processingStatus: v.optional(v.string()), // "processing" | "completed" | "failed"
    errorMessage: v.optional(v.string()), // Error details for failed processing
  })
    .index("by_toDoctorClerkId", ["toDoctorClerkId"])
    .index("by_patientClerkId", ["patientClerkId"]),

  // ===== Chat Messages =====
  messages: defineTable({
    senderClerkId: v.string(),
    receiverClerkId: v.string(),
    senderRole: v.string(), // "doctor" | "patient"
    content: v.string(),
    read: v.boolean(),
  })
    .index("by_conversation", ["senderClerkId", "receiverClerkId"])
    .index("by_receiverClerkId", ["receiverClerkId"]),

  // ===== AI Chat Messages =====
  aiChatMessages: defineTable({
    userClerkId: v.string(),
    conversationId: v.optional(v.string()), // groups messages into conversations
    role: v.string(), // "user" | "assistant"
    content: v.string(),
  })
    .index("by_userClerkId", ["userClerkId"])
    .index("by_conversationId", ["conversationId"]),

  // ===== AI Chat Conversations =====
  aiChatConversations: defineTable({
    userClerkId: v.string(),
    title: v.string(), // auto-generated from first message
    lastMessageTime: v.number(),
    messageCount: v.number(),
  }).index("by_userClerkId", ["userClerkId"]),

  // ===== Patient Vitals =====
  vitals: defineTable({
    patientClerkId: v.string(),
    recordedAt: v.string(), // ISO date string
    type: v.string(), // "blood_pressure" | "blood_sugar" | "heart_rate" | "weight" | "temperature" | "oxygen_saturation"
    value: v.number(), // primary value
    secondaryValue: v.optional(v.number()), // e.g., diastolic for BP
    unit: v.string(), // "mmHg", "mg/dL", "bpm", "kg", "°F", "%"
    notes: v.optional(v.string()),
    source: v.string(), // "manual" | "ai_extracted"
  })
    .index("by_patientClerkId", ["patientClerkId"])
    .index("by_type", ["patientClerkId", "type"]),

  // ===== Critical Alerts =====
  criticalAlerts: defineTable({
    patientClerkId: v.string(),
    doctorClerkId: v.string(),
    reportId: v.optional(v.id("reports")),
    sessionId: v.optional(v.id("sessions")),
    type: v.string(), // "report_critical_flag" | "vitals_abnormal" | "drug_interaction"
    title: v.string(),
    message: v.string(),
    severity: v.string(), // "critical" | "urgent" | "warning"
    status: v.string(), // "active" | "acknowledged" | "resolved"
    acknowledgedAt: v.optional(v.string()),
  })
    .index("by_doctorClerkId", ["doctorClerkId"])
    .index("by_patientClerkId", ["patientClerkId"])
    .index("by_status", ["doctorClerkId", "status"]),

  // ===== AI Wellness Plans =====
  wellnessPlans: defineTable({
    patientClerkId: v.string(),
    generatedAt: v.string(),
    status: v.string(), // "generating" | "completed" | "failed"
    errorMessage: v.optional(v.string()),

    // Nutrition Plan
    nutrition: v.optional(
      v.object({
        dailyCalorieTarget: v.optional(v.string()),
        macroSplit: v.optional(
          v.object({
            protein: v.string(),
            carbs: v.string(),
            fats: v.string(),
          })
        ),
        meals: v.optional(
          v.array(
            v.object({
              name: v.string(),
              time: v.string(),
              items: v.array(v.string()),
              notes: v.optional(v.string()),
            })
          )
        ),
        foodsToInclude: v.optional(v.array(v.string())),
        foodsToAvoid: v.optional(v.array(v.string())),
        hydration: v.optional(v.string()),
        supplements: v.optional(v.array(v.string())),
      })
    ),

    // Exercise Plan
    exercise: v.optional(
      v.object({
        weeklyGoal: v.optional(v.string()),
        restrictions: v.optional(v.array(v.string())),
        routines: v.optional(
          v.array(
            v.object({
              day: v.string(),
              type: v.string(),
              duration: v.string(),
              exercises: v.array(v.string()),
              intensity: v.string(),
              notes: v.optional(v.string()),
            })
          )
        ),
      })
    ),

    // Lifestyle Recommendations
    lifestyle: v.optional(
      v.object({
        sleepRecommendation: v.optional(v.string()),
        sleepTips: v.optional(v.array(v.string())),
        stressManagement: v.optional(v.array(v.string())),
        habits: v.optional(v.array(v.string())),
      })
    ),

    // Mental Wellness
    mentalWellness: v.optional(
      v.object({
        recommendations: v.optional(v.array(v.string())),
        activities: v.optional(v.array(v.string())),
        warningSignsToWatch: v.optional(v.array(v.string())),
      })
    ),

    // Metadata
    additionalNotes: v.optional(v.string()),
    reviewDate: v.optional(v.string()),
    aiConfidence: v.optional(v.string()),
    dataSources: v.optional(v.array(v.string())),
  }).index("by_patientClerkId", ["patientClerkId"]),

  // ===== In-Platform Notifications =====
  notifications: defineTable({
    userClerkId: v.string(),
    type: v.string(), // "appointment_reminder_24h" | "appointment_reminder_1h"
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    appointmentId: v.optional(v.id("appointments")),
    link: v.optional(v.string()),
  })
    .index("by_userClerkId", ["userClerkId"])
    .index("by_userClerkId_read", ["userClerkId", "read"]),

  // ===== Reminder Tracking (prevents duplicate sends) =====
  remindersSent: defineTable({
    appointmentId: v.id("appointments"),
    userClerkId: v.string(),
    type: v.string(), // "24h" | "1h"
    channel: v.string(), // "in_app" | "email"
    sentAt: v.string(), // ISO string
  })
    .index("by_appointmentId", ["appointmentId"])
    .index("by_appointment_user_type", ["appointmentId", "userClerkId", "type"]),
});
