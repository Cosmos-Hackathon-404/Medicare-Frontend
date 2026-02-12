"use client";

import { use, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  VideoCall,
  PreCallCheck,
} from "@/components/shared/video-call";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  User,
  FileText,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PatientVideoCallPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  useUser(); // ensure authenticated
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const appointment = useQuery(api.queries.appointments.getById, {
    appointmentId: appointmentId as Id<"appointments">,
  });

  const videoRoom = useQuery(api.queries.videoRooms.getByAppointment, {
    appointmentId: appointmentId as Id<"appointments">,
  });

  // Get doctor info
  const doctor = useQuery(
    api.queries.doctors.getById,
    appointment?.doctorId ? { doctorId: appointment.doctorId } : "skip"
  );

  const isLoading = appointment === undefined || videoRoom === undefined;

  const handleCallEnd = (duration: number) => {
    setCallEnded(true);
    setCallDuration(duration);
    toast.success(`Call ended. Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} minute${m !== 1 ? "s" : ""} ${s} second${s !== 1 ? "s" : ""}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="aspect-video w-full" />
      </div>
    );
  }

  if (!appointment || appointment.type !== "online") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Video className="mb-4 h-16 w-16 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-semibold">Video Call Not Available</h2>
        <p className="text-muted-foreground">
          This is not an online appointment.
        </p>
        <Link href="/patient/appointments" className="mt-4">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Appointments
          </Button>
        </Link>
      </div>
    );
  }

  if (callEnded) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/patient/appointments"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Appointments
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Call Summary</h1>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold">Call Completed</h2>
            <p className="text-muted-foreground mt-1">
              with Dr. {doctor?.name ?? "Doctor"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Duration: {formatDuration(callDuration)}
            </p>
            <div className="flex gap-3 mt-6">
              <Link href="/patient/appointments">
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Appointments
                </Button>
              </Link>
              <Link href="/patient/sessions">
                <Button className="gap-2">
                  <FileText className="h-4 w-4" />
                  View Sessions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dateTime = parseISO(appointment.dateTime);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/patient/appointments"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Video Consultation
            </h1>
            <div className="mt-1 flex items-center gap-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Dr. {doctor?.name ?? "Doctor"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(dateTime, "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(dateTime, "h:mm a")}
              </span>
            </div>
          </div>
          <Badge className="gap-1 bg-blue-600">
            <Video className="h-3 w-3" />
            Online
          </Badge>
        </div>
      </div>

      {/* Pre-Call Check or Video Call */}
      {!isReady ? (
        <PreCallCheck
          onReady={() => setIsReady(true)}
          onCancel={() => router.push("/patient/appointments")}
        />
      ) : (
        <VideoCall
          appointmentId={appointmentId}
          role="patient"
          peerName={doctor?.name ?? "Doctor"}
          onCallEnd={handleCallEnd}
        />
      )}

      {/* Appointment Info */}
      {!isReady && (
        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Doctor</p>
                <p className="font-medium">Dr. {doctor?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {doctor?.specialization}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="font-medium">
                  {format(dateTime, "MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(dateTime, "h:mm a")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
