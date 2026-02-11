"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Role = "doctor" | "patient";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  // Doctor form state
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    specialization: "",
    licenseNumber: "",
    bio: "",
  });

  // Patient form state
  const [patientForm, setPatientForm] = useState({
    name: "",
    age: "",
    bloodGroup: "",
    allergies: "",
    emergencyContact: "",
  });

  const createDoctorProfile = useMutation(api.users.createDoctorProfile);
  const createPatientProfile = useMutation(api.users.createPatientProfile);

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If user already has a role, redirect
  const existingRole = user.publicMetadata?.role as Role | undefined;
  if (existingRole) {
    router.push(`/${existingRole}/dashboard`);
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !user) return;
    setLoading(true);

    try {
      if (role === "doctor") {
        await createDoctorProfile({
          clerkUserId: user.id,
          name: doctorForm.name,
          email: user.emailAddresses[0]?.emailAddress ?? "",
          specialization: doctorForm.specialization,
          licenseNumber: doctorForm.licenseNumber,
          bio: doctorForm.bio || undefined,
        });
      } else {
        await createPatientProfile({
          clerkUserId: user.id,
          name: patientForm.name,
          email: user.emailAddresses[0]?.emailAddress ?? "",
          age: parseInt(patientForm.age) || 0,
          bloodGroup: patientForm.bloodGroup || undefined,
          allergies: patientForm.allergies || undefined,
          emergencyContact: patientForm.emergencyContact || undefined,
        });
      }

      // Set role in Clerk publicMetadata
      await user.update({
        unsafeMetadata: { role },
      });

      // Also update via backend for publicMetadata
      await fetch("/api/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      router.push(`/${role}/dashboard`);
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-lg space-y-6 rounded-lg border p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Welcome to Medicare AI</h1>
          <p className="text-muted-foreground">
            Select your role and complete your profile to get started.
          </p>
        </div>

        {/* Role Selection */}
        {!role && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setRole("doctor")}
              className="flex flex-col items-center gap-3 rounded-lg border-2 border-muted p-6 transition-colors hover:border-primary hover:bg-muted/50"
            >
              <span className="text-4xl">🩺</span>
              <span className="font-semibold">I&apos;m a Doctor</span>
              <span className="text-xs text-muted-foreground">
                Manage appointments & sessions
              </span>
            </button>
            <button
              onClick={() => setRole("patient")}
              className="flex flex-col items-center gap-3 rounded-lg border-2 border-muted p-6 transition-colors hover:border-primary hover:bg-muted/50"
            >
              <span className="text-4xl">🧑‍⚕️</span>
              <span className="font-semibold">I&apos;m a Patient</span>
              <span className="text-xs text-muted-foreground">
                Book appointments & upload reports
              </span>
            </button>
          </div>
        )}

        {/* Doctor Form */}
        {role === "doctor" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setRole(null)}
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Change role
            </button>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name *</label>
              <input
                required
                value={doctorForm.name}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, name: e.target.value })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Dr. John Smith"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Specialization *</label>
              <input
                required
                value={doctorForm.specialization}
                onChange={(e) =>
                  setDoctorForm({
                    ...doctorForm,
                    specialization: e.target.value,
                  })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Cardiology"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">License Number *</label>
              <input
                required
                value={doctorForm.licenseNumber}
                onChange={(e) =>
                  setDoctorForm({
                    ...doctorForm,
                    licenseNumber: e.target.value,
                  })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="MD-12345"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                value={doctorForm.bio}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, bio: e.target.value })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Brief professional bio..."
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating profile..." : "Complete Setup"}
            </Button>
          </form>
        )}

        {/* Patient Form */}
        {role === "patient" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setRole(null)}
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Change role
            </button>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name *</label>
              <input
                required
                value={patientForm.name}
                onChange={(e) =>
                  setPatientForm({ ...patientForm, name: e.target.value })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Age *</label>
              <input
                required
                type="number"
                value={patientForm.age}
                onChange={(e) =>
                  setPatientForm({ ...patientForm, age: e.target.value })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Blood Group</label>
              <input
                value={patientForm.bloodGroup}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    bloodGroup: e.target.value,
                  })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="O+"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Allergies</label>
              <input
                value={patientForm.allergies}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    allergies: e.target.value,
                  })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Penicillin, Peanuts"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Emergency Contact</label>
              <input
                value={patientForm.emergencyContact}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    emergencyContact: e.target.value,
                  })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="+1 555-0123"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating profile..." : "Complete Setup"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
