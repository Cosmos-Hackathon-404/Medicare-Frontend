"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  CalendarCog,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface SlotEntry {
  day: string;
  startTime: string;
  endTime: string;
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7; // 7 AM to 20:30
  const min = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${min}`;
});

export default function AvailabilityPage() {
  const { user } = useUser();
  const clerkUserId = user?.id ?? "";

  const doctorProfile = useQuery(
    api.queries.doctors.getByClerkId,
    clerkUserId ? { clerkUserId } : "skip"
  );

  const updateSlots = useMutation(api.mutations.doctorProfile.updateAvailableSlots);

  const [slots, setSlots] = useState<SlotEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize slots from profile
  useEffect(() => {
    if (doctorProfile?.availableSlots) {
      setSlots(
        doctorProfile.availableSlots.map((s) => ({
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
        }))
      );
    }
  }, [doctorProfile]);

  const addSlot = () => {
    // Default to the first day that has the fewest slots, or monday
    const dayCounts = DAYS.map((d) => ({ day: d, count: slots.filter((s) => s.day === d).length }));
    const leastUsed = dayCounts.sort((a, b) => a.count - b.count)[0];
    const nextDay = leastUsed?.day ?? "monday";
    setSlots([...slots, { day: nextDay, startTime: "09:00", endTime: "17:00" }]);
    setHasChanges(true);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const updateSlot = (index: number, field: keyof SlotEntry, value: string) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!clerkUserId) return;

    // Validate: start < end for each slot
    for (const slot of slots) {
      if (slot.startTime >= slot.endTime) {
        toast.error(`Invalid time range for ${slot.day}: start must be before end`);
        return;
      }
    }

    // Validate: no overlapping time ranges within same day
    for (const day of DAYS) {
      const daySlots = slots.filter((s) => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < daySlots.length - 1; i++) {
        if (daySlots[i].endTime > daySlots[i + 1].startTime) {
          toast.error(`Overlapping time slots on ${day.charAt(0).toUpperCase() + day.slice(1)}: ${daySlots[i].startTime}-${daySlots[i].endTime} overlaps with ${daySlots[i + 1].startTime}-${daySlots[i + 1].endTime}`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      await updateSlots({
        clerkUserId,
        availableSlots: slots,
      });
      setHasChanges(false);
      toast.success("Availability updated successfully");
    } catch (error) {
      console.error("Failed to update availability:", error);
      toast.error("Failed to update availability");
    } finally {
      setIsSaving(false);
    }
  };

  if (!doctorProfile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Availability</h1>
          <p className="text-muted-foreground">
            Set your weekly schedule so patients can book appointments.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Slots */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarCog className="h-5 w-5 text-primary" />
            Weekly Schedule
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={addSlot}
            disabled={slots.length >= 14}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Day
          </Button>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Clock className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p className="font-medium">No availability set</p>
              <p className="text-sm mb-4">
                Add your available days and hours so patients can book with you.
              </p>
              <Button onClick={addSlot} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Slot
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {slots
                .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day))
                .map((slot, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-center gap-3 rounded-lg border p-4"
                  >
                    {/* Day selector */}
                    <Select
                      value={slot.day}
                      onValueChange={(v) => updateSlot(index, "day", v)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Start time */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">from</span>
                      <Select
                        value={slot.startTime}
                        onValueChange={(v) => updateSlot(index, "startTime", v)}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* End time */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">to</span>
                      <Select
                        value={slot.endTime}
                        onValueChange={(v) => updateSlot(index, "endTime", v)}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Remove button */}
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

      {/* Current Schedule Preview */}
      {slots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Schedule Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {slots
                .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day))
                .map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg bg-primary/5 p-3"
                  >
                    <Badge variant="secondary" className="capitalize">
                      {slot.day}
                    </Badge>
                    <span className="text-sm">
                      {slot.startTime} — {slot.endTime}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
