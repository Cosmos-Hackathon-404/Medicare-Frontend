"use client";

import { use, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  VideoCall,
  PreCallCheck,
} from "@/components/shared/video-call";
import { SessionRecorder } from "@/components/doctor/session-recorder";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  User,
  FileText,
  CheckCircle2,
  Mic,
  Play,
  Share2,
  Image as ImageIcon,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DoctorVideoCallPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const { user } = useUser();
  const router = useRouter();
  const doctorClerkId = user?.id ?? "";
  const [isReady, setIsReady] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const appointment = useQuery(api.queries.appointments.getById, {
    appointmentId: appointmentId as Id<"appointments">,
  });

  const videoRoom = useQuery(api.queries.videoRooms.getByAppointment, {
    appointmentId: appointmentId as Id<"appointments">,
  });

  // Get patient info
  const patient = useQuery(
    api.queries.patients.getById,
    appointment?.patientId ? { patientId: appointment.patientId } : "skip"
  );

  // Get shared reports
  const sharedReports = useQuery(
    api.queries.reports.getByIds,
    appointment?.sharedReportIds && appointment.sharedReportIds.length > 0
      ? { reportIds: appointment.sharedReportIds }
      : "skip"
  );

  // Session related
  // Preload session data for post-call use
  useQuery(api.queries.sessions.getByAppointment, {
    appointmentId: appointmentId as Id<"appointments">,
  });

  const generateUploadUrl = useMutation(api.mutations.sessions.generateUploadUrl);
  const createAndProcess = useMutation(api.mutations.sessions.createAndProcess);

  const isLoading = appointment === undefined || videoRoom === undefined;

  const handleCallEnd = (duration: number) => {
    setCallEnded(true);
    setCallDuration(duration);
    toast.success(`Call ended. Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`);
  };

  const handleRecordingComplete = async (blob: Blob) => {
    if (!appointment || !doctorClerkId) return;

    setIsProcessing(true);
    try {
      toast.info("Uploading audio...");
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      const { storageId } = await uploadResponse.json();

      await createAndProcess({
        appointmentId: appointmentId as Id<"appointments">,
        patientClerkId: appointment.patientClerkId,
        doctorClerkId,
        audioStorageId: storageId,
      });

      toast.success("Audio uploaded! AI processing is running in the background.");
    } catch (error) {
      console.error("Failed to process session:", error);
      toast.error("Failed to process session. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} minute${m !== 1 ? "s" : ""} ${s} second${s !== 1 ? "s" : ""}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="aspect-video w-full" />
      </div>
    );
  }

  if (!appointment || appointment.type !== "online") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Video className="mb-4 h-16 w-16 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-semibold">Video Call Not Available</h2>
        <p className="text-muted-foreground">
          This is not an online appointment.
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

  // After call ended — show session recording + summary options (same as offline)
  if (callEnded) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/doctor/appointments"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Appointments
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Post-Call Session
          </h1>
          <p className="text-muted-foreground mt-1">
            Call duration: {formatDuration(callDuration)} with{" "}
            {patient?.name ?? "Patient"}
          </p>
        </div>

        {/* Call Summary Card */}
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 shrink-0">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-green-700 dark:text-green-400">
                Video Call Completed
              </p>
              <p className="text-sm text-muted-foreground">
                {format(dateTime, "MMMM d, yyyy")} &bull;{" "}
                {formatDuration(callDuration)}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Session Recorder - Record notes / dictation about the call */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mic className="h-5 w-5 text-primary" />
                  Record Session Notes
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Record your observations from the video consultation for AI
                  transcription and summary.
                </p>
              </CardHeader>
              <CardContent>
                <SessionRecorder
                  onRecordingComplete={handleRecordingComplete}
                  isUploading={isProcessing}
                />
              </CardContent>
            </Card>

            {/* Patient Info */}
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
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{patient?.name ?? "—"}</span>
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

          {/* Shared Reports & go to full session */}
          <div className="space-y-6">
            {appointment.sharedReportIds &&
              appointment.sharedReportIds.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Share2 className="h-5 w-5 text-primary" />
                      Shared Reports
                      <Badge variant="secondary" className="ml-auto">
                        {appointment.sharedReportIds.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sharedReports === undefined ? (
                      <div className="space-y-2">
                        <Skeleton className="h-14 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sharedReports.map(
                          (report) =>
                            report && (
                              <Link
                                key={report._id}
                                href={`/doctor/patient/${appointment.patientId}?report=${report._id}`}
                                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                  {report.fileType === "pdf" ? (
                                    <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                                  ) : (
                                    <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="truncate text-sm font-medium">
                                    {report.fileName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(
                                      new Date(report._creationTime),
                                      "MMM d, yyyy"
                                    )}
                                  </p>
                                </div>
                                {report.criticalFlags &&
                                  report.criticalFlags.length > 0 && (
                                    <Badge
                                      variant="destructive"
                                      className="gap-1 text-xs"
                                    >
                                      <AlertTriangle className="h-3 w-3" />
                                      {report.criticalFlags.length}
                                    </Badge>
                                  )}
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </Link>
                            )
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            {/* Go to full session page */}
            <Card>
              <CardContent className="p-5">
                <Link href={`/doctor/session/${appointmentId}`}>
                  <Button className="w-full gap-2">
                    <Play className="h-4 w-4" />
                    Go to Full Session Page
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  View transcript, AI summary, drug interactions, and more
                </p>
              </CardContent>
            </Card>

            {/* Appointment Notes */}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/doctor/appointments"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Video Consultation
            </h1>
            <div className="mt-1 flex items-center gap-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {patient?.name ?? "Patient"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(dateTime, "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(dateTime, "h:mm a")}
              </span>
            </div>
          </div>
          <Badge className="gap-1 bg-blue-600">
            <Video className="h-3 w-3" />
            Online
          </Badge>
        </div>
      </div>

      {/* Pre-Call Check or Video Call */}
      {!isReady ? (
        <PreCallCheck
          onReady={() => setIsReady(true)}
          onCancel={() => router.push("/doctor/appointments")}
        />
      ) : (
        <VideoCall
          appointmentId={appointmentId}
          role="doctor"
          peerName={patient?.name ?? "Patient"}
          onCallEnd={handleCallEnd}
        />
      )}

      {/* Sidebar Info (only in pre-call) */}
      {!isReady && (
        <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="font-medium">{patient?.name ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="font-medium">
                  {format(dateTime, "MMM d, yyyy")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shared Reports</p>
                <p className="font-medium">
                  {appointment.sharedReportIds?.length ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
