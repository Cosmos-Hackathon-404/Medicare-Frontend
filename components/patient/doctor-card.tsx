"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, User, MessageSquare, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DoctorProfile } from "@/types";

interface DoctorCardProps {
  doctor: DoctorProfile;
  className?: string;
}

export function DoctorCard({ doctor, className }: DoctorCardProps) {
  const initials = doctor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        className
      )}
    >
      <CardContent className="p-0">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-background">
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-lg truncate">
                  Dr. {doctor.name}
                </h3>
                {doctor.verified && (
                  <BadgeCheck className="h-5 w-5 shrink-0 text-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">
                  {doctor.specialization}
                </Badge>
                {doctor.verified && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400 text-xs">
                    NMC Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {doctor.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {doctor.bio}
            </p>
          )}

          {/* Availability indicator */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {doctor.availableSlots && doctor.availableSlots.length > 0
                ? `${doctor.availableSlots.length} time slots available`
                : "Check availability"}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Link href={`/patient/book/${doctor._id}`} className="flex-1">
              <Button className="w-full gap-2">
                <Calendar className="h-4 w-4" />
                Book Appointment
              </Button>
            </Link>
            <Link href={`/patient/chat?doctor=${doctor.clerkUserId}&name=${encodeURIComponent(doctor.name)}`}>
              <Button variant="outline" size="icon" title="Message Doctor">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DoctorListProps {
  doctors: DoctorProfile[];
  isLoading?: boolean;
  className?: string;
}

export function DoctorList({ doctors, isLoading, className }: DoctorListProps) {
  if (isLoading) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="h-[220px] animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <User className="mx-auto mb-3 h-12 w-12 opacity-40" />
        <p className="font-medium">No doctors found</p>
        <p className="text-sm">Try adjusting your search filters.</p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {doctors.map((doctor) => (
        <DoctorCard key={doctor._id} doctor={doctor} />
      ))}
    </div>
  );
}
