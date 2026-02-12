"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Stethoscope,
  Pill,
  Calendar,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Session, Appointment } from "@/types";

interface SessionSummaryCardProps {
  session: Session & { doctorName?: string; doctorSpecialization?: string };
  appointment?: Appointment;
  className?: string;
}

export function SessionSummaryCard({
  session,
  appointment,
  className,
}: SessionSummaryCardProps) {
  // Parse AI summary if it's a JSON string, normalizing snake_case to camelCase
  let parsedSummary: {
    chiefComplaint?: string;
    diagnosis?: string;
    prescriptions?: string;
    followUpActions?: string[];
    keyDecisions?: string[];
  } | null = null;

  if (session.aiSummary) {
    try {
      const raw = JSON.parse(session.aiSummary);
      parsedSummary = {
        chiefComplaint: raw.chiefComplaint ?? raw.chief_complaint,
        diagnosis: raw.diagnosis,
        prescriptions: raw.prescriptions,
        followUpActions: raw.followUpActions ?? raw.follow_up_actions,
        keyDecisions: raw.keyDecisions ?? raw.key_decisions,
      };
    } catch {
      parsedSummary = { chiefComplaint: session.aiSummary };
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-primary" />
              {session.doctorName ? `Dr. ${session.doctorName}` : "Session Summary"}
            </CardTitle>
            {session.doctorSpecialization && (
              <p className="mt-1 text-sm text-muted-foreground ml-7">
                {session.doctorSpecialization}
              </p>
            )}
          </div>
          {appointment && (
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(appointment.dateTime), "MMM d, yyyy")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-6 p-6">
            {/* Diagnosis */}
            {parsedSummary?.diagnosis && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4 text-primary" />
                  Diagnosis
                </h4>
                <p className="rounded-lg bg-muted/50 p-3 text-sm">
                  {parsedSummary.diagnosis}
                </p>
              </div>
            )}

            {/* Chief Complaint */}
            {parsedSummary?.chiefComplaint && !parsedSummary?.diagnosis && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4 text-primary" />
                  Summary
                </h4>
                <p className="rounded-lg bg-muted/50 p-3 text-sm">
                  {parsedSummary.chiefComplaint}
                </p>
              </div>
            )}

            {/* Prescriptions */}
            {(parsedSummary?.prescriptions || session.prescriptions) && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-medium">
                    <Pill className="h-4 w-4 text-orange-500" />
                    Prescriptions
                  </h4>
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {parsedSummary?.prescriptions || session.prescriptions}
                    </pre>
                  </div>
                </div>
              </>
            )}

            {/* Key Decisions */}
            {(parsedSummary?.keyDecisions?.length ||
              session.keyDecisions?.length) && (
              <>
                <Separator />
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Key Decisions
                  </h4>
                  <ul className="space-y-2">
                    {(
                      parsedSummary?.keyDecisions || session.keyDecisions || []
                    ).map((decision, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-lg bg-green-500/5 p-2 text-sm"
                      >
                        <Badge
                          variant="outline"
                          className="mt-0.5 h-5 w-5 shrink-0 rounded-full p-0 text-center text-xs"
                        >
                          {i + 1}
                        </Badge>
                        <span>{decision}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Follow-up Actions */}
            {parsedSummary?.followUpActions &&
              parsedSummary.followUpActions.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="mb-2 font-medium">Follow-up Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      {parsedSummary.followUpActions.map((action, i) => (
                        <Badge key={i} variant="secondary">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

            {/* No Summary Available */}
            {!session.aiSummary && !session.prescriptions && (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>No summary available yet.</p>
                <p className="text-sm">
                  The doctor will provide a summary after your session.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface SessionListProps {
  sessions: (Session & { doctorName?: string; doctorSpecialization?: string })[];
  appointments?: Appointment[];
  className?: string;
}

export function SessionList({
  sessions,
  appointments = [],
  className,
}: SessionListProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Stethoscope className="mx-auto mb-3 h-12 w-12 opacity-40" />
        <p className="font-medium">No sessions yet</p>
        <p className="text-sm">
          Your consultation sessions will appear here after your appointments.
        </p>
      </div>
    );
  }

  // Sort by creation time descending
  const sortedSessions = [...sessions].sort(
    (a, b) => b._creationTime - a._creationTime
  );

  return (
    <div className={cn("space-y-4", className)}>
      {sortedSessions.map((session) => {
        const appointment = appointments.find(
          (apt) => apt._id === session.appointmentId
        );
        return (
          <SessionSummaryCard
            key={session._id}
            session={session}
            appointment={appointment}
          />
        );
      })}
    </div>
  );
}
