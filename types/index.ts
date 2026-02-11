// NOTE: Once `npx convex dev` is run and _generated types are available,
// you can import `Id` from "convex/_generated/dataModel" for stronger typing.
// Until then, we use a generic string-branded type as a placeholder.
type Id<T extends string> = string & { __tableName: T };

// ===== Slot Type =====
export interface AvailableSlot {
  day: string; // "monday", "tuesday", etc.
  startTime: string; // "09:00"
  endTime: string; // "17:00"
}

// ===== Doctor Profile =====
export interface DoctorProfile {
  _id: Id<"doctorProfiles">;
  _creationTime: number;
  clerkUserId: string;
  name: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  bio?: string;
  availableSlots?: AvailableSlot[];
}

// ===== Patient Profile =====
export interface PatientProfile {
  _id: Id<"patientProfiles">;
  _creationTime: number;
  clerkUserId: string;
  name: string;
  email: string;
  age: number;
  bloodGroup?: string;
  allergies?: string;
  emergencyContact?: string;
}

// ===== Appointment =====
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Appointment {
  _id: Id<"appointments">;
  _creationTime: number;
  patientId: Id<"patientProfiles">;
  doctorId: Id<"doctorProfiles">;
  patientClerkId: string;
  doctorClerkId: string;
  dateTime: string; // ISO string
  status: AppointmentStatus;
  notes?: string;
}

// ===== Session =====
export interface Session {
  _id: Id<"sessions">;
  _creationTime: number;
  appointmentId: Id<"appointments">;
  patientClerkId: string;
  doctorClerkId: string;
  audioStorageId?: Id<"_storage">;
  transcript?: string;
  aiSummary?: string;
  keyDecisions?: string[];
  prescriptions?: string;
  supermemoryDocId?: string;
}

// ===== Critical Flag =====
export type FlagSeverity = "high" | "medium" | "low";

export interface CriticalFlag {
  issue: string;
  severity: FlagSeverity;
  details: string;
}

// ===== Report =====
export type ReportFileType = "pdf" | "image";

export interface Report {
  _id: Id<"reports">;
  _creationTime: number;
  patientClerkId: string;
  doctorClerkId?: string;
  fileStorageId: Id<"_storage">;
  fileName: string;
  fileType: ReportFileType;
  aiSummary?: string;
  criticalFlags?: CriticalFlag[];
  supermemoryDocId?: string;
}

// ===== Shared Context =====
export type SharedContextStatus = "pending" | "viewed";

export interface SharedContext {
  _id: Id<"sharedContexts">;
  _creationTime: number;
  patientClerkId: string;
  fromDoctorClerkId: string;
  toDoctorClerkId: string;
  sessionIds: Id<"sessions">[];
  reportIds: Id<"reports">[];
  aiConsolidatedSummary?: string;
  status: SharedContextStatus;
}

// ===== User Role =====
export type UserRole = "doctor" | "patient";

// ===== Session Summary (AI Output) =====
export interface SessionSummary {
  chiefComplaint: string;
  diagnosis: string;
  prescriptions: string;
  followUpActions: string[];
  keyDecisions: string[];
  comparisonWithPrevious?: string;
}

// ===== Report Analysis (AI Output) =====
export interface ReportAnalysis {
  plainLanguageSummary: string;
  criticalFlags: CriticalFlag[];
  recommendations: string[];
  preDiagnosisInsights: string;
}

// ===== Shared Context Summary (AI Output) =====
export interface SharedContextSummary {
  patientOverview: string;
  chronologicalSummary: string;
  activeConditions: string[];
  currentMedications: string[];
  allergies: string[];
  criticalAlerts: string[];
  recommendedFollowUps: string[];
}

// ===== Supermemory Patient Context =====
export interface PatientContext {
  staticFacts: string[];
  dynamicContext: string[];
  relevantMemories: string[];
}
