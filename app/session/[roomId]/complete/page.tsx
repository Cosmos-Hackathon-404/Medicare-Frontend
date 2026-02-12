"use client";

import { use } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ShieldAlert,
  Stethoscope,
  Pill,
  AlertTriangle,
  ArrowLeft,
  Lock,
  CalendarCheck,
  ClipboardList,
  Volume2,
  Brain,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";


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

export default function SessionCompletePage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const { user, isLoaded: isUserLoaded } = useUser();
  const clerkUserId = user?.id ?? "";

  // Fetch session data for this room
  const sessionData = useQuery(
    api.queries.videoRooms.getSessionForRoom,
    roomId ? { roomId } : "skip"
  );

  // Determine user role for security
  const userRole =
    sessionData?.room?.doctorClerkId === clerkUserId
      ? "doctor"
      : sessionData?.room?.patientClerkId === clerkUserId
        ? "patient"
        : null;

  // Get audio URL if available
  const audioUrl = useQuery(
    api.queries.sessions.getAudioUrl,
    sessionData?.audioStorageId
      ? { audioStorageId: sessionData.audioStorageId }
      : "skip"
  );

  // Parse AI summary
  let parsedSummary: AISummary | null = null;
  if (sessionData?.aiSummary) {
    try {
      parsedSummary = JSON.parse(sessionData.aiSummary);
    } catch {
      parsedSummary = null;
    }
  }

  // Parse prescriptions
  let prescriptions: Prescription[] = [];
  if (parsedSummary?.prescriptions) {
    if (Array.isArray(parsedSummary.prescriptions)) {
      prescriptions = parsedSummary.prescriptions;
    }
  } else if (sessionData?.prescriptions) {
    try {
      const parsed = JSON.parse(sessionData.prescriptions);
      if (Array.isArray(parsed)) prescriptions = parsed;
    } catch {
      /* ignore */
    }
  }

  const isProcessing =
    sessionData?.processingStatus === "processing" || !sessionData?.aiSummary;
  const isFailed = sessionData?.processingStatus === "failed";
  const isComplete = sessionData?.processingStatus === "completed";

  // ===== Not signed in =====
  if (isUserLoaded && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Sign in to view your session summary.
            </p>
            <SignInButton mode="modal">
              <Button className="w-full gap-2">
                <Lock className="h-4 w-4" />
                Sign In
              </Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== Loading =====
  if (!isUserLoaded || sessionData === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading session summary...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== No session found or unauthorized =====
  if (!sessionData || !userRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              You don&apos;t have access to this session summary, or the session
              hasn&apos;t been created yet.
            </p>
            <Link href="/">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboardLink =
    userRole === "doctor" ? "/doctor/dashboard" : "/patient/dashboard";
  const sessionsLink =
    userRole === "doctor" ? "/doctor/sessions" : "/patient/sessions";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={dashboardLink}
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Session Summary
              </h1>
              <p className="text-muted-foreground mt-1">
                {userRole === "doctor" ? (
                  <>
                    Session with patient{" "}
                    <span className="font-medium text-foreground">
                      {sessionData.patientName}
                    </span>
                  </>
                ) : (
                  <>
                    Session with{" "}
                    <span className="font-medium text-foreground">
                      Dr. {sessionData.doctorName}
                    </span>
                    {sessionData.doctorSpecialization && (
                      <span className="text-xs ml-1">
                        ({sessionData.doctorSpecialization})
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {sessionData.room?.duration && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.floor(sessionData.room.duration / 60)}m{" "}
                  {sessionData.room.duration % 60}s
                </Badge>
              )}
              <Badge
                variant={isComplete ? "default" : isFailed ? "destructive" : "secondary"}
                className="gap-1"
              >
                {isComplete ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : isFailed ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {isComplete
                  ? "Complete"
                  : isFailed
                    ? "Failed"
                    : "Processing"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Processing State */}
        {isProcessing && !isFailed && (
          <Card className="mb-6 border-l-4 border-l-primary bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Brain className="h-10 w-10 text-primary" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    AI is analyzing your session...
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Transcribing audio and generating a comprehensive summary.
                    This usually takes 1-2 minutes.
                  </p>
                </div>
                <div className="flex gap-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                  <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Failed State */}
        {isFailed && (
          <Card className="mb-6 border-l-4 border-l-destructive bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <h3 className="font-semibold">Processing Failed</h3>
                  <p className="text-sm text-muted-foreground">
                    {sessionData.errorMessage ??
                      "An error occurred while processing the session. The recording is saved and can be processed again."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Chief Complaint & Diagnosis */}
            {parsedSummary ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Diagnosis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {parsedSummary.chiefComplaint && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Chief Complaint
                      </p>
                      <p className="text-sm">{parsedSummary.chiefComplaint}</p>
                    </div>
                  )}
                  {parsedSummary.diagnosis && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Diagnosis
                      </p>
                      <p className="text-sm">{parsedSummary.diagnosis}</p>
                    </div>
                  )}
                  {parsedSummary.comparisonWithPrevious && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Comparison with Previous Sessions
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {parsedSummary.comparisonWithPrevious}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : isProcessing ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ) : null}

            {/* Prescriptions */}
            {prescriptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Pill className="h-5 w-5 text-primary" />
                    Prescriptions
                    <Badge variant="secondary" className="ml-auto">
                      {prescriptions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prescriptions.map((rx, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border bg-muted/30 p-3 space-y-1"
                      >
                        <p className="font-medium text-sm">
                          {rx.medication}
                          {rx.dosage && (
                            <span className="text-muted-foreground ml-2">
                              {rx.dosage}
                            </span>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {rx.frequency && (
                            <Badge variant="outline" className="text-xs">
                              {rx.frequency}
                            </Badge>
                          )}
                          {rx.duration && (
                            <Badge variant="outline" className="text-xs">
                              {rx.duration}
                            </Badge>
                          )}
                        </div>
                        {rx.instructions && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {rx.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio Recording */}
            {audioUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Volume2 className="h-5 w-5 text-primary" />
                    Session Recording
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <audio controls className="w-full" src={audioUrl}>
                    Your browser does not support audio.
                  </audio>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Listen to the original session recording
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Key Decisions */}
            {parsedSummary?.keyDecisions &&
              parsedSummary.keyDecisions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      Key Decisions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {parsedSummary.keyDecisions.map((decision, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                          <span className="text-sm">{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

            {/* Follow-up Actions */}
            {parsedSummary?.followUpActions &&
              parsedSummary.followUpActions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CalendarCheck className="h-5 w-5 text-primary" />
                      Follow-up Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {parsedSummary.followUpActions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

            {/* Transcript */}
            {sessionData.transcript && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Session Transcript
                  </CardTitle>
                  <CardDescription>
                    AI-generated transcription of the session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] rounded-lg bg-muted/30 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {sessionData.transcript}
                    </p>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Processing placeholder for transcript */}
            {isProcessing && !sessionData.transcript && (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <Separator className="my-8" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href={dashboardLink}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href={sessionsLink}>
            <Button className="gap-2">
              View All Sessions
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
