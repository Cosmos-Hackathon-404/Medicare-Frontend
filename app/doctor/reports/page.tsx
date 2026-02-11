"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Search,
  AlertCircle,
  Upload,
  Image,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import PageHeader from "@/components/doctor/page-header";
import StatusBadge from "@/components/doctor/status-badge";

// Mock data based on Convex reports schema
const reports = [
  {
    _id: "rep_001",
    patientClerkId: "clerk_pat_001",
    doctorClerkId: "clerk_doc_001",
    patientName: "John Doe",
    fileName: "blood_work_results.pdf",
    fileType: "pdf" as const,
    aiSummary: "Complete blood count normal. Lipid panel shows elevated LDL at 180mg/dL requiring attention.",
    criticalFlags: [
      { issue: "Elevated LDL Cholesterol", severity: "high", details: "LDL at 180mg/dL (target: <130mg/dL)" },
    ],
    supermemoryDocId: "sm_001",
    uploadDate: "2026-02-10",
  },
  {
    _id: "rep_002",
    patientClerkId: "clerk_pat_002",
    doctorClerkId: "clerk_doc_001",
    patientName: "Jane Smith",
    fileName: "ecg_scan.pdf",
    fileType: "pdf" as const,
    aiSummary: "ECG shows normal sinus rhythm. No ST-segment changes. Heart rate 72bpm.",
    criticalFlags: [],
    uploadDate: "2026-02-09",
  },
  {
    _id: "rep_003",
    patientClerkId: "clerk_pat_003",
    doctorClerkId: "clerk_doc_001",
    patientName: "Mike Johnson",
    fileName: "chest_xray.image",
    fileType: "image" as const,
    aiSummary: "Chest X-ray showing mild cardiomegaly. Further echocardiogram recommended.",
    criticalFlags: [
      { issue: "Cardiomegaly", severity: "medium", details: "Heart appears mildly enlarged on PA view" },
    ],
    uploadDate: "2026-02-08",
  },
  {
    _id: "rep_004",
    patientClerkId: "clerk_pat_004",
    doctorClerkId: "clerk_doc_001",
    patientName: "Sarah Williams",
    fileName: "a1c_lab_report.pdf",
    fileType: "pdf" as const,
    aiSummary: "HbA1c at 7.2% showing fair glycemic control. Fasting glucose 125mg/dL.",
    criticalFlags: [
      { issue: "Elevated HbA1c", severity: "medium", details: "A1C 7.2% (target: <7.0%)" },
    ],
    uploadDate: "2026-02-07",
  },
  {
    _id: "rep_005",
    patientClerkId: "clerk_pat_005",
    patientName: "Robert Brown",
    fileName: "thyroid_panel.pdf",
    fileType: "pdf" as const,
    aiSummary: "Thyroid function tests within normal limits. TSH 2.1 mIU/L.",
    criticalFlags: [],
    uploadDate: "2026-02-06",
  },
  {
    _id: "rep_006",
    patientClerkId: "clerk_pat_001",
    doctorClerkId: "clerk_doc_001",
    patientName: "John Doe",
    fileName: "mri_knee.image",
    fileType: "image" as const,
    aiSummary: "MRI of right knee. Mild meniscal degeneration. No acute tear.",
    criticalFlags: [
      { issue: "Meniscal Degeneration", severity: "low", details: "Grade 1 signal in medial meniscus" },
    ],
    uploadDate: "2026-02-05",
  },
];

const filterOptions = [
  { value: "all", label: "All Reports" },
  { value: "critical", label: "Critical Flags" },
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Images" },
];

export default function ReportsPage() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      !searchQuery ||
      report.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.aiSummary?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "critical" && report.criticalFlags.length > 0) ||
      (selectedFilter === "pdf" && report.fileType === "pdf") ||
      (selectedFilter === "image" && report.fileType === "image");

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: reports.length,
    critical: reports.filter((r) => r.criticalFlags.some((f) => f.severity === "high")).length,
    thisWeek: reports.filter((r) => new Date(r.uploadDate) >= new Date("2026-02-05")).length,
    aiProcessed: reports.filter((r) => r.aiSummary).length,
  };

  return (
    <div>
      <PageHeader
        title="Medical Reports"
        subtitle="View, analyze, and manage patient reports with AI insights"
        actions={
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Report
          </button>
        }
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Reports", value: stats.total, icon: FileText, color: "bg-blue-50 text-blue-600" },
            { label: "Critical Flags", value: stats.critical, icon: AlertCircle, color: "bg-red-50 text-red-600" },
            { label: "This Week", value: stats.thisWeek, icon: Calendar, color: "bg-emerald-50 text-emerald-600" },
            { label: "AI Processed", value: stats.aiProcessed, icon: Sparkles, color: "bg-purple-50 text-purple-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports, patients, or AI summaries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedFilter(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedFilter === opt.value
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

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report._id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl flex-shrink-0 ${
                    report.fileType === "pdf"
                      ? "bg-red-50 text-red-600"
                      : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  {report.fileType === "pdf" ? (
                    <FileText className="w-6 h-6" />
                  ) : (
                    <Image className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {report.fileName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Link
                          href={`/doctor/patient/${report.patientClerkId}`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {report.patientName}
                        </Link>
                        <span className="text-xs text-gray-400">
                          {new Date(report.uploadDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-xs text-gray-400 uppercase">
                          {report.fileType}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="View">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Download">
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {report.aiSummary && (
                    <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">
                          AI Summary
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {report.aiSummary}
                      </p>
                    </div>
                  )}

                  {/* Critical Flags */}
                  {report.criticalFlags.length > 0 && (
                    <div className="space-y-1.5">
                      {report.criticalFlags.map((flag, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span className="font-medium text-gray-700">
                            {flag.issue}
                          </span>
                          <StatusBadge status={flag.severity} size="sm" />
                          <span className="text-gray-500">
                            {flag.details}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No reports found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search</p>
            </div>
          )}
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Report Trends</h3>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="space-y-3">
              {[
                { label: "This Week", value: 6, color: "bg-blue-600" },
                { label: "Last Week", value: 4, color: "bg-gray-400" },
                { label: "This Month", value: 18, color: "bg-emerald-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-lg font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">File Types</h3>
            <div className="space-y-3">
              {[
                { label: "PDF Reports", count: reports.filter((r) => r.fileType === "pdf").length, total: reports.length, color: "bg-red-500" },
                { label: "Images", count: reports.filter((r) => r.fileType === "image").length, total: reports.length, color: "bg-indigo-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28">{item.label}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full`}
                      style={{ width: `${(item.count / item.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}