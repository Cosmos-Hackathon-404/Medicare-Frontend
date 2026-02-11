"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Plus, Trash2, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 21; h++) {
  for (const m of ["00", "30"]) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, "0")}:${m}`);
  }
}

interface Slot {
  day: string;
  startTime: string;
  endTime: string;
}

export default function AvailabilityPage() {
  const { user } = useUser();
  const doctorClerkId = user?.id ?? "";

  const doctorProfile = useQuery(
    api.users.getDoctorProfile,
    doctorClerkId ? { clerkUserId: doctorClerkId } : "skip"
  );

  const updateSlots = useMutation(api.mutations.doctors.updateAvailableSlots);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize slots from doctor profile once loaded
  if (doctorProfile && !initialized) {
    setSlots(doctorProfile.availableSlots ?? []);
    setInitialized(true);
  }

  const addSlot = () => {
    setSlots([...slots, { day: "monday", startTime: "09:00", endTime: "17:00" }]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof Slot, value: string) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  const handleSave = async () => {
    if (!doctorClerkId) return;

    // Validate that endTime > startTime
    for (const slot of slots) {
      if (slot.startTime >= slot.endTime) {
        toast.error(`Invalid time range for ${slot.day}: start time must be before end time.`);
        return;
      }
    }

    setSaving(true);
    try {
      await updateSlots({
        clerkUserId: doctorClerkId,
        availableSlots: slots,
      });
      toast.success("Availability updated successfully!");
    } catch (error) {
      console.error("Failed to update slots:", error);
      toast.error("Failed to update availability. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!doctorProfile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage Availability</h1>
        <p className="text-muted-foreground">
          Set the days and time ranges when patients can book appointments with you.
        </p>
      </div>

      {/* Current Slots */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Time Slots
          </CardTitle>
          <Button onClick={addSlot} size="sm" variant="outline">
            <Plus className="mr-1 h-4 w-4" />
            Add Slot
          </Button>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="font-semibold">No Slots Configured</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add time slots so patients can book appointments with you.
              </p>
              <Button onClick={addSlot} className="mt-4" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add Your First Slot
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                >
                  {/* Day */}
                  <select
                    value={slot.day}
                    onChange={(e) => updateSlot(index, "day", e.target.value)}
                    className="rounded-md border bg-background px-3 py-2 text-sm capitalize"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day} value={day} className="capitalize">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </option>
                    ))}
                  </select>

                  {/* Start Time */}
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">From</span>
                    <select
                      value={slot.startTime}
                      onChange={(e) => updateSlot(index, "startTime", e.target.value)}
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* End Time */}
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">To</span>
                    <select
                      value={slot.endTime}
                      onChange={(e) => updateSlot(index, "endTime", e.target.value)}
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Remove */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSlot(index)}
                    className="ml-auto text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {slots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Slot Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const daySlots = slots.filter((s) => s.day === day);
                if (daySlots.length === 0) return null;
                return (
                  <Badge key={day} variant="secondary" className="gap-1 capitalize">
                    <CheckCircle2 className="h-3 w-3" />
                    {day}: {daySlots.map((s) => `${s.startTime}–${s.endTime}`).join(", ")}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Availability"}
        </Button>
      </div>
    </div>
  );
}
