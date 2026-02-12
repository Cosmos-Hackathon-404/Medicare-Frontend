"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CalendarIcon,
  Clock,
  Check,
  Sun,
  Sunset,
  Moon,
  CircleDot,
} from "lucide-react";
import {
  addDays,
  format,
  isSameDay,
  startOfDay,
  getDay,
  setHours,
  setMinutes,
  isAfter,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { AvailableSlot } from "@/types";

interface SlotPickerProps {
  availableSlots: AvailableSlot[];
  onSelect: (dateTime: Date) => void;
  selectedDateTime?: Date;
  className?: string;
}

const dayNameToNumber: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

interface TimeGroup {
  label: string;
  icon: React.ReactNode;
  slots: Date[];
}

export function SlotPicker({
  availableSlots,
  onSelect,
  selectedDateTime,
  className,
}: SlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Get available days of week from slots
  const availableDays = useMemo(() => {
    return availableSlots.map((slot) => dayNameToNumber[slot.day.toLowerCase()]);
  }, [availableSlots]);

  // Generate time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const dayOfWeek = getDay(selectedDate);
    const dayName = Object.keys(dayNameToNumber).find(
      (key) => dayNameToNumber[key] === dayOfWeek
    );

    const slot = availableSlots.find(
      (s) => s.day.toLowerCase() === dayName?.toLowerCase()
    );
    if (!slot) return [];

    const [startHour, startMin] = slot.startTime.split(":").map(Number);
    const [endHour, endMin] = slot.endTime.split(":").map(Number);

    const slots: Date[] = [];
    let current = setMinutes(setHours(selectedDate, startHour), startMin);
    const end = setMinutes(setHours(selectedDate, endHour), endMin);

    while (current < end) {
      // Only show future times
      if (isAfter(current, new Date())) {
        slots.push(new Date(current));
      }
      // 30-minute intervals
      current = new Date(current.getTime() + 30 * 60 * 1000);
    }

    return slots;
  }, [selectedDate, availableSlots]);

  // Group time slots by Morning / Afternoon / Evening
  const groupedSlots = useMemo((): TimeGroup[] => {
    if (timeSlots.length === 0) return [];

    const morning: Date[] = [];
    const afternoon: Date[] = [];
    const evening: Date[] = [];

    timeSlots.forEach((slot) => {
      const hour = slot.getHours();
      if (hour < 12) morning.push(slot);
      else if (hour < 17) afternoon.push(slot);
      else evening.push(slot);
    });

    const groups: TimeGroup[] = [];
    if (morning.length > 0)
      groups.push({
        label: "Morning",
        icon: <Sun className="h-4 w-4 text-amber-500" />,
        slots: morning,
      });
    if (afternoon.length > 0)
      groups.push({
        label: "Afternoon",
        icon: <Sunset className="h-4 w-4 text-orange-500" />,
        slots: afternoon,
      });
    if (evening.length > 0)
      groups.push({
        label: "Evening",
        icon: <Moon className="h-4 w-4 text-indigo-400" />,
        slots: evening,
      });

    return groups;
  }, [timeSlots]);

  // Disable dates that don't have available slots
  const disabledDates = (date: Date) => {
    if (date < startOfDay(new Date())) return true;
    if (date > addDays(new Date(), 30)) return true;
    const dayOfWeek = getDay(date);
    return !availableDays.includes(dayOfWeek);
  };

  // Modifier for available dates (show dot indicator)
  const availableModifier = (date: Date) => {
    if (date < startOfDay(new Date())) return false;
    if (date > addDays(new Date(), 30)) return false;
    const dayOfWeek = getDay(date);
    return availableDays.includes(dayOfWeek);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (dateTime: Date) => {
    onSelect(dateTime);
  };

  // Step state
  const currentStep = !selectedDate ? 1 : !selectedDateTime ? 2 : 3;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 px-4">
        {[
          { step: 1, label: "Choose Date" },
          { step: 2, label: "Pick Time" },
          { step: 3, label: "Confirm" },
        ].map(({ step, label }, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                  currentStep >= step
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {currentStep > step ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step
                )}
              </div>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline transition-colors",
                  currentStep >= step
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < 2 && (
              <div
                className={cn(
                  "h-px w-8 sm:w-12 transition-colors duration-300",
                  currentStep > step ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendar */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Select Date
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedDate
                ? format(selectedDate, "EEEE, MMMM d, yyyy")
                : "Choose your preferred appointment date"}
            </p>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-4">
            <TooltipProvider>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={disabledDates}
                modifiers={{ available: availableModifier }}
                modifiersClassNames={{
                  available:
                    "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
                }}
                className="rounded-lg border p-3"
                showOutsideDays={false}
              />
            </TooltipProvider>
          </CardContent>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary opacity-100" />
              <span>Selected</span>
            </div>
          </div>
        </Card>

        {/* Time Slots */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Select Time
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedDate
                ? `${timeSlots.length} slot${timeSlots.length !== 1 ? "s" : ""} available`
                : "Select a date first"}
            </p>
          </CardHeader>
          <CardContent className="p-4">
            {!selectedDate ? (
              <div className="flex h-[320px] flex-col items-center justify-center text-muted-foreground">
                <div className="rounded-full bg-muted/50 p-4 mb-4">
                  <CalendarIcon className="h-8 w-8 opacity-40" />
                </div>
                <p className="font-medium">No date selected</p>
                <p className="mt-1 text-sm">
                  Pick a date to see available time slots
                </p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="flex h-[320px] flex-col items-center justify-center text-muted-foreground">
                <div className="rounded-full bg-muted/50 p-4 mb-4">
                  <Clock className="h-8 w-8 opacity-40" />
                </div>
                <p className="font-medium">No available times</p>
                <p className="mt-1 text-sm">
                  All slots for this date have passed. Try another date.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[320px] pr-3">
                <div className="space-y-5">
                  {groupedSlots.map((group) => (
                    <div key={group.label}>
                      <div className="mb-2.5 flex items-center gap-2">
                        {group.icon}
                        <span className="text-sm font-semibold">
                          {group.label}
                        </span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {group.slots.length} slot
                          {group.slots.length > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {group.slots.map((slot) => {
                          const isSelected =
                            selectedDateTime &&
                            isSameDay(slot, selectedDateTime) &&
                            slot.getTime() === selectedDateTime.getTime();

                          return (
                            <TooltipProvider key={slot.toISOString()}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                      "relative h-10 w-full font-medium transition-all duration-200",
                                      isSelected
                                        ? "bg-primary shadow-md shadow-primary/25 ring-2 ring-primary/20"
                                        : "hover:border-primary/50 hover:bg-primary/5"
                                    )}
                                    onClick={() => handleTimeSelect(slot)}
                                  >
                                    {isSelected && (
                                      <Check className="mr-1 h-3.5 w-3.5" />
                                    )}
                                    {format(slot, "h:mm a")}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {format(slot, "EEEE, MMM d")} at{" "}
                                    {format(slot, "h:mm a")}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                      {group !==
                        groupedSlots[groupedSlots.length - 1] && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
