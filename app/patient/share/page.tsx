"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
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
import type { Session, Report } from "@/types";

export default function ShareContextPage() {
  const { user } = useUser();
  const patientClerkId = user?.id ?? "";

  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [isSharing, setIsSharing] = useState(false);
  const [initialized, setInitialized] = useState(false);

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

  // Mutations
  const createAndGenerate = useMutation(
    api.mutations.sharedContexts.createAndGenerate
  );

  const isLoading = !sessions || !reports || !doctors;

  // Pre-select ALL sessions and reports by default (opt-out model)
  useEffect(() => {
    if (!initialized && sessions && reports) {
      setSelectedSessions(new Set(sessions.map((s) => s._id)));
      setSelectedReports(new Set(reports.map((r) => r._id)));
      setInitialized(true);
    }
  }, [sessions, reports, initialized]);

  // Get the doctor that the patient has seen (from sessions)
  const seenDoctorIds = new Set(sessions?.map((s) => s.doctorClerkId) ?? []);

  // Doctors that haven't seen the patient yet are the primary targets
  const otherDoctors = doctors?.filter((d) => !seenDoctorIds.has(d.clerkUserId)) ?? [];
  // Seen doctors still available as option
  const seenDoctors = doctors?.filter((d) => seenDoctorIds.has(d.clerkUserId)) ?? [];

  const handleToggleSession = (sessionId: string) => {
    setSelectedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const handleToggleReport = (reportId: string) => {
    setSelectedReports((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) next.delete(reportId);
      else next.add(reportId);
      return next;
    });
  };

  const toggleAllSessions = () => {
    if (sessions) {
      if (selectedSessions.size === sessions.length) {
        setSelectedSessions(new Set());
      } else {
        setSelectedSessions(new Set(sessions.map((s) => s._id)));
      }
    }
  };

  const toggleAllReports = () => {
    if (reports) {
      if (selectedReports.size === reports.length) {
        setSelectedReports(new Set());
      } else {
        setSelectedReports(new Set(reports.map((r) => r._id)));
      }
    }
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

    const firstSelectedSession = sessions?.find((s) =>
      selectedSessions.has(s._id)
    );
    const fromDoctorClerkId =
      firstSelectedSession?.doctorClerkId ??
      sessions?.[0]?.doctorClerkId ?? "";

    if (!fromDoctorClerkId) {
      toast.error("Could not determine source doctor");
      return;
    }

    setIsSharing(true);
    try {
      toast.info("Sharing context — AI summary is being generated in the background...");
      await createAndGenerate({
        patientClerkId,
        fromDoctorClerkId,
        toDoctorClerkId: selectedDoctor,
        sessionIds: Array.from(selectedSessions) as Id<"sessions">[],
        reportIds: Array.from(selectedReports) as Id<"reports">[],
      });

      toast.success("Context shared! AI summary will be ready shortly.");
      setSelectedSessions(new Set());
      setSelectedReports(new Set());
      setSelectedDoctor("");
      setInitialized(false);
    } catch (error) {
      console.error("Failed to share context:", error);
      toast.error("Failed to share context. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const totalSelected = selectedSessions.size + selectedReports.size;
  const allSessionsSelected = sessions ? selectedSessions.size === sessions.length : false;
  const allReportsSelected = reports ? selectedReports.size === reports.length : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Share Medical Context
        </h1>
        <p className="text-muted-foreground">
          Share your complete medical history with a new doctor — all records are
          pre-selected. Deselect any you want to exclude.
        </p>
      </div>

      {/* Step 1: Doctor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Step 1: Select Doctor to Share With
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : otherDoctors.length > 0 || seenDoctors.length > 0 ? (
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a doctor..." />
              </SelectTrigger>
              <SelectContent>
                {otherDoctors.length > 0 && (
                  <>
                    <SelectItem value="__label_new" disabled>
                      — New Doctors —
                    </SelectItem>
                    {otherDoctors.map((doctor) => (
                      <SelectItem key={doctor._id} value={doctor.clerkUserId}>
                        Dr. {doctor.name} — {doctor.specialization}
                      </SelectItem>
                    ))}
                  </>
                )}
                {seenDoctors.length > 0 && (
                  <>
                    <SelectItem value="__label_seen" disabled>
                      — Previous Doctors —
                    </SelectItem>
                    {seenDoctors.map((doctor) => (
                      <SelectItem key={doctor._id} value={doctor.clerkUserId}>
                        Dr. {doctor.name} — {doctor.specialization}
                      </SelectItem>
                    ))}
                  </>
                )}
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

      {/* Step 2: Review records (pre-selected) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                Sessions
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedSessions.size}/{sessions?.length ?? 0}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllSessions}
                  className="text-xs"
                >
                  {allSessionsSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>
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
                      doctorName={(session as typeof session & { doctorName?: string }).doctorName}
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

        {/* Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Reports
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedReports.size}/{reports?.length ?? 0}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllReports}
                  className="text-xs"
                >
                  {allReportsSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>
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
      {selectedDoctor && (
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
                  report(s) will be shared
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleShare}
              disabled={isSharing || totalSelected === 0}
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
  doctorName,
  isSelected,
  onToggle,
}: {
  session: Session;
  doctorName?: string;
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
        <p className="font-medium">
          {doctorName ? `Dr. ${doctorName}` : "Session Recording"}
        </p>
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
