"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  FileText,
  Stethoscope,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO, isAfter } from "date-fns";
import type { Appointment } from "@/types";

export default function PatientDashboardPage() {
  const { user } = useUser();
  const patientClerkId = user?.id ?? "";

  const appointments = useQuery(
    api.queries.appointments.getByPatient,
    patientClerkId ? { patientClerkId } : "skip"
  );
  const sessions = useQuery(
    api.queries.sessions.getByPatient,
    patientClerkId ? { patientClerkId } : "skip"
  );
  const reports = useQuery(
    api.queries.reports.getByPatient,
    patientClerkId ? { patientClerkId } : "skip"
  );

  const isLoading = !appointments || !sessions || !reports;

  // Calculate stats
  const upcomingAppointments =
    appointments?.filter(
      (apt) =>
        apt.status === "scheduled" && isAfter(parseISO(apt.dateTime), new Date())
    ) ?? [];
  const completedSessions = sessions?.length ?? 0;
  const totalReports = reports?.length ?? 0;

  // Get critical flags count
  const criticalFlagsCount =
    reports?.reduce(
      (acc, r) =>
        acc + (r.criticalFlags?.filter((f) => f.severity === "high").length ?? 0),
      0
    ) ?? 0;

  // Next appointment
  const nextAppointment = upcomingAppointments.sort((a, b) =>
    parseISO(a.dateTime).getTime() - parseISO(b.dateTime).getTime()
  )[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName ?? "Patient"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={Calendar}
          title="Upcoming"
          value={isLoading ? undefined : upcomingAppointments.length}
          description="Appointments"
        />
        <StatsCard
          icon={Stethoscope}
          title="Sessions"
          value={isLoading ? undefined : completedSessions}
          description="Completed"
        />
        <StatsCard
          icon={FileText}
          title="Reports"
          value={isLoading ? undefined : totalReports}
          description="Uploaded"
        />
        <StatsCard
          icon={AlertTriangle}
          title="Alerts"
          value={isLoading ? undefined : criticalFlagsCount}
          description="Critical flags"
          highlight={criticalFlagsCount > 0}
        />
      </div>

      {/* Next Appointment Banner */}
      {nextAppointment && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
                <Calendar className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Your Next Appointment
                </p>
                <p className="text-xl font-semibold">
                  {format(parseISO(nextAppointment.dateTime), "EEEE, MMMM d")}
                </p>
                <p className="text-muted-foreground">
                  {format(parseISO(nextAppointment.dateTime), "h:mm a")}
                </p>
              </div>
            </div>
            <Link href="/patient/appointments">
              <Button className="gap-2">
                View Details <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              Upcoming Appointments
            </CardTitle>
            <Link href="/patient/appointments">
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 4).map((apt) => (
                  <AppointmentItem key={apt._id} appointment={apt} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>No upcoming appointments</p>
                <Link href="/patient/book" className="mt-2 inline-block">
                  <Button variant="outline" size="sm">
                    Book Now
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              Recent Sessions
            </CardTitle>
            <Link href="/patient/sessions">
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.slice(0, 4).map((session) => (
                  <div
                    key={session._id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Stethoscope className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Dr. {(session as typeof session & { doctorName?: string }).doctorName ?? "Doctor"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(session._creationTime),
                            "MMM d, yyyy"
                          )}
                        </p>
                      </div>
                    </div>
                    {session.aiSummary && (
                      <Badge variant="secondary">Summary Available</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Stethoscope className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>No sessions yet</p>
                <p className="text-sm">
                  Session summaries will appear after appointments.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <Link href="/patient/book">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 p-6">
                  <Calendar className="h-8 w-8 text-primary" />
                  <span>Book Appointment</span>
                </Button>
              </Link>
              <Link href="/patient/reports">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 p-6">
                  <FileText className="h-8 w-8 text-primary" />
                  <span>Upload Report</span>
                </Button>
              </Link>
              <Link href="/patient/share">
                <Button variant="outline" className="h-auto w-full flex-col gap-2 p-6">
                  <ArrowRight className="h-8 w-8 text-primary" />
                  <span>Share Context</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  icon: Icon,
  title,
  value,
  description,
  highlight,
}: {
  icon: typeof Calendar;
  title: string;
  value?: number;
  description: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-destructive/30 bg-destructive/5" : ""}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${
              highlight ? "bg-destructive/20" : "bg-primary/10"
            }`}
          >
            <Icon
              className={`h-6 w-6 ${highlight ? "text-destructive" : "text-primary"}`}
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {value === undefined ? (
              <Skeleton className="mt-1 h-7 w-12" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AppointmentItem({ appointment }: { appointment: Appointment & { doctorName?: string; doctorSpecialization?: string } }) {
  const dateTime = parseISO(appointment.dateTime);

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">Dr. {appointment.doctorName ?? "Doctor"}</p>
          <p className="text-sm text-muted-foreground">
            {format(dateTime, "EEEE, MMMM d")} at {format(dateTime, "h:mm a")}
          </p>
          {appointment.doctorSpecialization && (
            <p className="text-xs text-muted-foreground">{appointment.doctorSpecialization}</p>
          )}
        </div>
      </div>
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        {appointment.status}
      </Badge>
    </div>
  );
}
