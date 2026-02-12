"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPECIALIZATIONS, BLOOD_GROUPS } from "@/lib/constants";

type Role = "doctor" | "patient";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  // If user already has a role, redirect
  const existingRole = user?.publicMetadata?.role as Role | undefined;
  useEffect(() => {
    if (existingRole) {
      router.push(`/${existingRole}/dashboard`);
    }
  }, [existingRole, router]);

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

  if (!isLoaded || !user || existingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !user) return;

    // Validate age
    if (role === "patient") {
      const age = parseInt(patientForm.age);
      if (isNaN(age) || age < 1 || age > 150) {
        return;
      }
    }

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
          age: parseInt(patientForm.age),
          bloodGroup: patientForm.bloodGroup || undefined,
          allergies: patientForm.allergies || undefined,
          emergencyContact: patientForm.emergencyContact || undefined,
        });
      }

      // Set role in Clerk publicMetadata via backend
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
              <Label htmlFor="doctor-name">Full Name *</Label>
              <Input
                id="doctor-name"
                required
                value={doctorForm.name}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, name: e.target.value })
                }
                placeholder="Dr. John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label>Specialization *</Label>
              <Select
                value={doctorForm.specialization}
                onValueChange={(value) =>
                  setDoctorForm({ ...doctorForm, specialization: value })
                }
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">License Number *</Label>
              <Input
                id="license"
                required
                value={doctorForm.licenseNumber}
                onChange={(e) =>
                  setDoctorForm({
                    ...doctorForm,
                    licenseNumber: e.target.value,
                  })
                }
                placeholder="MD-12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={doctorForm.bio}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, bio: e.target.value })
                }
                placeholder="Brief professional bio..."
                rows={3}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !doctorForm.specialization}
            >
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
              <Label htmlFor="patient-name">Full Name *</Label>
              <Input
                id="patient-name"
                required
                value={patientForm.name}
                onChange={(e) =>
                  setPatientForm({ ...patientForm, name: e.target.value })
                }
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                required
                type="number"
                min={1}
                max={150}
                value={patientForm.age}
                onChange={(e) =>
                  setPatientForm({ ...patientForm, age: e.target.value })
                }
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <Select
                value={patientForm.bloodGroup}
                onValueChange={(value) =>
                  setPatientForm({ ...patientForm, bloodGroup: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((bg) => (
                    <SelectItem key={bg} value={bg}>
                      {bg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Input
                id="allergies"
                value={patientForm.allergies}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    allergies: e.target.value,
                  })
                }
                placeholder="Penicillin, Peanuts"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency">Emergency Contact</Label>
              <Input
                id="emergency"
                value={patientForm.emergencyContact}
                onChange={(e) =>
                  setPatientForm({
                    ...patientForm,
                    emergencyContact: e.target.value,
                  })
                }
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
