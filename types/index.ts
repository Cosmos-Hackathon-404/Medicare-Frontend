// NOTE: Once `npx convex dev` is run and _generated types are available,
// you can import `Id` from "convex/_generated/dataModel" for stronger typing.
// Until then, we use a generic string-branded type as a placeholder.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Id<T extends string> = string;

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
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | (string & {});
export type AppointmentType = "offline" | "online" | (string & {});

export interface Appointment {
  _id: Id<"appointments">;
  _creationTime: number;
  patientId: Id<"patientProfiles">;
  doctorId: Id<"doctorProfiles">;
  patientClerkId: string;
  doctorClerkId: string;
  dateTime: string; // ISO string
  status: AppointmentStatus;
  type?: AppointmentType;
  notes?: string;
  sharedReportIds?: Id<"reports">[]; // Reports shared with doctor for this appointment
}

// ===== Video Room =====
export type VideoRoomStatus = "waiting" | "active" | "ended" | (string & {});

export interface VideoRoom {
  _id: Id<"videoRooms">;
  _creationTime: number;
  appointmentId: Id<"appointments">;
  roomId: string;
  doctorClerkId: string;
  patientClerkId: string;
  status: VideoRoomStatus;
  doctorJoinedAt?: string;
  patientJoinedAt?: string;
  endedAt?: string;
  duration?: number;
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
export type FlagSeverity = "high" | "medium" | "low" | (string & {});

export interface CriticalFlag {
  issue: string;
  severity: FlagSeverity;
  details: string;
}

// ===== Report =====
export type ReportFileType = "pdf" | "image" | (string & {});
export type AnalysisStatus = "pending" | "analyzing" | "completed" | "failed" | (string & {});

export interface Report {
  _id: Id<"reports">;
  _creationTime: number;
  patientClerkId: string;
  doctorClerkId?: string;
  fileStorageId: Id<"_storage">;
  additionalFileStorageIds?: Id<"_storage">[];
  fileName: string;
  fileType: ReportFileType;
  fileSize?: number;
  totalPages?: number;
  aiSummary?: string;
  analysisStatus?: AnalysisStatus;
  criticalFlags?: CriticalFlag[];
  recommendations?: string[];
  preDiagnosisInsights?: string;
  supermemoryDocId?: string;
}

// ===== Shared Context =====
export type SharedContextStatus = "pending" | "viewed" | (string & {});

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
export type UserRole = "doctor" | "patient" | (string & {});

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

// ===== Chat Message =====
export interface Message {
  _id: Id<"messages">;
  _creationTime: number;
  senderClerkId: string;
  receiverClerkId: string;
  senderRole: "doctor" | "patient";
  content: string;
  read: boolean;
}

// ===== Vital Signs =====
export type VitalType =
  | "blood_pressure"
  | "blood_sugar"
  | "heart_rate"
  | "weight"
  | "temperature"
  | "oxygen_saturation";

export interface Vital {
  _id: Id<"vitals">;
  _creationTime: number;
  patientClerkId: string;
  recordedAt: string;
  type: VitalType;
  value: number;
  secondaryValue?: number;
  unit: string;
  notes?: string;
  source: "manual" | "ai_extracted";
}

// ===== Critical Alert =====
export type AlertSeverity = "critical" | "urgent" | "warning";
export type AlertStatus = "active" | "acknowledged" | "resolved";
export type AlertType = "report_critical_flag" | "vitals_abnormal" | "drug_interaction";

export interface CriticalAlert {
  _id: Id<"criticalAlerts">;
  _creationTime: number;
  patientClerkId: string;
  doctorClerkId: string;
  reportId?: Id<"reports">;
  sessionId?: Id<"sessions">;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  acknowledgedAt?: string;
}

// ===== Drug Interaction Check =====
export interface DrugAlert {
  type: "allergy" | "interaction" | "contraindication" | "dosage";
  severity: "critical" | "warning" | "info";
  medication: string;
  message: string;
  details: string;
}

// ===== Wellness Plan =====
export interface WellnessMeal {
  name: string;
  time: string;
  items: string[];
  notes?: string;
}

export interface WellnessNutrition {
  dailyCalorieTarget?: string;
  macroSplit?: {
    protein: string;
    carbs: string;
    fats: string;
  };
  meals?: WellnessMeal[];
  foodsToInclude?: string[];
  foodsToAvoid?: string[];
  hydration?: string;
  supplements?: string[];
}

export interface ExerciseRoutine {
  day: string;
  type: string;
  duration: string;
  exercises: string[];
  intensity: string;
  notes?: string;
}

export interface WellnessExercise {
  weeklyGoal?: string;
  restrictions?: string[];
  routines?: ExerciseRoutine[];
}

export interface WellnessLifestyle {
  sleepRecommendation?: string;
  sleepTips?: string[];
  stressManagement?: string[];
  habits?: string[];
}

export interface WellnessMentalHealth {
  recommendations?: string[];
  activities?: string[];
  warningSignsToWatch?: string[];
}

export type WellnessPlanStatus = "generating" | "completed" | "failed";

export interface WellnessPlan {
  _id: Id<"wellnessPlans">;
  _creationTime: number;
  patientClerkId: string;
  generatedAt: string;
  status: WellnessPlanStatus;
  errorMessage?: string;
  nutrition?: WellnessNutrition;
  exercise?: WellnessExercise;
  lifestyle?: WellnessLifestyle;
  mentalWellness?: WellnessMentalHealth;
  additionalNotes?: string;
  reviewDate?: string;
  aiConfidence?: string;
  dataSources?: string[];
}
