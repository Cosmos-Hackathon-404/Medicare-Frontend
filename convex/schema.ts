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
    notes: v.optional(v.string()),
  })
    .index("by_doctorClerkId", ["doctorClerkId"])
    .index("by_patientClerkId", ["patientClerkId"])
    .index("by_status", ["status"]),

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
  })
    .index("by_appointmentId", ["appointmentId"])
    .index("by_patientClerkId", ["patientClerkId"])
    .index("by_doctorClerkId", ["doctorClerkId"]),

  reports: defineTable({
    patientClerkId: v.string(),
    doctorClerkId: v.optional(v.string()), // null if patient uploads before seeing doctor
    fileStorageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(), // "pdf" | "image"
    aiSummary: v.optional(v.string()),
    criticalFlags: v.optional(
      v.array(
        v.object({
          issue: v.string(),
          severity: v.string(), // "high" | "medium" | "low"
          details: v.string(),
        })
      )
    ),
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
});
