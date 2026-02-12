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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SlotPicker } from "@/components/patient/slot-picker";
import {
  ArrowLeft,
  User,
  CheckCircle2,
  Loader2,
  Calendar,
  Stethoscope,
  FileText,
  Image as ImageIcon,
  Share2,
  Clock,
  ClipboardList,
  ShieldCheck,
  Video,
  Building2,
} from "lucide-react";
import type { AppointmentType } from "@/types";
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
  const [selectedReportIds, setSelectedReportIds] = useState<Id<"reports">[]>([]);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("offline");

  // Queries
  const doctor = useQuery(api.queries.doctors.getById, {
    doctorId: doctorId as Id<"doctorProfiles">,
  });
  const patientProfile = useQuery(
    api.queries.patients.getByClerkId,
    user?.id ? { clerkUserId: user.id } : "skip"
  );
  const patientReports = useQuery(
    api.queries.reports.getByPatient,
    user?.id ? { patientClerkId: user.id } : "skip"
  );

  // Mutation
  const createAppointment = useMutation(api.mutations.appointments.create);

  const isLoading = doctor === undefined;

  const toggleReportSelection = (reportId: Id<"reports">) => {
    setSelectedReportIds((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

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
        type: appointmentType,
        notes: notes || undefined,
        sharedReportIds: selectedReportIds.length > 0 ? selectedReportIds : undefined,
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
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Doctors
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Book Appointment</h1>
        <p className="text-muted-foreground">
          Select an available slot and confirm your appointment.
        </p>
      </div>

      {/* Doctor Info Banner - Compact horizontal card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
            <Avatar className="h-16 w-16 border-4 border-background shadow-md shrink-0">
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="text-xl font-semibold">Dr. {doctor.name}</h2>
              <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Badge variant="secondary">{doctor.specialization}</Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        {doctor.licenseNumber}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Medical License Number</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {doctor.availableSlots && doctor.availableSlots.length > 0 && (
                  <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800">
                    <Clock className="h-3 w-3" />
                    {doctor.availableSlots.length} slot{doctor.availableSlots.length > 1 ? "s" : ""} / week
                  </Badge>
                )}
              </div>
              {doctor.bio && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {doctor.bio}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Type Selection */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Appointment Type
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose how you&apos;d like to meet with the doctor
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAppointmentType("offline")}
              className={`flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all ${
                appointmentType === "offline"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                appointmentType === "offline" ? "bg-primary/20" : "bg-muted"
              }`}>
                <Building2 className={`h-6 w-6 ${
                  appointmentType === "offline" ? "text-primary" : "text-muted-foreground"
                }`} />
              </div>
              <div>
                <p className="font-semibold">In-Person Visit</p>
                <p className="text-sm text-muted-foreground">
                  Visit the doctor at their clinic
                </p>
              </div>
              {appointmentType === "offline" && (
                <CheckCircle2 className="ml-auto h-5 w-5 text-primary shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setAppointmentType("online")}
              className={`flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all ${
                appointmentType === "online"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                appointmentType === "online" ? "bg-primary/20" : "bg-muted"
              }`}>
                <Video className={`h-6 w-6 ${
                  appointmentType === "online" ? "text-primary" : "text-muted-foreground"
                }`} />
              </div>
              <div>
                <p className="font-semibold">Video Consultation</p>
                <p className="text-sm text-muted-foreground">
                  Connect via secure video call
                </p>
              </div>
              {appointmentType === "online" && (
                <CheckCircle2 className="ml-auto h-5 w-5 text-primary shrink-0" />
              )}
            </button>
          </div>
          {appointmentType === "online" && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-blue-500/5 border border-blue-500/20 px-3 py-2 text-sm">
              <Video className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-muted-foreground">
                A secure video room will be created. You&apos;ll be able to join the call from your appointments page.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content - Slot Picker */}
      <div>
        {doctor.availableSlots && doctor.availableSlots.length > 0 ? (
          <SlotPicker
            availableSlots={doctor.availableSlots}
            selectedDateTime={selectedDateTime}
            onSelect={setSelectedDateTime}
          />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted/50 p-4 mb-4">
                <Calendar className="h-10 w-10 text-muted-foreground opacity-40" />
              </div>
              <h3 className="font-semibold">No Available Slots</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This doctor hasn&apos;t set up their availability yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Details - Notes & Reports side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notes */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-primary" />
              Appointment Notes
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Describe your symptoms or reason for visit
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <Textarea
              placeholder="E.g., I've been experiencing headaches for the past 2 weeks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Share Reports */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Share2 className="h-5 w-5 text-primary" />
              Share Reports
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Attach medical reports for the doctor to review
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {patientReports === undefined ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : patientReports.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="rounded-full bg-muted/50 p-3 mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground opacity-40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No reports uploaded yet
                </p>
                <Link href="/patient/reports" className="mt-3">
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Upload Reports
                  </Button>
                </Link>
              </div>
            ) : (
              <ScrollArea className="max-h-[220px]">
                <div className="space-y-2">
                  {patientReports.map((report) => (
                    <div
                      key={report._id}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-all duration-200 cursor-pointer hover:bg-muted/50 ${
                        selectedReportIds.includes(report._id)
                          ? "border-primary bg-primary/5 shadow-sm"
                          : ""
                      }`}
                      onClick={() => toggleReportSelection(report._id)}
                    >
                      <Checkbox
                        checked={selectedReportIds.includes(report._id)}
                        onCheckedChange={() => toggleReportSelection(report._id)}
                        className="pointer-events-none"
                      />
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        {report.fileType === "pdf" ? (
                          <FileText className="h-4 w-4 text-red-500" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {report.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report._creationTime), "MMM d, yyyy")}
                        </p>
                      </div>
                      {report.criticalFlags && report.criticalFlags.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {report.criticalFlags.length} flag{report.criticalFlags.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {selectedReportIds.length > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">
                  {selectedReportIds.length} report{selectedReportIds.length > 1 ? "s" : ""} will be shared
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sticky Confirm Button */}
      {selectedDateTime && (
        <div className="sticky bottom-4 z-10">
          <Card className="border-primary/30 bg-primary/5 backdrop-blur-sm shadow-lg">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 shrink-0">
                  {appointmentType === "online" ? (
                    <Video className="h-6 w-6 text-primary" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">Ready to book</p>
                    <Badge variant={appointmentType === "online" ? "default" : "secondary"} className="gap-1 text-xs">
                      {appointmentType === "online" ? (
                        <><Video className="h-3 w-3" />Video Call</>
                      ) : (
                        <><Building2 className="h-3 w-3" />In-Person</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDateTime, "EEEE, MMMM d, yyyy")} at{" "}
                    {format(selectedDateTime, "h:mm a")}
                    {selectedReportIds.length > 0 && (
                      <span className="ml-2">
                        &bull; {selectedReportIds.length} report{selectedReportIds.length > 1 ? "s" : ""} shared
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={handleBook}
                disabled={isBooking}
                className="gap-2 min-w-[180px] shadow-md"
              >
                {isBooking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    {appointmentType === "online" ? (
                      <Video className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Confirm Booking
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
