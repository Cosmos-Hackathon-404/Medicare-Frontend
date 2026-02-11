"use client";

import { use, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { SlotPicker } from "@/components/patient/slot-picker";
import {
  ArrowLeft,
  User,
  CheckCircle2,
  Loader2,
  Calendar,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

export default function BookDoctorPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const { doctorId } = use(params);
  const { user } = useUser();
  const router = useRouter();

  const [selectedDateTime, setSelectedDateTime] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  // Queries
  const doctor = useQuery(api.queries.doctors.getById, {
    doctorId: doctorId as Id<"doctorProfiles">,
  });
  const patientProfile = useQuery(
    api.users.getPatientProfile,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  // Mutation
  const createAppointment = useMutation(api.mutations.appointments.create);

  const isLoading = doctor === undefined;

  const handleBook = async () => {
    if (!selectedDateTime || !doctor || !patientProfile || !user) {
      toast.error("Please select a time slot");
      return;
    }

    setIsBooking(true);
    try {
      await createAppointment({
        patientId: patientProfile._id,
        doctorId: doctor._id,
        patientClerkId: user.id,
        doctorClerkId: doctor.clerkUserId,
        dateTime: selectedDateTime.toISOString(),
        notes: notes || undefined,
      });

      toast.success("Appointment booked successfully!");
      router.push("/patient/appointments");
    } catch (error) {
      console.error("Failed to book appointment:", error);
      toast.error("Failed to book appointment. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[400px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <User className="mb-4 h-16 w-16 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-semibold">Doctor not found</h2>
        <p className="text-muted-foreground">
          This doctor profile doesn&apos;t exist.
        </p>
        <Link href="/patient/book" className="mt-4">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Doctors
          </Button>
        </Link>
      </div>
    );
  }

  const initials = doctor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/patient/book"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Doctors
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Book Appointment</h1>
        <p className="text-muted-foreground">
          Select an available slot and confirm your appointment.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Doctor Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="mb-4 h-20 w-20 border-4 border-background">
                    <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">Dr. {doctor.name}</h2>
                  <Badge variant="secondary" className="mt-2">
                    {doctor.specialization}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3 p-6">
                {doctor.bio && (
                  <p className="text-sm text-muted-foreground">{doctor.bio}</p>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  <span>License: {doctor.licenseNumber}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appointment Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any notes or reason for visit (optional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Slot Picker */}
        <div className="lg:col-span-2">
          {doctor.availableSlots && doctor.availableSlots.length > 0 ? (
            <SlotPicker
              availableSlots={doctor.availableSlots}
              selectedDateTime={selectedDateTime}
              onSelect={setSelectedDateTime}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground opacity-40" />
                <h3 className="font-semibold">No Available Slots</h3>
                <p className="text-sm text-muted-foreground">
                  This doctor hasn&apos;t set up their availability yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirm Button */}
      {selectedDateTime && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Ready to book</p>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDateTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleBook}
              disabled={isBooking}
              className="gap-2"
            >
              {isBooking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Booking
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
