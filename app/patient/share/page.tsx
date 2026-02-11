"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Mic,
  FileText,
  User,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Session, Report, DoctorProfile } from "@/types";

export default function ShareContextPage() {
  const { user } = useUser();
  const patientClerkId = user?.id ?? "";

  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [isSharing, setIsSharing] = useState(false);

  // Queries
  const sessions = useQuery(
    api.queries.sessions.getByPatient,
    patientClerkId ? { patientClerkId } : "skip"
  );
  const reports = useQuery(
    api.queries.reports.getByPatient,
    patientClerkId ? { patientClerkId } : "skip"
  );
  const doctors = useQuery(api.queries.doctors.getAll);

  // Actions
  const generateSharedContext = useAction(
    api.actions.generateSharedContext.generateSharedContext
  );

  const isLoading = !sessions || !reports || !doctors;

  // Get the doctor that the patient has seen (from sessions)
  const seenDoctorIds = new Set(sessions?.map((s) => s.doctorClerkId) ?? []);
  const seenDoctors = doctors?.filter((d) => seenDoctorIds.has(d.clerkUserId)) ?? [];

  // Get doctors that haven't seen the patient
  const otherDoctors = doctors?.filter((d) => !seenDoctorIds.has(d.clerkUserId)) ?? [];

  const handleToggleSession = (sessionId: string) => {
    setSelectedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const handleToggleReport = (reportId: string) => {
    setSelectedReports((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const handleShare = async () => {
    if (!selectedDoctor || !patientClerkId) {
      toast.error("Please select a doctor");
      return;
    }
    if (selectedSessions.size === 0 && selectedReports.size === 0) {
      toast.error("Please select at least one session or report");
      return;
    }

    // Get the fromDoctor (first seen doctor with selected sessions)
    const firstSelectedSession = sessions?.find((s) =>
      selectedSessions.has(s._id)
    );
    const fromDoctorClerkId = firstSelectedSession?.doctorClerkId ?? 
      sessions?.[0]?.doctorClerkId ?? "";

    if (!fromDoctorClerkId) {
      toast.error("Could not determine source doctor");
      return;
    }

    setIsSharing(true);
    try {
      // Generate AI consolidated summary and create shared context
      toast.info("Generating AI summary and sharing context...");
      const result = await generateSharedContext({
        patientClerkId,
        fromDoctorClerkId,
        toDoctorClerkId: selectedDoctor,
        sessionIds: Array.from(selectedSessions) as Id<"sessions">[],
        reportIds: Array.from(selectedReports) as Id<"reports">[],
      });

      console.log("Shared context created:", result.sharedContextId);
      toast.success("Context shared successfully!");
      setSelectedSessions(new Set());
      setSelectedReports(new Set());
      setSelectedDoctor("");
    } catch (error) {
      console.error("Failed to share context:", error);
      toast.error("Failed to share context. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const totalSelected = selectedSessions.size + selectedReports.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Share Medical Context
        </h1>
        <p className="text-muted-foreground">
          Select sessions and reports to share with a new doctor.
        </p>
      </div>

      {/* Doctor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Select Doctor to Share With
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : otherDoctors.length > 0 ? (
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a doctor..." />
              </SelectTrigger>
              <SelectContent>
                {otherDoctors.map((doctor) => (
                  <SelectItem key={doctor._id} value={doctor.clerkUserId}>
                    Dr. {doctor.name} - {doctor.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
              <AlertTriangle className="mx-auto mb-2 h-8 w-8 opacity-40" />
              No other doctors available to share with.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessions Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                Sessions
              </span>
              <Badge variant="secondary">
                {selectedSessions.size} selected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : sessions && sessions.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <SessionSelectItem
                      key={session._id}
                      session={session}
                      isSelected={selectedSessions.has(session._id)}
                      onToggle={() => handleToggleSession(session._id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Mic className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>No sessions available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reports Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Reports
              </span>
              <Badge variant="secondary">
                {selectedReports.size} selected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : reports && reports.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {reports.map((report) => (
                    <ReportSelectItem
                      key={report._id}
                      report={report as Report}
                      isSelected={selectedReports.has(report._id)}
                      onToggle={() => handleToggleReport(report._id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>No reports available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Share Button */}
      {totalSelected > 0 && selectedDoctor && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Ready to share</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSessions.size} session(s), {selectedReports.size}{" "}
                  report(s) selected
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleShare}
              disabled={isSharing}
              className="gap-2"
            >
              {isSharing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Share Context
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SessionSelectItem({
  session,
  isSelected,
  onToggle,
}: {
  session: Session;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      }`}
      onClick={onToggle}
    >
      <Checkbox checked={isSelected} />
      <div className="flex-1 min-w-0">
        <p className="font-medium">Session Recording</p>
        <p className="text-sm text-muted-foreground">
          {format(new Date(session._creationTime), "MMM d, yyyy")}
        </p>
      </div>
      {session.aiSummary && (
        <Badge variant="secondary" className="shrink-0">
          AI Summary
        </Badge>
      )}
    </div>
  );
}

function ReportSelectItem({
  report,
  isSelected,
  onToggle,
}: {
  report: Report;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      }`}
      onClick={onToggle}
    >
      <Checkbox checked={isSelected} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{report.fileName}</p>
        <p className="text-sm text-muted-foreground">
          {format(new Date(report._creationTime), "MMM d, yyyy")}
        </p>
      </div>
      <Badge variant="outline" className="shrink-0">
        {report.fileType}
      </Badge>
    </div>
  );
}
