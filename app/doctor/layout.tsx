"use client";

import { AppSidebar } from "@/components/shared/app-sidebar";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShieldAlert, Clock, Mail } from "lucide-react";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const doctorProfile = useQuery(
    api.users.getDoctorProfile,
    isLoaded && user ? { clerkUserId: user.id } : "skip"
  );

  useEffect(() => {
    if (isLoaded && user) {
      const role = user.publicMetadata?.role as string;
      if (role === "patient") {
        router.replace("/patient/dashboard");
      }
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || doctorProfile === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If profile exists but not verified, show pending verification page
  if (doctorProfile && doctorProfile.verified === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="mx-auto max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold">Verification Pending</h1>
          <p className="text-muted-foreground">
            Your doctor profile is under review. We are verifying your NMC
            registration number{" "}
            <span className="font-mono font-semibold">
              {doctorProfile.nmcNumber}
            </span>{" "}
            with the Nepal Medical Council.
          </p>
          <div className="rounded-lg border bg-card p-4 text-left text-sm space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span className="font-medium">What happens next?</span>
            </div>
            <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
              <li>
                Doctors from recognized hospitals are verified automatically.
              </li>
              <li>
                Others may require manual review (up to 24 hours).
              </li>
              <li>
                You&apos;ll get full access once verified.
              </li>
            </ul>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>
              Contact support at{" "}
              <a
                href="mailto:support@medicare.np"
                className="underline hover:text-foreground"
              >
                support@medicare.np
              </a>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <AppSidebar role="doctor">{children}</AppSidebar>;
}
