"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Share2,
  Eye,
  FileText,
  User,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  Stethoscope,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PageHeader from "@/components/doctor/page-header";
import StatusBadge from "@/components/doctor/status-badge";

// Mock data based on Convex sharedContexts schema
const sharedContexts = [
  {
    _id: "sc_001",
    patientClerkId: "clerk_pat_001",
    patientName: "John Doe",
    patientAge: 45,
    fromDoctorClerkId: "clerk_doc_002",
    fromDoctorName: "Dr. Emily Chen",
    fromDoctorSpecialization: "Endocrinologist",
    toDoctorClerkId: "clerk_doc_001",
    sessionIds: ["ses_001", "ses_002"],
    reportIds: ["rep_001"],
    aiConsolidatedSummary:
      "Patient John Doe (45, Male) has been under care for Type 2 Diabetes and Hypertension. Recent lab results show A1C at 7.2% with a slight upward trend. Blood pressure well-controlled on Lisinopril 10mg. Dr. Chen recommends cardiology review for combined management of metabolic syndrome. Key concerns: LDL cholesterol elevated at 180mg/dL, consider statin therapy.",
    status: "pending",
    sharedAt: "2026-02-10T14:30:00Z",
  },
  {
    _id: "sc_002",
    patientClerkId: "clerk_pat_003",
    patientName: "Mike Johnson",
    patientAge: 58,
    fromDoctorClerkId: "clerk_doc_003",
    fromDoctorName: "Dr. James Wilson",
    fromDoctorSpecialization: "Orthopedic Surgeon",
    toDoctorClerkId: "clerk_doc_001",
    sessionIds: ["ses_005"],
    reportIds: ["rep_003", "rep_004"],
    aiConsolidatedSummary:
      "Patient Mike Johnson (58, Male) referred for cardiac clearance prior to knee replacement surgery. Patient has mild cardiomegaly noted on chest X-ray. Currently stable with no active cardiac complaints. Pre-operative evaluation requested. Patient is on no cardiac medications currently.",
    status: "pending",
    sharedAt: "2026-02-09T10:15:00Z",
  },
  {
    _id: "sc_003",
    patientClerkId: "clerk_pat_005",
    patientName: "Robert Brown",
    patientAge: 67,
    fromDoctorClerkId: "clerk_doc_004",
    fromDoctorName: "Dr. Sarah Lee",
    fromDoctorSpecialization: "Pulmonologist",
    toDoctorClerkId: "clerk_doc_001",
    sessionIds: ["ses_008"],
    reportIds: ["rep_006"],
    aiConsolidatedSummary:
      "Patient Robert Brown (67, Male) with COPD and recently diagnosed atrial fibrillation during pulmonary function testing. Referred for cardiac evaluation and anticoagulation management. Current medications include bronchodilators. Echocardiogram recommended.",
    status: "viewed",
    sharedAt: "2026-02-07T16:00:00Z",
  },
  {
    _id: "sc_004",
    patientClerkId: "clerk_pat_002",
    patientName: "Jane Smith",
    patientAge: 32,
    fromDoctorClerkId: "clerk_doc_005",
    fromDoctorName: "Dr. Michael Park",
    fromDoctorSpecialization: "General Practitioner",
    toDoctorClerkId: "clerk_doc_001",
    sessionIds: ["ses_010"],
    reportIds: [],
    aiConsolidatedSummary:
      "Patient Jane Smith (32, Female) presenting with recurrent palpitations and exercise intolerance. Baseline ECG unremarkable. Family history significant for early-onset cardiac disease (father, MI at 52). Referred for comprehensive cardiac workup including stress test and echocardiogram.",
    status: "viewed",
    sharedAt: "2026-02-05T09:45:00Z",
  },
];

const filterOptions = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "viewed", label: "Viewed" },
];

export default function SharedContextPage() {
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = sharedContexts.filter((sc) => {
    const matchesFilter = filter === "all" || sc.status === filter;
    const matchesSearch =
      !searchQuery ||
      sc.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.fromDoctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.aiConsolidatedSummary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = sharedContexts.filter((s) => s.status === "pending").length;

  return (
    <div>
      <PageHeader
        title="Shared Context Inbox"
        subtitle="Patient contexts shared by other doctors for your review"
        badge={
          pendingCount > 0 ? (
            <span className="bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-bold">
              {pendingCount} Pending
            </span>
          ) : null
        }
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{sharedContexts.length}</p>
                <p className="text-xs text-gray-500">Total Shared</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-xs text-gray-500">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {sharedContexts.filter((s) => s.status === "viewed").length}
                </p>
                <p className="text-xs text-gray-500">Reviewed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient, doctor, or summary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === opt.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Shared Context Cards */}
        <div className="space-y-4">
          {filtered.map((context) => {
            const isExpanded = expandedId === context._id;
            return (
              <div
                key={context._id}
                className={`bg-white rounded-xl border transition-all ${
                  context.status === "pending"
                    ? "border-amber-200 shadow-sm"
                    : "border-gray-200"
                }`}
              >
                {/* Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* From Doctor */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {context.fromDoctorName
                          .replace("Dr. ", "")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            From {context.fromDoctorName}
                          </h3>
                          <StatusBadge status={context.status} dot />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <Stethoscope className="w-3 h-3" />
                          <span>{context.fromDoctorSpecialization}</span>
                          <span className="text-gray-300">·</span>
                          <span>
                            {new Date(context.sharedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Patient Info */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1">
                            <User className="w-3 h-3 text-blue-600" />
                            <Link
                              href={`/doctor/patient/${context.patientClerkId}`}
                              className="text-xs font-medium text-blue-700 hover:text-blue-800"
                            >
                              {context.patientName}
                            </Link>
                            <span className="text-xs text-blue-500">
                              {context.patientAge} yrs
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <FileText className="w-3 h-3" />
                            {context.reportIds.length} reports
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Share2 className="w-3 h-3" />
                            {context.sessionIds.length} sessions
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {context.status === "pending" && (
                        <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Mark as Viewed
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : context._id)
                        }
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                    {/* AI Summary */}
                    {context.aiConsolidatedSummary && (
                      <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                            AI Consolidated Summary
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {context.aiConsolidatedSummary}
                        </p>
                      </div>
                    )}

                    {/* Linked Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Sessions */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                          Linked Sessions ({context.sessionIds.length})
                        </h4>
                        <div className="space-y-2">
                          {context.sessionIds.map((id) => (
                            <Link
                              key={id}
                              href={`/doctor/session/${id}`}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                            >
                              <span className="text-xs font-medium text-gray-700">
                                Session {id}
                              </span>
                              <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Reports */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                          Linked Reports ({context.reportIds.length})
                        </h4>
                        {context.reportIds.length > 0 ? (
                          <div className="space-y-2">
                            {context.reportIds.map((id) => (
                              <Link
                                key={id}
                                href="/doctor/reports"
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                              >
                                <span className="text-xs font-medium text-gray-700">
                                  Report {id}
                                </span>
                                <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-blue-600 transition-colors" />
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            No reports attached
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Link
                        href={`/doctor/patient/${context.patientClerkId}`}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                      >
                        View Patient Profile
                      </Link>
                      <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        Reply to Doctor
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
              <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No shared contexts found</p>
              <p className="text-sm text-gray-400 mt-1">
                Contexts shared by other doctors will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
