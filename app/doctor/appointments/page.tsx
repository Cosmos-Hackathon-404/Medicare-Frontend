"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Search,
  Filter,
  Play,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO, isAfter, isBefore, startOfDay } from "date-fns";
import type { Appointment } from "@/types";

type FilterStatus = "all" | "scheduled" | "completed" | "cancelled";
type FilterTime = "all" | "past" | "today" | "upcoming";

export default function DoctorAppointmentsPage() {
  const { user } = useUser();
  const doctorClerkId = user?.id ?? "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [timeFilter, setTimeFilter] = useState<FilterTime>("all");

  const appointments = useQuery(
    api.queries.appointments.getByDoctor,
    doctorClerkId ? { doctorClerkId } : "skip"
  );

  const isLoading = !appointments;

  // Filter appointments
  const filteredAppointments = appointments
    ?.filter((apt) => {
      // Status filter
      if (statusFilter !== "all" && apt.status !== statusFilter) return false;

      // Time filter
      const aptDate = parseISO(apt.dateTime);
      const today = startOfDay(new Date());
      if (timeFilter === "past" && !isBefore(aptDate, today)) return false;
      if (timeFilter === "today" && !isAfter(aptDate, today)) return false;
      if (
        timeFilter === "today" &&
        !isBefore(aptDate, new Date(today.getTime() + 86400000))
      )
        return false;
      if (timeFilter === "upcoming" && !isAfter(aptDate, today)) return false;

      // Search filter (by patient ID for now)
      if (search && !apt.patientClerkId.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      return true;
    })
    .sort((a, b) => parseISO(b.dateTime).getTime() - parseISO(a.dateTime).getTime());

  const statusCount = {
    all: appointments?.length ?? 0,
    scheduled: appointments?.filter((a) => a.status === "scheduled").length ?? 0,
    completed: appointments?.filter((a) => a.status === "completed").length ?? 0,
    cancelled: appointments?.filter((a) => a.status === "cancelled").length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
        <p className="text-muted-foreground">
          View and manage your upcoming and past appointments.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total"
          value={statusCount.all}
          icon={Calendar}
          isLoading={isLoading}
        />
        <StatsCard
          label="Scheduled"
          value={statusCount.scheduled}
          icon={Clock}
          variant="blue"
          isLoading={isLoading}
        />
        <StatsCard
          label="Completed"
          value={statusCount.completed}
          icon={CheckCircle2}
          variant="green"
          isLoading={isLoading}
        />
        <StatsCard
          label="Cancelled"
          value={statusCount.cancelled}
          icon={XCircle}
          variant="red"
          isLoading={isLoading}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as FilterStatus)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={timeFilter}
              onValueChange={(v) => setTimeFilter(v as FilterTime)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAppointments && filteredAppointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((apt) => (
                  <AppointmentRow key={apt._id} appointment={apt as Appointment} />
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p className="font-medium">No appointments found</p>
              <p className="text-sm">Try adjusting your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({
  label,
  value,
  icon: Icon,
  variant = "default",
  isLoading,
}: {
  label: string;
  value: number;
  icon: typeof Calendar;
  variant?: "default" | "blue" | "green" | "red";
  isLoading?: boolean;
}) {
  const variantStyles = {
    default: "bg-primary/10 text-primary",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    red: "bg-destructive/10 text-destructive",
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${variantStyles[variant]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-6 w-8" />
          ) : (
            <p className="text-xl font-bold">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const dateTime = parseISO(appointment.dateTime);
  const isScheduled = appointment.status === "scheduled";

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium">{format(dateTime, "MMM d, yyyy")}</p>
          <p className="text-sm text-muted-foreground">
            {format(dateTime, "h:mm a")}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <Link
          href={`/doctor/patient/${appointment.patientId}`}
          className="text-primary hover:underline"
        >
          View Patient
        </Link>
      </TableCell>
      <TableCell>
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
          {appointment.status === "cancelled" && <XCircle className="h-3 w-3" />}
          {appointment.status === "scheduled" && <Clock className="h-3 w-3" />}
          {appointment.status}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[200px] truncate text-muted-foreground">
        {appointment.notes || "—"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {isScheduled ? (
            <Link href={`/doctor/session/${appointment._id}`}>
              <Button size="sm" className="gap-1">
                <Play className="h-3 w-3" />
                Start Session
              </Button>
            </Link>
          ) : (
            <Link href={`/doctor/session/${appointment._id}`}>
              <Button size="sm" variant="outline" className="gap-1">
                <Eye className="h-3 w-3" />
                View
              </Button>
            </Link>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
