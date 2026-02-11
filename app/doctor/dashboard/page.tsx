"use client";

import Link from "next/link";
import {
  Calendar,
  Users,
  FileText,
  Share2,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Mic,
} from "lucide-react";
import PageHeader from "@/components/doctor/page-header";
import StatsCard from "@/components/doctor/stats-card";
import StatusBadge from "@/components/doctor/status-badge";

// Mock data based on Convex schema
const mockDoctor = {
  clerkUserId: "clerk_doc_001",
  name: "Dr. Sarah Smith",
  specialization: "Cardiologist",
  licenseNumber: "MED-2024-1234",
};

const todayAppointments = [
  {
    _id: "apt_001",
    patientName: "John Doe",
    patientClerkId: "clerk_pat_001",
    dateTime: "2026-02-11T09:00:00Z",
    status: "scheduled",
    type: "Follow-up",
    notes: "Blood pressure medication review",
  },
  {
    _id: "apt_002",
    patientName: "Jane Smith",
    patientClerkId: "clerk_pat_002",
    dateTime: "2026-02-11T10:30:00Z",
    status: "scheduled",
    type: "New Patient",
    notes: "Initial cardiac consultation",
  },
  {
    _id: "apt_003",
    patientName: "Mike Johnson",
    patientClerkId: "clerk_pat_003",
    dateTime: "2026-02-11T14:00:00Z",
    status: "scheduled",
    type: "Consultation",
    notes: "Chest pain evaluation",
  },
  {
    _id: "apt_004",
    patientName: "Sarah Williams",
    patientClerkId: "clerk_pat_004",
    dateTime: "2026-02-11T15:30:00Z",
    status: "completed",
    type: "Follow-up",
    notes: "Post-surgery follow-up",
  },
];

const recentSessions = [
  {
    _id: "ses_001",
    appointmentId: "apt_010",
    patientName: "Emily Brown",
    patientClerkId: "clerk_pat_005",
    aiSummary: "Patient reported improved BP readings. Medication adjusted.",
    keyDecisions: ["Reduce Lisinopril to 5mg", "Schedule follow-up in 2 weeks"],
  },
  {
    _id: "ses_002",
    appointmentId: "apt_011",
    patientName: "Robert Davis",
    patientClerkId: "clerk_pat_006",
    aiSummary: "Diabetes management review. A1C levels stable.",
    keyDecisions: ["Continue Metformin 500mg", "Order lipid panel"],
  },
];

const recentReports = [
  {
    _id: "rep_001",
    patientClerkId: "clerk_pat_001",
    patientName: "John Doe",
    fileName: "blood_work_results.pdf",
    fileType: "pdf",
    criticalFlags: [{ issue: "Elevated LDL", severity: "high", details: "LDL at 180mg/dL" }],
  },
  {
    _id: "rep_002",
    patientClerkId: "clerk_pat_003",
    patientName: "Mike Johnson",
    fileName: "ecg_report.pdf",
    fileType: "pdf",
    criticalFlags: [],
  },
];

export default function DoctorDashboard() {
  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${mockDoctor.name}`}
        actions={
          <Link
            href="/doctor/appointments"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + New Appointment
          </Link>
        }
      />

      <div className="p-6 lg:p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Today's Appointments"
            value={todayAppointments.length}
            icon={Calendar}
            color="blue"
            trend="2 more than yesterday"
            trendUp={true}
            href="/doctor/appointments"
          />
          <StatsCard
            title="Total Patients"
            value={234}
            icon={Users}
            color="green"
            trend="12 new this month"
            trendUp={true}
          />
          <StatsCard
            title="Pending Reports"
            value={recentReports.filter((r) => r.criticalFlags.length > 0).length}
            icon={FileText}
            color="orange"
            href="/doctor/reports"
          />
          <StatsCard
            title="Shared Contexts"
            value={3}
            icon={Share2}
            color="purple"
            trend="2 new pending"
            href="/doctor/shared-context"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Today&apos;s Schedule
                </h2>
              </div>
              <Link
                href="/doctor/appointments"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {todayAppointments.map((apt) => (
                <Link
                  href={`/doctor/session/${apt._id}`}
                  key={apt._id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors group"
                >
                  <div className="w-16 text-center flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatTime(apt.dateTime)}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-gray-200" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {apt.patientName}
                      </h3>
                      <StatusBadge status={apt.status} dot />
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {apt.type} &middot; {apt.notes}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5" />
                      Start Session
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent AI Sessions */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Recent Sessions
                  </h2>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {recentSessions.map((session) => (
                  <Link
                    href={`/doctor/session/${session.appointmentId}`}
                    key={session._id}
                    className="block px-6 py-4 hover:bg-gray-50/80 transition-colors"
                  >
                    <p className="font-medium text-gray-900 text-sm">
                      {session.patientName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {session.aiSummary}
                    </p>
                    {session.keyDecisions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {session.keyDecisions.slice(0, 2).map((d, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Critical Flags */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Critical Alerts
                  </h2>
                </div>
                <Link
                  href="/doctor/reports"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {recentReports
                  .filter((r) => r.criticalFlags.length > 0)
                  .map((report) =>
                    report.criticalFlags.map((flag, i) => (
                      <div
                        key={`${report._id}-${i}`}
                        className="px-6 py-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {flag.issue}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {report.patientName} &middot; {flag.details}
                            </p>
                            <StatusBadge
                              status={flag.severity}
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                {recentReports.filter((r) => r.criticalFlags.length > 0)
                  .length === 0 && (
                  <div className="px-6 py-8 text-center">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No critical alerts</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { href: "/doctor/appointments", icon: Calendar, label: "View Schedule", color: "text-blue-600 bg-blue-50" },
              { href: "/doctor/reports", icon: FileText, label: "Review Reports", color: "text-orange-600 bg-orange-50" },
              { href: "/doctor/shared-context", icon: Share2, label: "Shared Context", color: "text-purple-600 bg-purple-50" },
              { href: "/doctor/appointments", icon: TrendingUp, label: "Analytics", color: "text-emerald-600 bg-emerald-50" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center justify-center p-5 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div
                  className={`p-3 rounded-xl mb-3 ${action.color} group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}