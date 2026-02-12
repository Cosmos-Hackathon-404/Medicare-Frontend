"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Save, User, Shield, FileText } from "lucide-react";
import { SPECIALIZATIONS } from "@/lib/constants";

export default function DoctorSettingsPage() {
  const { user } = useUser();
  const clerkUserId = user?.id ?? "";

  const profile = useQuery(
    api.queries.doctors.getByClerkId,
    clerkUserId ? { clerkUserId } : "skip"
  );
  const updateProfile = useMutation(api.mutations.doctorProfile.updateProfile);

  const [form, setForm] = useState({
    name: "",
    specialization: "",
    licenseNumber: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (profile && !initialized) {
      setForm({
        name: profile.name ?? "",
        specialization: profile.specialization ?? "",
        licenseNumber: profile.licenseNumber ?? "",
        bio: profile.bio ?? "",
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
    setSaving(true);
    try {
      await updateProfile({
        clerkUserId,
        name: form.name,
        specialization: form.specialization,
        licenseNumber: form.licenseNumber,
        bio: form.bio || undefined,
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

      {/* Profile Completeness */}
      {(() => {
        const fields = [form.name, form.specialization, form.licenseNumber, form.bio];
        const filled = fields.filter(Boolean).length;
        const percentage = Math.round((filled / fields.length) * 100);
        return (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Profile Completeness</p>
                <span className="text-sm font-bold text-primary">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-2" />
              {percentage < 100 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Complete all fields to improve your profile visibility to patients.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label>Email</Label>
                <Input value={profile.email} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">
                  Managed through your account settings.
                </p>
              </div>
            </div>

            <Separator />

            {/* Professional Details */}
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-primary" />
                Professional Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Select
                    value={form.specialization}
                    onValueChange={(v) =>
                      setForm({ ...form, specialization: v })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALIZATIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    value={form.licenseNumber}
                    onChange={(e) =>
                      setForm({ ...form, licenseNumber: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Bio */}
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-primary" />
                About You
              </h3>
              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  placeholder="Share your professional background, areas of expertise, and approach to patient care..."
                />
                <p className="text-xs text-muted-foreground">
                  This will be visible to patients when they view your profile.
                </p>
              </div>
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
