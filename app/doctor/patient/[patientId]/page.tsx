"use client";

import { use } from "react";
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
} from "lucide-react";
import Link from "next/link";
import type { CriticalFlag } from "@/types";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);

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
                      {sessions.map((session) => (
                        <div
                          key={session._id}
                          className="rounded-lg border p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">Session Recording</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(
                                  session._creationTime
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            {session.aiSummary && (
                              <Badge>AI Summary Available</Badge>
                            )}
                          </div>
                          {session.transcript && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {session.transcript}
                            </p>
                          )}
                        </div>
                      ))}
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

            <TabsContent value="reports" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {reports && reports.length > 0 ? (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div
                          key={report._id}
                          className="rounded-lg border p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{report.fileName}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(
                                  report._creationTime
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline">{report.fileType}</Badge>
                          </div>
                          {report.criticalFlags &&
                            report.criticalFlags.length > 0 && (
                              <div className="mt-3">
                                <CriticalFlagsList
                                  flags={report.criticalFlags}
                                />
                              </div>
                            )}
                          {report.aiSummary && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {report.aiSummary}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
                      <p>No reports uploaded yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
