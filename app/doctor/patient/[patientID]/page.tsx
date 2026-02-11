'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  User, Calendar, FileText, Activity, Heart, Pill, AlertCircle,
  Phone, Mail, MapPin, Download, Edit, Clock
} from 'lucide-react';

export default function PatientDetail({ params }: { params: { patientId: string } }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock patient data
  const patient = {
    id: params.patientId,
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    dateOfBirth: '1979-03-15',
    bloodGroup: 'O+',
    phone: '+1 (555) 123-4567',
    email: 'john.doe@email.com',
    address: '123 Main St, Cityville, State 12345',
    emergencyContact: 'Jane Doe - +1 (555) 987-6543',
    registrationDate: '2020-01-15',
  };

  const appointments = [
    { id: '1', date: '2024-02-11', time: '09:00 AM', type: 'Follow-up', status: 'scheduled', doctor: 'Dr. Anderson' },
    { id: '2', date: '2024-01-28', time: '02:00 PM', type: 'Follow-up', status: 'completed', doctor: 'Dr. Anderson' },
    { id: '3', date: '2024-01-15', time: '10:30 AM', type: 'Check-up', status: 'completed', doctor: 'Dr. Anderson' },
    { id: '4', date: '2023-12-20', time: '03:00 PM', type: 'Consultation', status: 'completed', doctor: 'Dr. Smith' },
  ];

  const medicalHistory = [
    { condition: 'Hypertension', diagnosedDate: '2020-03-10', status: 'Active', severity: 'Moderate' },
    { condition: 'Type 2 Diabetes', diagnosedDate: '2018-07-22', status: 'Active', severity: 'Controlled' },
    { condition: 'Seasonal Allergies', diagnosedDate: '2015-05-01', status: 'Active', severity: 'Mild' },
  ];

  const medications = [
    { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', startDate: '2020-03-10', prescribedBy: 'Dr. Anderson' },
    { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', startDate: '2018-07-22', prescribedBy: 'Dr. Smith' },
    { name: 'Loratadine', dosage: '10mg', frequency: 'As needed', startDate: '2015-05-01', prescribedBy: 'Dr. Johnson' },
  ];

  const labResults = [
    { test: 'Hemoglobin A1C', value: '6.8%', date: '2024-01-28', status: 'normal', range: '4.0-5.6%' },
    { test: 'Blood Pressure', value: '128/82 mmHg', date: '2024-01-28', status: 'normal', range: '<120/80' },
    { test: 'Cholesterol Total', value: '195 mg/dL', date: '2024-01-15', status: 'normal', range: '<200 mg/dL' },
    { test: 'Blood Glucose', value: '105 mg/dL', date: '2024-01-15', status: 'normal', range: '70-100 mg/dL' },
  ];

  const vitalsHistory = [
    { date: '2024-01-28', bp: '128/82', hr: '72', temp: '98.6', weight: '185' },
    { date: '2024-01-15', bp: '130/84', hr: '75', temp: '98.4', weight: '187' },
    { date: '2023-12-20', bp: '132/86', hr: '78', temp: '98.7', weight: '189' },
  ];

  const allergies = [
    { allergen: 'Penicillin', reaction: 'Severe rash', severity: 'High' },
    { allergen: 'Pollen', reaction: 'Sneezing, watery eyes', severity: 'Moderate' },
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
              <h1 className="text-3xl font-bold text-gray-900">Patient Profile</h1>
              <p className="text-gray-600 mt-1">Complete medical record and history</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Download size={20} />
                Export
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Edit size={20} />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={48} className="text-blue-600" />
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{patient.name}</h2>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">Patient ID: #{patient.id}</p>
                  <p className="text-gray-600">{patient.age} years • {patient.gender}</p>
                  <p className="text-gray-600">Blood Group: {patient.bloodGroup}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={16} className="text-gray-400" />
                    <span>{patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-gray-400" />
                    <span>{patient.email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin size={16} className="text-gray-400 mt-1" />
                    <span>{patient.address}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</h3>
                <p className="text-sm">{patient.emergencyContact}</p>
                <div className="mt-4">
                  <p className="text-xs text-gray-600">Registered Since</p>
                  <p className="text-sm font-medium">{new Date(patient.registrationDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{appointments.length}</p>
              <p className="text-sm text-gray-600">Total Appointments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{medications.length}</p>
              <p className="text-sm text-gray-600">Active Medications</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{allergies.length}</p>
              <p className="text-sm text-gray-600">Known Allergies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{medicalHistory.length}</p>
              <p className="text-sm text-gray-600">Conditions</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {['overview', 'appointments', 'medications', 'labs', 'vitals'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-medium whitespace-nowrap ${
                    activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Allergies Alert */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 mb-2">Known Allergies</h3>
                      <div className="space-y-2">
                        {allergies.map((allergy, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{allergy.allergen}:</span> {allergy.reaction}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                              allergy.severity === 'High' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                            }`}>
                              {allergy.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Medical History */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText size={20} />
                      Medical History
                    </h3>
                    <div className="space-y-3">
                      {medicalHistory.map((condition, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{condition.condition}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              condition.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {condition.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">Severity: {condition.severity}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Current Medications */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Pill size={20} />
                      Current Medications
                    </h3>
                    <div className="space-y-3">
                      {medications.map((med, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <h4 className="font-medium mb-1">{med.name}</h4>
                          <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
                          <p className="text-xs text-gray-500 mt-2">Prescribed by {med.prescribedBy}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Appointment History</h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Schedule New
                  </button>
                </div>
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="font-medium">{new Date(apt.date).toLocaleDateString()}</span>
                            <span className="text-gray-600">at {apt.time}</span>
                          </div>
                          <p className="text-sm text-gray-600">{apt.type} with {apt.doctor}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          apt.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medications Tab */}
            {activeTab === 'medications' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Medication List</h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Add Medication
                  </button>
                </div>
                <div className="space-y-3">
                  {medications.map((med, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{med.name}</h4>
                          <p className="text-gray-600">{med.dosage}</p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Edit
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Frequency</p>
                          <p className="font-medium">{med.frequency}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Start Date</p>
                          <p className="font-medium">{new Date(med.startDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Prescribed by {med.prescribedBy}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Labs Tab */}
            {activeTab === 'labs' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Laboratory Results</h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Order New Test
                  </button>
                </div>
                <div className="space-y-3">
                  {labResults.map((result, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{result.test}</h4>
                          <p className="text-sm text-gray-600">Tested on {new Date(result.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          result.status === 'normal' ? 'bg-green-100 text-green-800' : 
                          result.status === 'abnormal' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{result.value}</p>
                          <p className="text-xs text-gray-500">Reference: {result.range}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vitals Tab */}
            {activeTab === 'vitals' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Vital Signs History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Blood Pressure</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Heart Rate</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Temperature</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {vitalsHistory.map((vital, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{new Date(vital.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm font-medium">{vital.bp} mmHg</td>
                          <td className="px-4 py-3 text-sm">{vital.hr} bpm</td>
                          <td className="px-4 py-3 text-sm">{vital.temp}°F</td>
                          <td className="px-4 py-3 text-sm">{vital.weight} lbs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}