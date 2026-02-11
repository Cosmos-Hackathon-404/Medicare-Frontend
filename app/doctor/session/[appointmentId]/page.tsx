"use client";

import { useState } from "react";
import Link from "next/link";
import { use } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Clock,
  FileText,
  Stethoscope,
  Activity,
  Heart,
  Thermometer,
  Download,
  Save,
  Brain,
  Sparkles,
  User,
  Pill,
  AlertCircle,
} from "lucide-react";
import PageHeader from "@/components/doctor/page-header";
import StatusBadge from "@/components/doctor/status-badge";

// Mock data based on Convex schema (sessions + appointments + patientProfiles)
const mockSession = {
  _id: "ses_001",
  appointmentId: "apt_001",
  patientClerkId: "clerk_pat_001",
  doctorClerkId: "clerk_doc_001",
  transcript:
    "Doctor: How have you been feeling since our last visit?\nPatient: My blood pressure has been more stable. I've been taking the medication regularly.\nDoctor: That's good to hear. Let me check your vitals...",
  aiSummary:
    "Patient reports improved blood pressure control with current medication regimen. Vitals are within normal range. Recommend continuing current treatment with minor adjustments.",
  keyDecisions: [
    "Continue Lisinopril 10mg daily",
    "Add low-dose aspirin 81mg",
    "Schedule follow-up in 4 weeks",
    "Order lipid panel",
  ],
  prescriptions: "Lisinopril 10mg - 1x daily\nAspirin 81mg - 1x daily",
};

const mockAppointment = {
  _id: "apt_001",
  patientId: "pat_001",
  doctorId: "doc_001",
  patientClerkId: "clerk_pat_001",
  dateTime: "2026-02-11T09:00:00Z",
  status: "scheduled",
  notes: "Follow-up on blood pressure medication",
};

const mockPatient = {
  clerkUserId: "clerk_pat_001",
  name: "John Doe",
  email: "john.doe@email.com",
  age: 45,
  bloodGroup: "O+",
  allergies: "Penicillin (severe rash)",
  emergencyContact: "Jane Doe - +1 (555) 987-6543",
};

const vitals = [
  { label: "Blood Pressure", value: "128/82", unit: "mmHg", icon: Activity, status: "normal" },
  { label: "Heart Rate", value: "72", unit: "bpm", icon: Heart, status: "normal" },
  { label: "Temperature", value: "98.6", unit: "°F", icon: Thermometer, status: "normal" },
  { label: "SpO2", value: "98", unit: "%", icon: Activity, status: "normal" },
];

const medicalHistory = [
  "Hypertension (diagnosed 2020)",
  "Type 2 Diabetes (diagnosed 2018)",
  "Seasonal Allergies",
];

const currentMedications = [
  { name: "Lisinopril", dosage: "10mg", frequency: "Once daily" },
  { name: "Metformin", dosage: "500mg", frequency: "Twice daily" },
];

export default function SessionView({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [activeTab, setActiveTab] = useState<"notes" | "transcript" | "ai-summary" | "prescription">("notes");
  const [isRecording, setIsRecording] = useState(false);

  const sessionTabs = [
    { id: "notes" as const, label: "Session Notes", icon: FileText },
    { id: "transcript" as const, label: "Transcript", icon: Mic },
    { id: "ai-summary" as const, label: "AI Summary", icon: Brain },
    { id: "prescription" as const, label: "Prescription", icon: Pill },
  ];

  return (
    <div>
      <PageHeader
        title={`Session: ${mockPatient.name}`}
        subtitle={`Follow-up · ${new Date(mockAppointment.dateTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`}
        backHref="/doctor/appointments"
        backLabel="Back to Appointments"
        badge={
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-medium">Session Active</span>
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono text-xs">15:23</span>
          </div>
        }
        actions={
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save &amp; Complete
          </button>
        }
      />

      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Video Section */}
            <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Video className="text-white/60 mx-auto mb-4" size={56} />
                  <p className="text-white text-lg font-medium">
                    Video Consultation Active
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Patient: {mockPatient.name}
                  </p>
                </div>
              </div>

              {/* Recording Indicator */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Recording
                </div>
              )}

              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`p-3.5 rounded-full transition-colors ${
                      isMicOn
                        ? "bg-white/20 hover:bg-white/30"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {isMicOn ? (
                      <Mic className="text-white" size={20} />
                    ) : (
                      <MicOff className="text-white" size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`p-3.5 rounded-full transition-colors ${
                      isVideoOn
                        ? "bg-white/20 hover:bg-white/30"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {isVideoOn ? (
                      <Video className="text-white" size={20} />
                    ) : (
                      <VideoOff className="text-white" size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`p-3.5 rounded-full transition-colors ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-white/20 hover:bg-white/30"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full ${
                        isRecording ? "bg-white" : "border-2 border-white"
                      }`}
                    />
                  </button>
                  <button className="p-3.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors">
                    <Phone className="text-white" size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Session Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
                  {sessionTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {activeTab === "notes" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chief Complaint
                      </label>
                      <input
                        type="text"
                        defaultValue={mockAppointment.notes}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        History of Present Illness
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Document patient's symptoms, duration, severity..."
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Physical Examination
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Document examination findings..."
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assessment &amp; Plan
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Document diagnosis and treatment plan..."
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                )}

                {activeTab === "transcript" && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">
                          AI-Powered Transcription
                        </span>
                      </div>
                      <StatusBadge status={isRecording ? "Recording" : "Paused"} variant={isRecording ? "danger" : "default"} dot />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm leading-relaxed text-gray-700 whitespace-pre-wrap max-h-80 overflow-y-auto">
                      {mockSession.transcript}
                    </div>
                  </div>
                )}

                {activeTab === "ai-summary" && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">
                          AI-Generated Summary
                        </h3>
                      </div>
                      <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                        {mockSession.aiSummary}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Key Decisions
                      </h3>
                      <div className="space-y-2">
                        {mockSession.keyDecisions.map((decision, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg"
                          >
                            <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <span className="text-sm text-gray-700">
                              {decision}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "prescription" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medication Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter medication name..."
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dosage
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 10mg"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frequency
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Twice daily"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 30 days"
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <button className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                      Add to Prescription
                    </button>

                    {/* Current Prescription */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Current Prescription
                      </h4>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {mockSession.prescriptions}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            {/* Patient Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <Link
                    href={`/doctor/patient/${mockPatient.clerkUserId}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {mockPatient.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {mockPatient.age} yrs · {mockPatient.bloodGroup}
                  </p>
                </div>
              </div>

              {mockPatient.allergies && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-red-700">Allergies</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        {mockPatient.allergies}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Link
                href={`/doctor/patient/${mockPatient.clerkUserId}`}
                className="block w-full text-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
              >
                View Full Profile
              </Link>
            </div>

            {/* Vitals */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                Current Vitals
              </h3>
              <div className="space-y-2.5">
                {vitals.map((vital) => (
                  <div
                    key={vital.label}
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <vital.icon className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-gray-600">
                        {vital.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {vital.value}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-1">
                        {vital.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Medical History */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Medical History
              </h3>
              <ul className="space-y-2">
                {medicalHistory.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-600 flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Current Medications */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                <Pill className="w-4 h-4 text-emerald-600" />
                Current Medications
              </h3>
              <div className="space-y-2">
                {currentMedications.map((med, i) => (
                  <div key={i} className="p-2.5 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">
                      {med.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {med.dosage} · {med.frequency}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Export */}
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
              <Download className="w-4 h-4" />
              Export Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
