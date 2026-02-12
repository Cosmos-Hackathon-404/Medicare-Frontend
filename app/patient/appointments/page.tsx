"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { toast } from "sonner";
import type { Appointment } from "@/types";

export default function PatientAppointmentsPage() {
  const { user } = useUser();
  const patientClerkId = user?.id ?? "";

  const appointments = useQuery(
    api.queries.appointments.getByPatient,
    patientClerkId ? { patientClerkId } : "skip"
  );
  const cancelAppointment = useMutation(api.mutations.appointments.cancel);

  const isLoading = !appointments;

  // Separate appointments by type
  const now = new Date();
  const upcoming =
    appointments
      ?.filter(
        (apt) =>
          apt.status === "scheduled" && isAfter(parseISO(apt.dateTime), now)
      )
      .sort(
        (a, b) =>
          parseISO(a.dateTime).getTime() - parseISO(b.dateTime).getTime()
      ) ?? [];
  const past =
    appointments
      ?.filter(
        (apt) =>
          apt.status === "completed" || isBefore(parseISO(apt.dateTime), now)
      )
      .sort(
        (a, b) =>
          parseISO(b.dateTime).getTime() - parseISO(a.dateTime).getTime()
      ) ?? [];
  const cancelled =
    appointments?.filter((apt) => apt.status === "cancelled") ?? [];

  const handleCancel = async (appointmentId: string) => {
    try {
      await cancelAppointment({
        appointmentId: appointmentId as Id<"appointments">,
      });
      toast.success("Appointment cancelled successfully");
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-muted-foreground">
            View your upcoming and past appointments.
          </p>
        </div>
        <Link href="/patient/book">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Book New
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold">{upcoming.length}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold">{past.length}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cancelled</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold">{cancelled.length}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming" className="gap-1">
            <Clock className="h-4 w-4" />
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Past ({past.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-1">
            <XCircle className="h-4 w-4" />
            Cancelled ({cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((apt) => (
                <AppointmentCard
                  key={apt._id}
                  appointment={apt}
                  onCancel={() => handleCancel(apt._id)}
                  showCancel
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No upcoming appointments"
              description="Book an appointment with a doctor to get started."
              action={
                <Link href="/patient/book">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Book Appointment
                  </Button>
                </Link>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : past.length > 0 ? (
            <div className="space-y-3">
              {past.map((apt) => (
                <AppointmentCard key={apt._id} appointment={apt} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="No past appointments"
              description="Completed appointments will appear here."
            />
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : cancelled.length > 0 ? (
            <div className="space-y-3">
              {cancelled.map((apt) => (
                <AppointmentCard key={apt._id} appointment={apt} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={XCircle}
              title="No cancelled appointments"
              description="Cancelled appointments will appear here."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AppointmentCard({
  appointment,
  showCancel,
  onCancel,
}: {
  appointment: Appointment & { doctorName?: string; doctorSpecialization?: string };
  showCancel?: boolean;
  onCancel?: () => void;
}) {
  const dateTime = parseISO(appointment.dateTime);

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 flex-col items-center justify-center rounded-lg ${
              appointment.status === "scheduled"
                ? "bg-primary/10"
                : appointment.status === "completed"
                  ? "bg-green-500/10"
                  : "bg-muted"
            }`}
          >
            <span className="text-lg font-bold">{format(dateTime, "d")}</span>
            <span className="text-xs text-muted-foreground">
              {format(dateTime, "MMM")}
            </span>
          </div>
          <div>
            <p className="font-semibold">Dr. {appointment.doctorName ?? "Doctor"}</p>
            {appointment.doctorSpecialization && (
              <p className="text-xs text-muted-foreground">{appointment.doctorSpecialization}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {format(dateTime, "EEEE")} at {format(dateTime, "h:mm a")}
            </p>
            {appointment.notes && (
              <p className="mt-1 text-sm text-muted-foreground">
                {appointment.notes}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={
              appointment.status === "completed"
                ? "default"
                : appointment.status === "cancelled"
                  ? "destructive"
                  : "secondary"
            }
            className="gap-1"
          >
            {appointment.status === "completed" && (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {appointment.status === "cancelled" && (
              <XCircle className="h-3 w-3" />
            )}
            {appointment.status === "scheduled" && (
              <Clock className="h-3 w-3" />
            )}
            {appointment.status}
          </Badge>
          {showCancel && onCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Cancel Appointment?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this appointment scheduled
                    for {format(dateTime, "MMMM d, yyyy 'at' h:mm a")}? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Link href={`/patient/chat?doctor=${appointment.doctorClerkId}`}>
            <Button variant="outline" size="sm" className="gap-1">
              <MessageSquare className="h-3 w-3" />
              Message
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Calendar;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="mb-4 h-12 w-12 text-muted-foreground opacity-40" />
        <h3 className="font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}
