'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Download, Eye, Filter, Calendar, Search, Plus, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const reports = [
    {
      id: '1',
      title: 'Medical Certificate - John Doe',
      type: 'Medical Certificate',
      patient: 'John Doe',
      patientId: 'p1',
      date: '2024-02-10',
      status: 'completed',
      generatedBy: 'Dr. Anderson',
    },
    {
      id: '2',
      title: 'Prescription - Sarah Smith',
      type: 'Prescription',
      patient: 'Sarah Smith',
      patientId: 'p2',
      date: '2024-02-09',
      status: 'completed',
      generatedBy: 'Dr. Anderson',
    },
    {
      id: '3',
      title: 'Lab Results - Mike Johnson',
      type: 'Lab Report',
      patient: 'Mike Johnson',
      patientId: 'p3',
      date: '2024-02-08',
      status: 'pending',
      generatedBy: 'Dr. Anderson',
    },
    {
      id: '4',
      title: 'Consultation Summary - Emma Wilson',
      type: 'Consultation Summary',
      patient: 'Emma Wilson',
      patientId: 'p4',
      date: '2024-02-07',
      status: 'completed',
      generatedBy: 'Dr. Anderson',
    },
    {
      id: '5',
      title: 'Follow-up Report - David Brown',
      type: 'Follow-up Report',
      patient: 'David Brown',
      patientId: 'p5',
      date: '2024-02-06',
      status: 'completed',
      generatedBy: 'Dr. Anderson',
    },
    {
      id: '6',
      title: 'Referral Letter - Lisa Anderson',
      type: 'Referral',
      patient: 'Lisa Anderson',
      patientId: 'p6',
      date: '2024-02-05',
      status: 'completed',
      generatedBy: 'Dr. Anderson',
    },
  ];

  const reportTypes = [
    { value: 'all', label: 'All Reports', count: reports.length },
    { value: 'prescription', label: 'Prescriptions', count: reports.filter(r => r.type === 'Prescription').length },
    { value: 'lab', label: 'Lab Reports', count: reports.filter(r => r.type === 'Lab Report').length },
    { value: 'certificate', label: 'Medical Certificates', count: reports.filter(r => r.type === 'Medical Certificate').length },
    { value: 'consultation', label: 'Consultation Summaries', count: reports.filter(r => r.type === 'Consultation Summary').length },
  ];

  const stats = [
    { label: 'Total Reports', value: reports.length, color: 'bg-blue-500' },
    { label: 'This Month', value: reports.filter(r => new Date(r.date).getMonth() === 1).length, color: 'bg-green-500' },
    { label: 'Pending', value: reports.filter(r => r.status === 'pending').length, color: 'bg-yellow-500' },
    { label: 'Completed', value: reports.filter(r => r.status === 'completed').length, color: 'bg-purple-500' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return FileText; // You can customize icons based on type
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/doctor/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Medical Reports</h1>
              <p className="text-gray-600 mt-1">View and manage all patient reports</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus size={20} />
              Generate New Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <FileText className="text-white" size={24} />
              </div>
              <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
              <p className="text-gray-600 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search reports or patients..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>All Status</option>
                <option>Completed</option>
                <option>Pending</option>
                <option>Draft</option>
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Calendar size={20} />
                Date Range
              </button>
            </div>
          </div>

          {/* Report Type Filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {reportTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedFilter(type.value)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedFilter === type.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label} ({type.count})
              </button>
            ))}
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Reports</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {reports.map((report) => {
              const TypeIcon = getTypeIcon(report.type);
              return (
                <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TypeIcon className="text-blue-600" size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <FileText size={16} />
                            {report.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={16} />
                            {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <Link 
                            href={`/doctor/patient/${report.patientId}`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Patient: {report.patient}
                          </Link>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Generated by {report.generatedBy}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="View Report">
                        <Eye size={20} className="text-gray-600" />
                      </button>
                      <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="Download Report">
                        <Download size={20} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Report Generation Trends</h3>
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">This Week</span>
                <span className="text-xl font-bold text-blue-600">12</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Last Week</span>
                <span className="text-xl font-bold text-gray-600">8</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">This Month</span>
                <span className="text-xl font-bold text-green-600">45</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Most Generated Report Types</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Prescriptions</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                  <span className="text-sm font-medium">40%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Lab Reports</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="text-sm font-medium">30%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Consultation Summaries</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <span className="text-sm font-medium">20%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Medical Certificates</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <span className="text-sm font-medium">10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}