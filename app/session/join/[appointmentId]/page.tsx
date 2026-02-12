"use client";

import { use, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

/**
 * Redirect page: looks up the video room for an appointment
 * and redirects to the secure /session/[roomId] route.
 */
export default function JoinSessionRedirect({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const router = useRouter();

  const videoRoom = useQuery(api.queries.videoRooms.getByAppointment, {
    appointmentId: appointmentId as Id<"appointments">,
  });

  useEffect(() => {
    if (videoRoom === undefined) return; // still loading

    if (videoRoom === null) {
      // No video room — shouldn't happen, but go back
      router.replace("/");
      return;
    }

    // Redirect to the secure session route
    router.replace(`/session/${videoRoom.roomId}`);
  }, [videoRoom, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">
            Joining session...
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Redirecting to secure video room
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
