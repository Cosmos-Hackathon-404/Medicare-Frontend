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
import { Textarea } from "@/components/ui/textarea";
import { SessionRecorder } from "@/components/doctor/session-recorder";
import { EditableAISummaryCard } from "@/components/doctor/editable-ai-summary-card";
import { DrugInteractionChecker } from "@/components/doctor/drug-interaction-checker";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle2,
  Volume2,
  Edit2,
  Save,
  X,
  Image as ImageIcon,
  Share2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface AISummary {
  chiefComplaint?: string;
  diagnosis?: string;
  prescriptions?: Prescription[] | string;
  followUpActions?: string[];
  keyDecisions?: string[];
  comparisonWithPrevious?: string;
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const { user } = useUser();
  const doctorClerkId = user?.id ?? "";

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState("");

  // Queries
  const appointment = useQuery(api.queries.appointments.getById, {
    appointmentId: appointmentId as Id<"appointments">,
  });
  const session = useQuery(api.queries.sessions.getByAppointment, {
    appointmentId: appointmentId as Id<"appointments">,
  });
  
  // Get shared reports for this appointment
  const sharedReports = useQuery(
    api.queries.reports.getByIds,
    appointment?.sharedReportIds && appointment.sharedReportIds.length > 0
      ? { reportIds: appointment.sharedReportIds }
      : "skip"
  );
  
  // Get audio URL if session has audio
  const audioUrl = useQuery(
    api.queries.sessions.getAudioUrl,
    session?.audioStorageId 
      ? { audioStorageId: session.audioStorageId }
      : "skip"
  );

  // Mutations & Actions
  const generateUploadUrl = useMutation(api.mutations.sessions.generateUploadUrl);
  const createSession = useMutation(api.mutations.sessions.create);
  const updateSession = useMutation(api.mutations.sessions.update);
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
        sessionId,
        appointmentId: appointmentId as Id<"appointments">,
        audioStorageId: storageId,
        patientClerkId: appointment.patientClerkId,
        doctorClerkId,
      });

      toast.success("Session processed successfully!");
    } catch (error) {
      console.error("Failed to process session:", error);
      toast.error("Failed to process session. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSummary = async (updatedSummary: AISummary) => {
    if (!session) return;
    
    setIsSaving(true);
    try {
      // Convert prescriptions to JSON string for storage
      const prescriptionsStr = Array.isArray(updatedSummary.prescriptions)
        ? JSON.stringify(updatedSummary.prescriptions)
        : updatedSummary.prescriptions ?? "";

      await updateSession({
        sessionId: session._id,
        aiSummary: JSON.stringify(updatedSummary),
        keyDecisions: updatedSummary.keyDecisions ?? [],
        prescriptions: prescriptionsStr,
      });
      
      toast.success("Summary saved successfully!");
    } catch (error) {
      console.error("Failed to save summary:", error);
      toast.error("Failed to save summary. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditTranscript = () => {
    setEditedTranscript(session?.transcript ?? "");
    setIsEditingTranscript(true);
  };

  const handleCancelEditTranscript = () => {
    setEditedTranscript("");
    setIsEditingTranscript(false);
  };

  const handleSaveTranscript = async () => {
    if (!session) return;
    
    setIsSaving(true);
    try {
      await updateSession({
        sessionId: session._id,
        transcript: editedTranscript,
      });
      
      toast.success("Transcript saved successfully!");
      setIsEditingTranscript(false);
    } catch (error) {
      console.error("Failed to save transcript:", error);
      toast.error("Failed to save transcript. Please try again.");
    } finally {
      setIsSaving(false);
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
        {/* Left Column: Recording / Transcript / Audio */}
        <div className="space-y-6">
          {/* Session Recorder */}
          {!isCompleted && (
            <SessionRecorder
              onRecordingComplete={handleRecordingComplete}
              isUploading={isProcessing}
            />
          )}

          {/* Audio Player */}
          {audioUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Volume2 className="h-5 w-5 text-primary" />
                  Session Recording
                </CardTitle>
              </CardHeader>
              <CardContent>
                <audio
                  controls
                  className="w-full"
                  src={audioUrl}
                >
                  Your browser does not support the audio element.
                </audio>
                <p className="mt-2 text-xs text-muted-foreground">
                  Listen to the original session recording
                </p>
              </CardContent>
            </Card>
          )}

          {/* Transcript */}
          {session?.transcript && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Session Transcript
                  </CardTitle>
                  <div className="flex gap-2">
                    {isEditingTranscript ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEditTranscript}
                          disabled={isSaving}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveTranscript}
                          disabled={isSaving}
                        >
                          <Save className="mr-1 h-4 w-4" />
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStartEditTranscript}
                      >
                        <Edit2 className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditingTranscript ? (
                  <Textarea
                    value={editedTranscript}
                    onChange={(e) => setEditedTranscript(e.target.value)}
                    className="min-h-[300px] resize-none"
                    placeholder="Enter transcript..."
                  />
                ) : (
                  <ScrollArea className="h-[300px] rounded-lg bg-muted/30 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {session.transcript}
                    </p>
                  </ScrollArea>
                )}
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

          {/* Shared Reports */}
          {appointment.sharedReportIds && appointment.sharedReportIds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Share2 className="h-5 w-5 text-primary" />
                  Shared Reports
                  <Badge variant="secondary" className="ml-auto">
                    {appointment.sharedReportIds.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Reports shared by patient for this appointment
                </p>
              </CardHeader>
              <CardContent>
                {sharedReports === undefined ? (
                  <div className="space-y-2">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sharedReports.map((report) => report && (
                      <Link
                        key={report._id}
                        href={`/doctor/patient/${appointment.patientId}?report=${report._id}`}
                        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          {report.fileType === "pdf" ? (
                            <FileText className="h-5 w-5 text-red-500" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-blue-500" />
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
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            {report.criticalFlags.length}
                          </Badge>
                        )}
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Editable AI Summary */}
        <div className="space-y-6">
          <EditableAISummaryCard
            summary={session?.aiSummary}
            isLoading={isProcessing}
            onSave={handleSaveSummary}
            isSaving={isSaving}
          />

          {/* Drug Interaction & Allergy Checker */}
          {session?.prescriptions && (() => {
            try {
              const parsed = JSON.parse(session.prescriptions);
              if (Array.isArray(parsed) && parsed.length > 0) {
                return (
                  <DrugInteractionChecker
                    patientClerkId={appointment.patientClerkId}
                    prescriptions={parsed}
                  />
                );
              }
            } catch { /* invalid prescriptions JSON */ }
            return null;
          })()}

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
