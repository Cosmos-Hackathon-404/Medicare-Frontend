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
  Users,
  Clock,
  FileText,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { format, isToday, parseISO } from "date-fns";
import type { Appointment } from "@/types";

export default function DoctorDashboardPage() {
  const { user } = useUser();
  const doctorClerkId = user?.id ?? "";

  const appointments = useQuery(
    api.queries.appointments.getByDoctor,
    doctorClerkId ? { doctorClerkId } : "skip"
  );
  const sessions = useQuery(
    api.queries.sessions.getByDoctor,
    doctorClerkId ? { doctorClerkId } : "skip"
  );
  const sharedContexts = useQuery(
    api.queries.sharedContexts.getForDoctor,
    doctorClerkId ? { doctorClerkId } : "skip"
  );

  const isLoading = !appointments || !sessions || !sharedContexts;

  // Calculate stats
  const todayAppointments =
    appointments?.filter((apt) => isToday(parseISO(apt.dateTime))) ?? [];
  const scheduledCount =
    appointments?.filter((apt) => apt.status === "scheduled").length ?? 0;
  const completedCount =
    appointments?.filter((apt) => apt.status === "completed").length ?? 0;
  const pendingContexts =
    sharedContexts?.filter((ctx) => ctx.status === "pending").length ?? 0;

  // Get unique patient count
  const uniquePatients = new Set(
    appointments?.map((apt) => apt.patientClerkId) ?? []
  ).size;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, Dr. {user?.firstName ?? "Doctor"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={Calendar}
          title="Today's Appointments"
          value={isLoading ? undefined : todayAppointments.length}
          description="Scheduled for today"
        />
        <StatsCard
          icon={Users}
          title="Total Patients"
          value={isLoading ? undefined : uniquePatients}
          description="Unique patients"
        />
        <StatsCard
          icon={CheckCircle2}
          title="Completed Sessions"
          value={isLoading ? undefined : completedCount}
          description="All time"
        />
        <StatsCard
          icon={FileText}
          title="Pending Reviews"
          value={isLoading ? undefined : pendingContexts}
          description="Shared contexts"
          highlight={pendingContexts > 0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              Today&apos;s Schedule
            </CardTitle>
            <Link href="/doctor/appointments">
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
            ) : todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.slice(0, 5).map((apt) => (
                  <AppointmentItem key={apt._id} appointment={apt} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>No appointments scheduled for today.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              Upcoming Appointments
            </CardTitle>
            <Badge variant="secondary">{scheduledCount} scheduled</Badge>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : scheduledCount > 0 ? (
              <div className="space-y-3">
                {appointments
                  ?.filter(
                    (apt) =>
                      apt.status === "scheduled" &&
                      !isToday(parseISO(apt.dateTime))
                  )
                  .sort(
                    (a, b) =>
                      parseISO(a.dateTime).getTime() -
                      parseISO(b.dateTime).getTime()
                  )
                  .slice(0, 5)
                  .map((apt) => (
                    <AppointmentItem key={apt._id} appointment={apt} showDate />
                  ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Clock className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>No upcoming appointments.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Shared Contexts */}
        {pendingContexts > 0 && (
          <Card className="border-orange-500/30 bg-orange-500/5 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Pending Patient Contexts
              </CardTitle>
              <Link href="/doctor/shared-context">
                <Button variant="outline" size="sm" className="gap-1">
                  Review all <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You have {pendingContexts} shared patient context(s) waiting for
                your review. These contain important medical history shared by
                other doctors.
              </p>
            </CardContent>
          </Card>
        )}
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
    <Card className={highlight ? "border-orange-500/30 bg-orange-500/5" : ""}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${
              highlight ? "bg-orange-500/20" : "bg-primary/10"
            }`}
          >
            <Icon
              className={`h-6 w-6 ${highlight ? "text-orange-500" : "text-primary"}`}
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

function AppointmentItem({
  appointment,
  showDate,
}: {
  appointment: Appointment & { patientName?: string };
  showDate?: boolean;
}) {
  const dateTime = parseISO(appointment.dateTime);

  return (
    <Link href={`/doctor/session/${appointment._id}`}>
      <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{appointment.patientName ?? "Patient"}</p>
            <p className="text-sm text-muted-foreground">
              {showDate
                ? format(dateTime, "MMM d, yyyy 'at' h:mm a")
                : format(dateTime, "h:mm a")}
            </p>
          </div>
        </div>
        <Badge
          variant={
            appointment.status === "completed"
              ? "default"
              : appointment.status === "cancelled"
                ? "destructive"
                : "secondary"
          }
        >
          {appointment.status}
        </Badge>
      </div>
    </Link>
  );
}
