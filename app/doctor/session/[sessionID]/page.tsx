'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Video, Mic, MicOff, VideoOff, Phone, Clock, FileText, 
  Stethoscope, Activity, Heart, Thermometer, Download, Save 
} from 'lucide-react';

export default function SessionView({ params }: { params: { appointmentId: string } }) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [activeTab, setActiveTab] = useState('notes');

  // Mock data
  const appointment = {
    id: params.appointmentId,
    patient: 'John Doe',
    patientId: 'p1',
    age: 45,
    time: '09:00 AM',
    type: 'Follow-up',
    chiefComplaint: 'Follow-up on blood pressure medication',
  };

  const vitals = [
    { label: 'Blood Pressure', value: '128/82', unit: 'mmHg', icon: Activity, status: 'normal' },
    { label: 'Heart Rate', value: '72', unit: 'bpm', icon: Heart, status: 'normal' },
    { label: 'Temperature', value: '98.6', unit: '°F', icon: Thermometer, status: 'normal' },
    { label: 'SpO2', value: '98', unit: '%', icon: Activity, status: 'normal' },
  ];

  const medicalHistory = [
    'Hypertension (diagnosed 2020)',
    'Type 2 Diabetes (diagnosed 2018)',
    'Seasonal Allergies',
  ];

  const currentMedications = [
    { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
    { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/doctor/appointments" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block">
                ← Back to Appointments
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Session: {appointment.patient}</h1>
              <p className="text-gray-600 mt-1">{appointment.type} - {appointment.time}</p>
            </div>
            <div className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <span className="font-medium">Session Active</span>
              <Clock size={16} />
              <span className="font-mono">15:23</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Feed */}
            <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Video className="text-white mx-auto mb-4" size={64} />
                  <p className="text-white text-lg">Video Consultation Active</p>
                  <p className="text-gray-400 text-sm mt-2">Patient: {appointment.patient}</p>
                </div>
              </div>
              
              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`p-4 rounded-full ${isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
                  >
                    {isMicOn ? <Mic className="text-white" size={24} /> : <MicOff className="text-white" size={24} />}
                  </button>
                  <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`p-4 rounded-full ${isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
                  >
                    {isVideoOn ? <Video className="text-white" size={24} /> : <VideoOff className="text-white" size={24} />}
                  </button>
                  <button className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors">
                    <Phone className="text-white" size={24} />
                  </button>
                </div>
              </div>
            </div>

            {/* Session Notes */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-6 py-4 font-medium ${activeTab === 'notes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  >
                    Session Notes
                  </button>
                  <button
                    onClick={() => setActiveTab('prescription')}
                    className={`px-6 py-4 font-medium ${activeTab === 'prescription' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  >
                    Prescription
                  </button>
                  <button
                    onClick={() => setActiveTab('labs')}
                    className={`px-6 py-4 font-medium ${activeTab === 'labs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  >
                    Lab Orders
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'notes' && (
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chief Complaint
                      </label>
                      <input
                        type="text"
                        defaultValue={appointment.chiefComplaint}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        History of Present Illness
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Document patient's symptoms, duration, severity..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Physical Examination
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Document examination findings..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assessment & Plan
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Document diagnosis and treatment plan..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>
                  </div>
                )}

                {activeTab === 'prescription' && (
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medication Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter medication name..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dosage
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 10mg"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frequency
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Twice daily"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 30 days"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add to Prescription
                    </button>
                  </div>
                )}

                {activeTab === 'labs' && (
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lab Test
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>Complete Blood Count (CBC)</option>
                        <option>Basic Metabolic Panel</option>
                        <option>Lipid Panel</option>
                        <option>Thyroid Function Tests</option>
                        <option>Hemoglobin A1C</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option>Routine</option>
                        <option>Urgent</option>
                        <option>STAT</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clinical Notes
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Enter clinical indication for test..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      ></textarea>
                    </div>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Order Lab Test
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patient Info Sidebar */}
          <div className="space-y-6">
            {/* Patient Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <Link href={`/doctor/patient/${appointment.patientId}`} className="font-medium text-blue-600 hover:text-blue-700">
                    {appointment.patient}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="font-medium">{appointment.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Appointment Type</p>
                  <p className="font-medium">{appointment.type}</p>
                </div>
              </div>
              <Link
                href={`/doctor/patient/${appointment.patientId}`}
                className="mt-4 block w-full text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                View Full Profile
              </Link>
            </div>

            {/* Current Vitals */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Stethoscope size={20} />
                Current Vitals
              </h3>
              <div className="space-y-3">
                {vitals.map((vital) => (
                  <div key={vital.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <vital.icon size={16} className="text-blue-600" />
                      <span className="text-sm font-medium">{vital.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{vital.value}</p>
                      <p className="text-xs text-gray-600">{vital.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Medical History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Medical History</h3>
              <ul className="space-y-2">
                {medicalHistory.map((item, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Current Medications */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Current Medications</h3>
              <div className="space-y-3">
                {currentMedications.map((med, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{med.name}</p>
                    <p className="text-xs text-gray-600">{med.dosage} - {med.frequency}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-4">
          <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download size={20} />
            Export Session
          </button>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Save size={20} />
            Save & Complete Session
          </button>
        </div>
      </main>
    </div>
  );
}