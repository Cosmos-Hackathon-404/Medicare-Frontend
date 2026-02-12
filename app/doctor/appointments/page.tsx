"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
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
  FileText,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Ban,
  Video,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO, isAfter, isBefore, startOfDay } from "date-fns";
import type { Appointment } from "@/types";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";

type FilterStatus = "all" | "scheduled" | "completed" | "cancelled";
type FilterTime = "all" | "past" | "today" | "upcoming";

export default function DoctorAppointmentsPage() {
  const { user } = useUser();
  const doctorClerkId = user?.id ?? "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [timeFilter, setTimeFilter] = useState<FilterTime>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

      // Search filter by patient name
      if (search && !(apt.patientName ?? apt.patientClerkId).toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      return true;
    })
    .sort((a, b) => parseISO(b.dateTime).getTime() - parseISO(a.dateTime).getTime());

  const totalFiltered = filteredAppointments?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedAppointments = filteredAppointments?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when filters change
  const handleFilterChange = <T,>(setter: (v: T) => void, value: T) => {
    setter(value);
    setCurrentPage(1);
  };

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
          title="Total"
          value={statusCount.all}
          icon={Calendar}
          isLoading={isLoading}
        />
        <StatsCard
          title="Scheduled"
          value={statusCount.scheduled}
          icon={Clock}
          variant="blue"
          isLoading={isLoading}
        />
        <StatsCard
          title="Completed"
          value={statusCount.completed}
          icon={CheckCircle2}
          variant="green"
          isLoading={isLoading}
        />
        <StatsCard
          title="Cancelled"
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
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => handleFilterChange(setStatusFilter, v as FilterStatus)}
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
              onValueChange={(v) => handleFilterChange(setTimeFilter, v as FilterTime)}
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
            <>
              {/* Desktop Table (hidden on mobile) */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reports</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAppointments?.map((apt) => (
                      <AppointmentRow key={apt._id} appointment={apt as Appointment} />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List (hidden on desktop) */}
              <div className="md:hidden divide-y">
                {paginatedAppointments?.map((apt) => (
                  <MobileAppointmentCard key={apt._id} appointment={apt as Appointment} />
                ))}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalFiltered)} of {totalFiltered}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No appointments found"
              description="Try adjusting your filters."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}



function AppointmentRow({ appointment }: { appointment: Appointment & { patientName?: string } }) {
  const dateTime = parseISO(appointment.dateTime);
  const isScheduled = appointment.status === "scheduled";
  const updateStatus = useMutation(api.mutations.appointments.updateStatus);

  const handleCancel = async () => {
    try {
      await updateStatus({ appointmentId: appointment._id, status: "cancelled" });
      toast.success("Appointment cancelled");
    } catch {
      toast.error("Failed to cancel appointment");
    }
  };

  const handleComplete = async () => {
    try {
      await updateStatus({ appointmentId: appointment._id, status: "completed" });
      toast.success("Appointment marked as completed");
    } catch {
      toast.error("Failed to update appointment");
    }
  };

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
          {appointment.patientName ?? "View Patient"}
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
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
          {appointment.type === "online" && (
            <Badge variant="outline" className="gap-1 text-xs text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800">
              <Video className="h-3 w-3" />
              Video
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        {appointment.sharedReportIds && appointment.sharedReportIds.length > 0 ? (
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3 w-3" />
            {appointment.sharedReportIds.length}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="max-w-[200px] truncate text-muted-foreground">
        {appointment.notes || "—"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Link href={`/doctor/chat?patient=${appointment.patientClerkId}`}>
            <Button size="sm" variant="outline" className="gap-1">
              <MessageSquare className="h-3 w-3" />
              Message
            </Button>
          </Link>
          {isScheduled ? (
            <>
              {appointment.type === "online" && (
                <Link href={`/doctor/appointments/${appointment._id}/video`}>
                  <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700">
                    <Video className="h-3 w-3" />
                    Join Call
                  </Button>
                </Link>
              )}
              <Link href={`/doctor/session/${appointment._id}`}>
                <Button size="sm" className="gap-1">
                  <Play className="h-3 w-3" />
                  Start Session
                </Button>
              </Link>
            </>
          ) : (
            <Link href={`/doctor/session/${appointment._id}`}>
              <Button size="sm" variant="outline" className="gap-1">
                <Eye className="h-3 w-3" />
                View
              </Button>
            </Link>
          )}
          {isScheduled && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark Completed
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Mark as completed?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the appointment as completed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleComplete}>
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Cancel Appointment
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The patient will be notified of the cancellation.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Go Back</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Cancel Appointment
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
function MobileAppointmentCard({ appointment }: { appointment: Appointment & { patientName?: string } }) {
  const dateTime = parseISO(appointment.dateTime);
  const isScheduled = appointment.status === "scheduled";
  const updateStatus = useMutation(api.mutations.appointments.updateStatus);

  const handleCancel = async () => {
    try {
      await updateStatus({ appointmentId: appointment._id, status: "cancelled" });
      toast.success("Appointment cancelled");
    } catch {
      toast.error("Failed to cancel appointment");
    }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/doctor/patient/${appointment.patientId}`}
            className="font-medium text-primary hover:underline"
          >
            {appointment.patientName ?? "View Patient"}
          </Link>
          <p className="text-sm text-muted-foreground">
            {format(dateTime, "MMM d, yyyy")} at {format(dateTime, "h:mm a")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              appointment.status === "completed"
                ? "default"
                : appointment.status === "cancelled"
                  ? "destructive"
                  : "secondary"
            }
            className="gap-1 shrink-0"
          >
            {appointment.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
            {appointment.status === "cancelled" && <XCircle className="h-3 w-3" />}
            {appointment.status === "scheduled" && <Clock className="h-3 w-3" />}
            {appointment.status}
          </Badge>
          {appointment.type === "online" && (
            <Badge variant="outline" className="gap-1 text-xs text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800 shrink-0">
              <Video className="h-3 w-3" />
              Video
            </Badge>
          )}
        </div>
      </div>
      {appointment.notes && (
        <p className="text-sm text-muted-foreground line-clamp-2">{appointment.notes}</p>
      )}
      <div className="flex gap-2">
        {isScheduled && appointment.type === "online" && (
          <Link href={`/doctor/appointments/${appointment._id}/video`} className="flex-1">
            <Button size="sm" className="w-full gap-1 bg-blue-600 hover:bg-blue-700">
              <Video className="h-3 w-3" />
              Join Call
            </Button>
          </Link>
        )}
        <Link href={`/doctor/chat?patient=${appointment.patientClerkId}`} className="flex-1">
          <Button size="sm" variant="outline" className="w-full gap-1">
            <MessageSquare className="h-3 w-3" />
            Message
          </Button>
        </Link>
        <Link href={`/doctor/session/${appointment._id}`} className="flex-1">
          <Button size="sm" variant={isScheduled ? "default" : "outline"} className="w-full gap-1">
            {isScheduled ? <Play className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {isScheduled ? "Start" : "View"}
          </Button>
        </Link>
        {isScheduled && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-destructive px-2">
                <Ban className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The patient will be notified.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go Back</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Cancel Appointment
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}