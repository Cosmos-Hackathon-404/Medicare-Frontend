"use client";

import { useState } from "react";
import Link from "next/link";
import { use } from "react";
import {
  User,
  Calendar,
  FileText,
  Pill,
  AlertCircle,
  Phone,
  Mail,
  Download,
  Edit,
  Stethoscope,
  Droplets,
} from "lucide-react";
import PageHeader from "@/components/doctor/page-header";
import StatusBadge from "@/components/doctor/status-badge";

// Mock data based on Convex patientProfiles schema
const patient = {
  clerkUserId: "clerk_pat_001",
  name: "John Doe",
  email: "john.doe@email.com",
  age: 45,
  bloodGroup: "O+",
  allergies: "Penicillin (severe rash)",
  emergencyContact: "Jane Doe - +1 (555) 987-6543",
};

const sessions = [
  {
    _id: "ses_001",
    appointmentId: "apt_002",
    aiSummary:
      "Patient's blood pressure well-controlled on current medication. A1C slightly elevated.",
    keyDecisions: ["Continue Lisinopril 10mg", "Dietary counseling for diabetes"],
  },
  {
    _id: "ses_002",
    appointmentId: "apt_003",
    aiSummary:
      "Lab results reviewed. Lipid panel normal. Blood glucose trending upward.",
    keyDecisions: ["Order HbA1c test", "Increase physical activity"],
  },
];

const reports = [
  {
    _id: "rep_001",
    fileName: "blood_work_2026-01-28.pdf",
    fileType: "pdf",
    aiSummary: "Lipid panel normal. Blood glucose slightly elevated at 115 mg/dL.",
    criticalFlags: [
      { issue: "Elevated Blood Glucose", severity: "medium", details: "Fasting glucose 115 mg/dL" },
    ],
  },
  {
    _id: "rep_002",
    fileName: "ecg_report_2025-12.pdf",
    fileType: "pdf",
    aiSummary: "ECG within normal sinus rhythm. No abnormalities.",
    criticalFlags: [],
  },
];

const medicalHistory = [
  { condition: "Hypertension", diagnosedDate: "2020-03-10", status: "Active", severity: "Moderate" },
  { condition: "Type 2 Diabetes", diagnosedDate: "2018-07-22", status: "Active", severity: "Controlled" },
  { condition: "Seasonal Allergies", diagnosedDate: "2015-05-01", status: "Active", severity: "Mild" },
];

const medications = [
  { name: "Lisinopril", dosage: "10mg", frequency: "Once daily", startDate: "2020-03-10", prescribedBy: "Dr. Smith" },
  { name: "Metformin", dosage: "500mg", frequency: "Twice daily", startDate: "2018-07-22", prescribedBy: "Dr. Johnson" },
  { name: "Loratadine", dosage: "10mg", frequency: "As needed", startDate: "2015-05-01", prescribedBy: "Dr. Johnson" },
];

const vitals = [
  { date: "2026-01-28", bp: "128/82", hr: "72", temp: "98.6", weight: "185" },
  { date: "2026-01-15", bp: "130/84", hr: "75", temp: "98.4", weight: "187" },
  { date: "2025-12-20", bp: "132/86", hr: "78", temp: "98.7", weight: "189" },
];

const allergies = [
  { allergen: "Penicillin", reaction: "Severe rash", severity: "High" },
  { allergen: "Pollen", reaction: "Sneezing, watery eyes", severity: "Moderate" },
];

const tabItems = [
  { id: "overview", label: "Overview" },
  { id: "sessions", label: "Sessions" },
  { id: "reports", label: "Reports" },
  { id: "medications", label: "Medications" },
  { id: "vitals", label: "Vitals" },
];

export default function PatientDetail({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div>
      <PageHeader
        title="Patient Profile"
        subtitle="Complete medical record and history"
        backHref="/doctor/appointments"
        backLabel="Back to Appointments"
        actions={
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        }
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Patient Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">
                {patient.name.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{patient.name}</h2>
                <div className="space-y-1.5 text-sm">
                  <p className="text-gray-500">{patient.age} years old</p>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-gray-700 font-medium">{patient.bloodGroup}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>{patient.email}</span>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Emergency</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{patient.emergencyContact}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            {[
              { value: 4, label: "Appointments", color: "text-blue-600" },
              { value: medications.length, label: "Medications", color: "text-emerald-600" },
              { value: allergies.length, label: "Allergies", color: "text-red-500" },
              { value: medicalHistory.length, label: "Conditions", color: "text-purple-600" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {allergies.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900 text-sm mb-2">Known Allergies</h3>
                        <div className="space-y-1.5">
                          {allergies.map((a, i) => (
                            <div key={i} className="text-sm text-red-800 flex items-center gap-2">
                              <span className="font-medium">{a.allergen}:</span>
                              <span>{a.reaction}</span>
                              <StatusBadge status={a.severity} size="sm" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      Medical History
                    </h3>
                    <div className="space-y-3">
                      {medicalHistory.map((c, i) => (
                        <div key={i} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-gray-900 text-sm">{c.condition}</h4>
                            <StatusBadge status={c.status} size="sm" />
                          </div>
                          <p className="text-xs text-gray-500">Diagnosed: {new Date(c.diagnosedDate).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">Severity: {c.severity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-emerald-600" />
                      Current Medications
                    </h3>
                    <div className="space-y-3">
                      {medications.map((med, i) => (
                        <div key={i} className="p-4 border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">{med.name}</h4>
                          <p className="text-xs text-gray-500">{med.dosage} · {med.frequency}</p>
                          <p className="text-[11px] text-gray-400 mt-1">Prescribed by {med.prescribedBy}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sessions" && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Session History</h3>
                {sessions.map((session) => (
                  <Link
                    key={session._id}
                    href={`/doctor/session/${session.appointmentId}`}
                    className="block p-4 border border-gray-200 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <p className="text-sm font-medium text-gray-900 mb-1">Appointment #{session.appointmentId}</p>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{session.aiSummary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {session.keyDecisions.map((d, i) => (
                        <span key={i} className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                          {d}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-semibold text-gray-900">Medical Reports</h3>
                  <Link href="/doctor/reports" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</Link>
                </div>
                {reports.map((report) => (
                  <div key={report._id} className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{report.fileName}</p>
                        <p className="text-xs text-gray-500 uppercase">{report.fileType}</p>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    {report.aiSummary && (
                      <p className="text-xs text-gray-500 mb-2 ml-11">{report.aiSummary}</p>
                    )}
                    {report.criticalFlags.length > 0 && (
                      <div className="ml-11 space-y-1.5">
                        {report.criticalFlags.map((flag, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-red-700 font-medium">{flag.issue}</span>
                            <StatusBadge status={flag.severity} size="sm" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "medications" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-semibold text-gray-900">Medication List</h3>
                  <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Add Medication</button>
                </div>
                {medications.map((med, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">{med.name}</h4>
                        <p className="text-sm text-gray-500">{med.dosage}</p>
                      </div>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Frequency</p>
                        <p className="font-medium text-gray-900">{med.frequency}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Start Date</p>
                        <p className="font-medium text-gray-900">{new Date(med.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">Prescribed by {med.prescribedBy}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "vitals" && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">Vital Signs History</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Blood Pressure</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Heart Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Temperature</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {vitals.map((v, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{new Date(v.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.bp} mmHg</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{v.hr} bpm</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{v.temp}°F</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{v.weight} lbs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
