"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Clock, Check } from "lucide-react";
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

  // Disable dates that don't have available slots
  const disabledDates = (date: Date) => {
    // Disable past dates
    if (date < startOfDay(new Date())) return true;

    // Disable dates more than 30 days out
    if (date > addDays(new Date(), 30)) return true;

    // Disable dates where the day of week is not available
    const dayOfWeek = getDay(date);
    return !availableDays.includes(dayOfWeek);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (dateTime: Date) => {
    onSelect(dateTime);
  };

  return (
    <div className={cn("grid gap-6 lg:grid-cols-2", className)}>
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={disabledDates}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Select Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <div className="flex h-[280px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CalendarIcon className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>Select a date to view available times</p>
              </div>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Clock className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>No available times for this date</p>
                <p className="text-sm">Try selecting a different date</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[280px] pr-4">
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((slot) => {
                  const isSelected =
                    selectedDateTime && isSameDay(slot, selectedDateTime) &&
                    slot.getTime() === selectedDateTime.getTime();

                  return (
                    <Button
                      key={slot.toISOString()}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "justify-start gap-2",
                        isSelected && "bg-primary"
                      )}
                      onClick={() => handleTimeSelect(slot)}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                      {format(slot, "h:mm a")}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Selected DateTime Summary */}
      {selectedDateTime && (
        <Card className="border-primary/30 bg-primary/5 lg:col-span-2">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Selected Appointment</p>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDateTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <Badge variant="secondary">Ready to book</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
