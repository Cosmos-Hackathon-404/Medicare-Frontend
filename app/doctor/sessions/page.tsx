"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, FileText, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function DoctorSessionsPage() {
  const { user } = useUser();
  const doctorClerkId = user?.id ?? "";

  const sessions = useQuery(
    api.queries.sessions.getByDoctor,
    doctorClerkId ? { doctorClerkId } : "skip"
  );

  const isLoading = !sessions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
        <p className="text-muted-foreground">
          View all past consultation sessions and AI-generated summaries.
        </p>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Sessions</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-6 w-8" />
            ) : (
              <p className="text-xl font-bold">{sessions?.length ?? 0}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <Mic className="mx-auto mb-3 h-12 w-12 opacity-40" />
          <p className="font-medium">No sessions yet</p>
          <p className="text-sm">
            Sessions will appear here after recording a consultation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...sessions]
            .sort((a, b) => b._creationTime - a._creationTime)
            .map((session) => (
              <Card key={session._id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {session.patientName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(session._creationTime), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.aiSummary ? (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Summary Ready
                        </Badge>
                      ) : session.transcript ? (
                        <Badge variant="outline" className="gap-1">
                          Transcribed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          No Recording
                        </Badge>
                      )}
                    </div>
                  </div>

                  {session.aiSummary && (
                    <div className="mt-3 rounded-lg bg-muted/50 p-3">
                      <p className="text-sm line-clamp-2">
                        {(() => {
                          try {
                            const parsed = JSON.parse(session.aiSummary);
                            return parsed.diagnosis || parsed.chiefComplaint || parsed.chief_complaint || session.aiSummary;
                          } catch {
                            return session.aiSummary;
                          }
                        })()}
                      </p>
                    </div>
                  )}

                  <div className="mt-3">
                    <Link
                      href={`/doctor/session/${session.appointmentId}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Full Session →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
