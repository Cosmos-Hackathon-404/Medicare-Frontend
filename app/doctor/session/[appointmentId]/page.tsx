"use client";

import { use, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SessionRecorder } from "@/components/doctor/session-recorder";
import { AISummaryCard } from "@/components/doctor/ai-summary-card";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export default function SessionPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const { user } = useUser();
  const doctorClerkId = user?.id ?? "";

  const [isProcessing, setIsProcessing] = useState(false);

  // Queries
  const appointment = useQuery(api.queries.appointments.getById, {
    appointmentId: appointmentId as Id<"appointments">,
  });
  const session = useQuery(api.queries.sessions.getByAppointment, {
    appointmentId: appointmentId as Id<"appointments">,
  });

  // Mutations & Actions
  const generateUploadUrl = useMutation(api.mutations.sessions.generateUploadUrl);
  const createSession = useMutation(api.mutations.sessions.create);
  const updateAppointmentStatus = useMutation(api.mutations.appointments.updateStatus);
  const summarizeSession = useAction(api.actions.summarizeSession.summarizeSession);

  const isLoading = appointment === undefined;

  const handleRecordingComplete = async (blob: Blob) => {
    if (!appointment || !doctorClerkId) return;

    setIsProcessing(true);
    try {
      // Step 1: Upload audio to Convex storage
      toast.info("Uploading audio...");
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      const { storageId } = await uploadResponse.json();

      // Step 2: Create session record
      toast.info("Processing with AI...");
      const sessionId = await createSession({
        appointmentId: appointmentId as Id<"appointments">,
        patientClerkId: appointment.patientClerkId,
        doctorClerkId,
        audioStorageId: storageId,
      });

      // Step 3: Run AI summarization
      await summarizeSession({
        appointmentId: appointmentId as Id<"appointments">,
        audioStorageId: storageId,
        patientClerkId: appointment.patientClerkId,
        doctorClerkId,
      });

      // Step 4: Mark appointment as completed
      await updateAppointmentStatus({
        appointmentId: appointmentId as Id<"appointments">,
        status: "completed",
      });

      toast.success("Session processed successfully!");
    } catch (error) {
      console.error("Failed to process session:", error);
      toast.error("Failed to process session. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Calendar className="mb-4 h-16 w-16 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-semibold">Appointment not found</h2>
        <p className="text-muted-foreground">
          This appointment may have been cancelled or doesn&apos;t exist.
        </p>
        <Link href="/doctor/appointments" className="mt-4">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Appointments
          </Button>
        </Link>
      </div>
    );
  }

  const dateTime = parseISO(appointment.dateTime);
  const isCompleted = appointment.status === "completed";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/doctor/appointments"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Appointments
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Session</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(dateTime, "MMMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(dateTime, "h:mm a")}
            </span>
          </div>
        </div>
        <Badge
          variant={isCompleted ? "default" : "secondary"}
          className="gap-1 text-sm"
        >
          {isCompleted && <CheckCircle2 className="h-3.5  w-3.5" />}
          {appointment.status}
        </Badge>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Recording / Transcript */}
        <div className="space-y-6">
          {/* Session Recorder */}
          {!isCompleted && (
            <SessionRecorder
              onRecordingComplete={handleRecordingComplete}
              isUploading={isProcessing}
            />
          )}

          {/* Transcript */}
          {session?.transcript && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Session Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] rounded-lg bg-muted/30 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {session.transcript}
                  </p>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Patient Quick View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient ID:</span>
                  <span className="font-mono text-sm">
                    {appointment.patientClerkId.slice(0, 12)}...
                  </span>
                </div>
                <Separator />
                <Link href={`/doctor/patient/${appointment.patientId}`}>
                  <Button variant="outline" className="w-full gap-2">
                    <User className="h-4 w-4" />
                    View Full Patient Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Summary */}
        <div className="space-y-6">
          <AISummaryCard
            summary={session?.aiSummary}
            isLoading={isProcessing}
          />

          {/* Key Decisions */}
          {session?.keyDecisions && session.keyDecisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Decisions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {session.keyDecisions.map((decision, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-lg bg-muted/30 p-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm">{decision}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Prescriptions */}
          {session?.prescriptions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prescriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted/30 p-4">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {session.prescriptions}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Notes */}
          {appointment.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Appointment Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {appointment.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
