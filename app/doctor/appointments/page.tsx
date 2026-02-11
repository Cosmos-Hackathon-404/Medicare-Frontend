"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Video,
  MapPin,
  Mic,
  User,
  Filter,
} from "lucide-react";
import PageHeader from "@/components/doctor/page-header";
import StatusBadge from "@/components/doctor/status-badge";

// Mock data based on Convex appointments + patientProfiles schema
const appointments = [
  {
    _id: "apt_001",
    patientId: "pat_001",
    doctorId: "doc_001",
    patientClerkId: "clerk_pat_001",
    doctorClerkId: "clerk_doc_001",
    patientName: "John Doe",
    patientAge: 45,
    dateTime: "2026-02-11T09:00:00Z",
    status: "scheduled",
    notes: "Hypertension checkup - BP medication review",
    type: "Follow-up",
    mode: "in-person",
    duration: "30 min",
  },
  {
    _id: "apt_002",
    patientId: "pat_002",
    doctorId: "doc_001",
    patientClerkId: "clerk_pat_002",
    doctorClerkId: "clerk_doc_001",
    patientName: "Jane Smith",
    patientAge: 32,
    dateTime: "2026-02-11T10:30:00Z",
    status: "scheduled",
    notes: "Initial cardiac consultation",
    type: "New Patient",
    mode: "video",
    duration: "45 min",
  },
  {
    _id: "apt_003",
    patientId: "pat_003",
    doctorId: "doc_001",
    patientClerkId: "clerk_pat_003",
    doctorClerkId: "clerk_doc_001",
    patientName: "Mike Johnson",
    patientAge: 58,
    dateTime: "2026-02-11T14:00:00Z",
    status: "scheduled",
    notes: "Back pain assessment",
    type: "Consultation",
    mode: "in-person",
    duration: "30 min",
  },
  {
    _id: "apt_004",
    patientId: "pat_004",
    doctorId: "doc_001",
    patientClerkId: "clerk_pat_004",
    doctorClerkId: "clerk_doc_001",
    patientName: "Sarah Williams",
    patientAge: 41,
    dateTime: "2026-02-11T15:30:00Z",
    status: "completed",
    notes: "Diabetes management follow-up",
    type: "Follow-up",
    mode: "video",
    duration: "30 min",
  },
  {
    _id: "apt_005",
    patientId: "pat_005",
    doctorId: "doc_001",
    patientClerkId: "clerk_pat_005",
    doctorClerkId: "clerk_doc_001",
    patientName: "Robert Brown",
    patientAge: 67,
    dateTime: "2026-02-11T16:30:00Z",
    status: "cancelled",
    notes: "Prescription renewal",
    type: "Quick Check",
    mode: "in-person",
    duration: "20 min",
  },
];

const filterOptions = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AppointmentsPage() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAppointments = appointments.filter((apt) => {
    const matchesFilter = filter === "all" || apt.status === filter;
    const matchesSearch =
      !searchQuery ||
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatTime = (dateTime: string) =>
    new Date(dateTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const statusCounts = {
    all: appointments.length,
    scheduled: appointments.filter((a) => a.status === "scheduled").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Manage your schedule and patient appointments"
        actions={
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            + Schedule New
          </button>
        }
      />

      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Calendar Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="font-semibold text-gray-900 text-sm">
                  February 2026
                </span>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-0.5 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div
                    key={day}
                    className="text-[11px] font-semibold text-gray-400 py-2"
                  >
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 0; // Feb 2026 starts on Sunday
                  const isToday = day === 11;
                  const hasAppointment = [11, 12, 15, 18, 20, 25].includes(day);
                  return (
                    <button
                      key={i}
                      className={`py-2 text-xs rounded-lg relative transition-colors ${
                        day < 1 || day > 28
                          ? "text-gray-300"
                          : isToday
                          ? "bg-blue-600 text-white font-bold"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {day > 0 && day <= 28 ? day : ""}
                      {hasAppointment && day > 0 && day <= 28 && !isToday && (
                        <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Today's Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Today&apos;s Summary
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Total", value: statusCounts.all, color: "text-gray-900" },
                  { label: "Scheduled", value: statusCounts.scheduled, color: "text-blue-600" },
                  { label: "Completed", value: statusCounts.completed, color: "text-emerald-600" },
                  { label: "Cancelled", value: statusCounts.cancelled, color: "text-red-500" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-500">{stat.label}</span>
                    <span className={`text-sm font-bold ${stat.color}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="xl:col-span-3 space-y-5">
            {/* Search & Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
                      <span className="ml-1 text-xs opacity-70">
                        ({statusCounts[opt.value as keyof typeof statusCounts]})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Appointment Cards */}
            <div className="space-y-3">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt._id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {apt.patientName}
                          </h3>
                          <StatusBadge status={apt.status} dot />
                        </div>
                        <p className="text-sm text-gray-500">{apt.notes}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1.5 text-gray-900 font-semibold text-sm">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {formatTime(apt.dateTime)}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {apt.duration}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      {apt.mode === "video" ? (
                        <Video className="w-3.5 h-3.5" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5" />
                      )}
                      <span className="capitalize">{apt.mode}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{apt.type}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Age: {apt.patientAge}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/doctor/session/${apt._id}`}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      Start Session
                    </Link>
                    <Link
                      href={`/doctor/patient/${apt.patientClerkId}`}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      View Patient
                    </Link>
                    <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}

              {filteredAppointments.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    No appointments found
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try adjusting your filters
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}