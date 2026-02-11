"use client";

import DoctorSidebar from "@/components/doctor/sidebar";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <DoctorSidebar />
      {/* Main content area - offset by sidebar width */}
      <main className="ml-64 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
