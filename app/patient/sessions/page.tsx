"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionList } from "@/components/patient/session-summary-card";
import { Stethoscope } from "lucide-react";

export default function PatientSessionsPage() {
  const { user } = useUser();
  const patientClerkId = user?.id ?? "";

  const sessions = useQuery(
    api.queries.sessions.getByPatient,
    patientClerkId ? { patientClerkId } : "skip"
  );
  const appointments = useQuery(
    api.queries.appointments.getByPatient,
    patientClerkId ? { patientClerkId } : "skip"
  );

  const isLoading = !sessions || !appointments;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Session History</h1>
        <p className="text-muted-foreground">
          View all past sessions with AI-generated summaries.
        </p>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Stethoscope className="h-5 w-5 text-primary" />
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
            <Skeleton key={i} className="h-[300px] w-full" />
          ))}
        </div>
      ) : (
        <SessionList sessions={sessions ?? []} appointments={appointments ?? []} />
      )}
    </div>
  );
}
