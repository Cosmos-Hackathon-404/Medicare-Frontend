'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Filter, Search, ChevronLeft, ChevronRight, Video, MapPin } from 'lucide-react';

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState('all');

  const appointments = [
    {
      id: '1',
      patientName: 'John Doe',
      patientId: 'p1',
      time: '09:00 AM',
      duration: '30 min',
      type: 'Follow-up',
      status: 'confirmed',
      mode: 'in-person',
      condition: 'Hypertension checkup'
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      patientId: 'p2',
      time: '10:30 AM',
      duration: '45 min',
      type: 'New Patient',
      status: 'confirmed',
      mode: 'video',
      condition: 'Initial consultation'
    },
    {
      id: '3',
      patientName: 'Mike Johnson',
      patientId: 'p3',
      time: '02:00 PM',
      duration: '30 min',
      type: 'Consultation',
      status: 'pending',
      mode: 'in-person',
      condition: 'Back pain assessment'
    },
    {
      id: '4',
      patientName: 'Sarah Williams',
      patientId: 'p4',
      time: '03:30 PM',
      duration: '30 min',
      type: 'Follow-up',
      status: 'confirmed',
      mode: 'video',
      condition: 'Diabetes management'
    },
    {
      id: '5',
      patientName: 'Robert Brown',
      patientId: 'p5',
      time: '04:30 PM',
      duration: '20 min',
      type: 'Quick Check',
      status: 'completed',
      mode: 'in-person',
      condition: 'Prescription renewal'
    },
  ];

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/doctor/dashboard" className="text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your schedule</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Schedule New
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendar</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="font-medium">February 2024</span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Mini Calendar */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="font-semibold text-gray-600 py-2">{day}</div>
                  ))}
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 2; // Adjust for month start
                    const isToday = day === 11;
                    const hasAppointment = [11, 12, 15, 18].includes(day);
                    return (
                      <button
                        key={i}
                        className={`py-2 rounded relative ${
                          day < 1 || day > 29
                            ? 'text-gray-300'
                            : isToday
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {day > 0 && day <= 29 ? day : ''}
                        {hasAppointment && day > 0 && day <= 29 && !isToday && (
                          <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Today's Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-semibold">{appointments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confirmed</span>
                    <span className="font-semibold text-green-600">
                      {appointments.filter(a => a.status === 'confirmed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending</span>
                    <span className="font-semibold text-yellow-600">
                      {appointments.filter(a => a.status === 'pending').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('confirmed')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'confirmed'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Confirmed
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pending
                  </button>
                </div>
              </div>
            </div>

            {/* Appointments */}
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.patientName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : appointment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{appointment.condition}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-gray-900 font-semibold mb-1">
                        <Clock className="w-4 h-4" />
                        {appointment.time}
                      </div>
                      <p className="text-sm text-gray-600">{appointment.duration}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      {appointment.mode === 'video' ? (
                        <Video className="w-4 h-4" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                      <span className="capitalize">{appointment.mode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{appointment.type}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/doctor/session/${appointment.id}`}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center font-medium"
                    >
                      Start Session
                    </Link>
                    <Link
                      href={`/doctor/patient/${appointment.patientId}`}
                      className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors font-medium"
                    >
                      View Patient
                    </Link>
                    <button className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors">
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}