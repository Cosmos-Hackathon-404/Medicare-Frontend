"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientTimeline } from "@/components/doctor/patient-timeline";
import { CriticalFlagsList } from "@/components/doctor/critical-flag-badge";
import { ReportViewerDialog } from "@/components/shared/report-viewer-dialog";
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  Droplets,
  AlertTriangle,
  Phone,
  Mail,
  MessageSquare,
  Share2,
  Image as ImageIcon,
  Eye,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { CriticalFlag, Report } from "@/types";

// ── Inline Report Thumbnail ──
function ReportThumbnail({ report, onClick }: { report: Report; onClick: () => void }) {
  const fileUrl = useQuery(api.queries.reports.getFileUrl, {
    fileStorageId: report.fileStorageId as Id<"_storage">,
  });
  const isImage = report.fileType !== "pdf";

  const statusConfig = {
    pending: { icon: Clock, label: "Pending", color: "text-amber-500" },
    analyzing: { icon: Loader2, label: "Analyzing", color: "text-blue-500" },
    completed: { icon: CheckCircle2, label: "Analyzed", color: "text-green-500" },
    failed: { icon: AlertCircle, label: "Failed", color: "text-destructive" },
  };
  const status = (report.analysisStatus ?? (report.aiSummary ? "completed" : "pending")) as keyof typeof statusConfig;
  const StatusIcon = statusConfig[status]?.icon ?? Clock;

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-lg border bg-card text-left transition-all hover:shadow-md hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Preview area */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-muted/50">
        {fileUrl === undefined ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : fileUrl && isImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={fileUrl}
            alt={report.fileName}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : fileUrl && !isImage ? (
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="h-full w-full pointer-events-none"
            title={report.fileName}
            tabIndex={-1}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <FileText className="h-10 w-10 opacity-40" />
            <span className="text-xs">Preview unavailable</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
          <Eye className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        {/* File type badge */}
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 gap-1"
        >
          {isImage ? <ImageIcon className="h-2.5 w-2.5" /> : <FileText className="h-2.5 w-2.5" />}
          {report.fileType}
        </Badge>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium line-clamp-1">{report.fileName}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {format(new Date(report._creationTime), "MMM d, yyyy")}
          </span>
          <Badge
            variant="outline"
            className={cn("text-[10px] gap-1 px-1.5 py-0", statusConfig[status]?.color)}
          >
            <StatusIcon className={cn("h-2.5 w-2.5", status === "analyzing" && "animate-spin")} />
            {statusConfig[status]?.label}
          </Badge>
        </div>
        {report.criticalFlags && report.criticalFlags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {report.criticalFlags.slice(0, 2).map((flag, i) => (
              <Badge key={i} variant="destructive" className="text-[10px] px-1.5 py-0">
                {flag.flag}
              </Badge>
            ))}
            {report.criticalFlags.length > 2 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{report.criticalFlags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Queries
  const patient = useQuery(api.queries.patients.getById, {
    patientId: patientId as Id<"patientProfiles">,
  });
  const sessions = useQuery(
    api.queries.sessions.getByPatient,
    patient ? { patientClerkId: patient.clerkUserId } : "skip"
  );
  const appointments = useQuery(
    api.queries.appointments.getByPatient,
    patient ? { patientClerkId: patient.clerkUserId } : "skip"
  );
  const reports = useQuery(
    api.queries.reports.getByPatient,
    patient ? { patientClerkId: patient.clerkUserId } : "skip"
  );

  const isLoading = patient === undefined;

  // Collect all critical flags from reports
  const allFlags: CriticalFlag[] =
    reports?.flatMap((r) => r.criticalFlags ?? []) ?? [];

  // Open report from URL search param  
  // (for deep linking from other pages)
  const openReport = (report: Report) => {
    setSelectedReport(report);
    setReportDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px] lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <User className="mb-4 h-16 w-16 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-semibold">Patient not found</h2>
        <p className="text-muted-foreground">
          This patient profile doesn&apos;t exist.
        </p>
        <Link href="/doctor/appointments" className="mt-4">
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <ArrowLeft className="h-4 w-4" />
            Back to Appointments
          </button>
        </Link>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
          <p className="text-muted-foreground">Patient Profile</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/doctor/chat?patient=${patient.clerkUserId}`}>
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Send Message
            </Button>
          </Link>
          <Link href="/doctor/shared-context">
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Shared Context
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Patient Info */}
        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Age</span>
                <span className="font-medium">{patient.age} years</span>
              </div>
              {patient.bloodGroup && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Droplets className="h-4 w-4" />
                    Blood Group
                  </span>
                  <Badge variant="outline">{patient.bloodGroup}</Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </span>
                <span className="text-sm">{patient.email}</span>
              </div>
              {patient.emergencyContact && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    Emergency
                  </span>
                  <span className="text-sm">{patient.emergencyContact}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Allergies Card */}
          {patient.allergies && (
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Allergies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{patient.allergies}</p>
              </CardContent>
            </Card>
          )}

          {/* Critical Flags */}
          {allFlags.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Flags ({allFlags.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CriticalFlagsList flags={allFlags} expanded />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Tabs for Sessions/Reports/Timeline */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timeline" className="gap-1">
                <Calendar className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="sessions" className="gap-1">
                <User className="h-4 w-4" />
                Sessions ({sessions?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-1">
                <FileText className="h-4 w-4" />
                Reports ({reports?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <PatientTimeline
                appointments={appointments ?? []}
                sessions={sessions ?? []}
                reports={reports ?? []}
              />
            </TabsContent>

            <TabsContent value="sessions" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {sessions && sessions.length > 0 ? (
                    <div className="space-y-4">
                      {sessions.map((session) => {
                        // Parse AI summary for richer display
                        let diagnosis: string | null = null;
                        let prescriptions: string | null = null;
                        if (session.aiSummary) {
                          try {
                            const parsed = JSON.parse(session.aiSummary);
                            diagnosis = parsed.diagnosis ?? parsed.chief_complaint ?? null;
                            const rx = parsed.prescriptions;
                            if (typeof rx === "string") prescriptions = rx;
                            else if (Array.isArray(rx)) {
                              prescriptions = rx.map((p: { medication?: string; name?: string }) => p.medication || p.name).join(", ");
                            }
                          } catch {
                            diagnosis = session.aiSummary.slice(0, 120);
                          }
                        }

                        return (
                          <div
                            key={session._id}
                            className="rounded-lg border p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">Session Recording</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(session._creationTime), "MMM d, yyyy · h:mm a")}
                                </p>
                              </div>
                              <Badge
                                variant={session.aiSummary ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {session.processingStatus === "processing"
                                  ? "Processing..."
                                  : session.aiSummary
                                    ? "AI Summary"
                                    : "No Summary"}
                              </Badge>
                            </div>
                            {diagnosis && (
                              <div className="rounded-md bg-muted/50 p-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Diagnosis</p>
                                <p className="text-sm">{diagnosis}</p>
                              </div>
                            )}
                            {prescriptions && (
                              <div className="rounded-md bg-orange-500/5 border border-orange-500/20 p-3">
                                <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">Prescriptions</p>
                                <p className="text-sm">{prescriptions}</p>
                              </div>
                            )}
                            {session.transcript && !diagnosis && (
                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                {session.transcript}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <User className="mx-auto mb-3 h-10 w-10 opacity-40" />
                      <p>No session recordings yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Reports Tab with thumbnails ── */}
            <TabsContent value="reports" className="mt-4">
              {reports && reports.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...reports]
                    .sort((a, b) => b._creationTime - a._creationTime)
                    .map((report) => (
                      <ReportThumbnail
                        key={report._id}
                        report={report as Report}
                        onClick={() => openReport(report as Report)}
                      />
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
                    <p>No reports uploaded yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Report Viewer Dialog */}
      <ReportViewerDialog
        report={selectedReport}
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
      />
    </div>
  );
}
