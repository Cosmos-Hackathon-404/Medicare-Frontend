'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function DoctorDashboard() {
  const [stats] = useState({
    totalPatients: 234,
    todayAppointments: 8,
    pendingReports: 12,
    unreadMessages: 5
  });

  const upcomingAppointments = [
    { id: '1', patientName: 'John Doe', time: '09:00 AM', type: 'Follow-up', status: 'confirmed' },
    { id: '2', patientName: 'Jane Smith', time: '10:30 AM', type: 'New Patient', status: 'confirmed' },
    { id: '3', patientName: 'Mike Johnson', time: '02:00 PM', type: 'Consultation', status: 'pending' },
    { id: '4', patientName: 'Sarah Williams', time: '03:30 PM', type: 'Follow-up', status: 'confirmed' },
  ];

  const recentPatients = [
    { id: 'p1', name: 'Emily Brown', lastVisit: '2024-02-10', condition: 'Hypertension' },
    { id: 'p2', name: 'Robert Davis', lastVisit: '2024-02-09', condition: 'Diabetes Type 2' },
    { id: 'p3', name: 'Lisa Anderson', lastVisit: '2024-02-08', condition: 'Asthma' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, Dr. Smith</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                New Appointment
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={<Users className="w-6 h-6" />}
            color="bg-blue-500"
            link="/doctor/patient"
          />
          <StatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={<Calendar className="w-6 h-6" />}
            color="bg-green-500"
            link="/doctor/appointments"
          />
          <StatCard
            title="Pending Reports"
            value={stats.pendingReports}
            icon={<FileText className="w-6 h-6" />}
            color="bg-orange-500"
            link="/doctor/reports"
          />
          <StatCard
            title="Unread Messages"
            value={stats.unreadMessages}
            icon={<MessageSquare className="w-6 h-6" />}
            color="bg-purple-500"
            link="/doctor/shared-context"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Today's Appointments</h2>
              <Link 
                href="/doctor/appointments"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <Link 
                  href={`/doctor/session/${appointment.id}`}
                  key={appointment.id}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{appointment.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {appointment.time}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                        appointment.status === 'confirmed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {appointment.status === 'confirmed' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Patients */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Patients</h2>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentPatients.map((patient) => (
                <Link
                  href={`/doctor/patient/${patient.id}`}
                  key={patient.id}
                  className="block p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">Last visit: {patient.lastVisit}</p>
                  <p className="text-sm text-gray-700 mt-2">{patient.condition}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton 
              href="/doctor/appointments" 
              icon={<Calendar className="w-6 h-6" />}
              label="View Schedule"
            />
            <QuickActionButton 
              href="/doctor/reports" 
              icon={<FileText className="w-6 h-6" />}
              label="Review Reports"
            />
            <QuickActionButton 
              href="/doctor/shared-context" 
              icon={<MessageSquare className="w-6 h-6" />}
              label="Messages"
            />
            <QuickActionButton 
              href="/doctor/patient/search" 
              icon={<Users className="w-6 h-6" />}
              label="Find Patient"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, link }: any) {
  return (
    <Link href={link} className="block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`${color} p-3 rounded-lg text-white`}>
            {icon}
          </div>
        </div>
      </div>
    </Link>
  );
}

function QuickActionButton({ href, icon, label }: any) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all"
    >
      <div className="text-indigo-600 mb-2">{icon}</div>
      <span className="text-sm font-medium text-gray-700 text-center">{label}</span>
    </Link>
  );
}