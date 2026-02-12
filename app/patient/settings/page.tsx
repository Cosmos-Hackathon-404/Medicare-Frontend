"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";
import { BLOOD_GROUPS } from "@/lib/constants";

export default function PatientSettingsPage() {
  const { user } = useUser();
  const clerkUserId = user?.id ?? "";

  const profile = useQuery(
    api.queries.patients.getByClerkId,
    clerkUserId ? { clerkUserId } : "skip"
  );
  const updateProfile = useMutation(
    api.mutations.patientProfile.updateProfile
  );

  const [form, setForm] = useState({
    name: "",
    age: "",
    bloodGroup: "",
    allergies: "",
    emergencyContact: "",
  });
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (profile && !initialized) {
      setForm({
        name: profile.name ?? "",
        age: String(profile.age ?? ""),
        bloodGroup: profile.bloodGroup ?? "",
        allergies: profile.allergies ?? "",
        emergencyContact: profile.emergencyContact ?? "",
      });
      setInitialized(true);
    }
  }, [profile, initialized]);

  if (!profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!clerkUserId) return;

    const age = parseInt(form.age);
    if (isNaN(age) || age < 1 || age > 150) {
      toast.error("Please enter a valid age (1-150)");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        clerkUserId,
        name: form.name,
        age,
        bloodGroup: form.bloodGroup || undefined,
        allergies: form.allergies || undefined,
        emergencyContact: form.emergencyContact || undefined,
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-7 w-7" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your profile information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={1}
                max={150}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <Select
                value={form.bloodGroup}
                onValueChange={(v) => setForm({ ...form, bloodGroup: v })}
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
                value={form.allergies}
                onChange={(e) =>
                  setForm({ ...form, allergies: e.target.value })
                }
                placeholder="Penicillin, Peanuts"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency">Emergency Contact</Label>
              <Input
                id="emergency"
                value={form.emergencyContact}
                onChange={(e) =>
                  setForm({ ...form, emergencyContact: e.target.value })
                }
                placeholder="+1 555-0123"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">
                Email is managed through your account settings.
              </p>
            </div>
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
