"use client";

import { use, useState, useRef, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Loader2,
  ShieldAlert,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { VideoSession } from "@/components/shared/video-session";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Phase = "loading" | "unauthorized" | "pre-check" | "in-call";

export default function SessionRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const { user, isLoaded: isUserLoaded } = useUser();
  const clerkUserId = user?.id ?? "";

  const [phase, setPhase] = useState<Phase>("loading");
  const [videoPermission, setVideoPermission] = useState<boolean | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch room details with participant info
  const roomData = useQuery(
    api.queries.videoRooms.getRoomWithParticipants,
    roomId ? { roomId } : "skip"
  );

  // Security: determine the user's role and verify access
  const userRole =
    roomData?.doctorClerkId === clerkUserId
      ? "doctor"
      : roomData?.patientClerkId === clerkUserId
        ? "patient"
        : null;

  const peerName =
    userRole === "doctor"
      ? roomData?.patientName ?? "Patient"
      : roomData?.doctorName ?? "Doctor";

  // Phase transition logic
  useEffect(() => {
    if (!isUserLoaded) return;

    // Use a microtask to avoid synchronous setState within effect
    const nextPhase = (() => {
      if (!user) return "unauthorized" as const;
      if (roomData === undefined) return "loading" as const;
      if (roomData === null) return "unauthorized" as const;
      if (!userRole) return "unauthorized" as const;
      if (phase === "in-call") return null;
      if (phase === "loading") return "pre-check" as const;
      return null;
    })();

    if (nextPhase) {
      const id = requestAnimationFrame(() => setPhase(nextPhase));
      return () => cancelAnimationFrame(id);
    }
  }, [isUserLoaded, user, roomData, userRole, phase]);

  // Pre-call permission check
  useEffect(() => {
    if (phase !== "pre-check") return;

    let cancelled = false;

    const checkPermissions = async () => {
      setIsChecking(true);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (previewRef.current) {
          previewRef.current.srcObject = stream;
        }
        setVideoPermission(true);
        setAudioPermission(true);
        setIsChecking(false);
        return;
      } catch {
        // Combined request failed
      }

      try {
        const vidStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          vidStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = vidStream;
        if (previewRef.current) {
          previewRef.current.srcObject = vidStream;
        }
        setVideoPermission(true);
      } catch {
        setVideoPermission(false);
      }

      try {
        const audStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          audStream.getTracks().forEach((t) => t.stop());
          return;
        }
        audStream.getTracks().forEach((t) => t.stop());
        setAudioPermission(true);
      } catch {
        setAudioPermission(false);
      }

      if (!cancelled) {
        setIsChecking(false);
      }
    };

    checkPermissions();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [phase]);

  // Toggle camera preview
  const togglePreviewCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  // Toggle mic preview
  const togglePreviewMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const handleJoinCall = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (!videoPermission) {
      toast.info("Joining without camera — you'll be in audio-only mode.");
    }
    setPhase("in-call");
  };

  const canJoin = audioPermission === true;

  const selfName = user?.fullName ?? (userRole === "doctor" ? "Doctor" : "Patient");
  const selfInitials = selfName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ===== LOADING =====
  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#202124" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#8ab4f8]" />
          <p className="text-[#e8eaed] text-sm font-medium">Getting ready...</p>
          <p className="text-[#9aa0a6] text-xs">Verifying your access</p>
        </div>
      </div>
    );
  }

  // ===== UNAUTHORIZED =====
  if (phase === "unauthorized") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#202124" }}>
        <div className="flex flex-col items-center gap-5 text-center px-6 max-w-md">
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#3c4043" }}
          >
            <ShieldAlert className="h-10 w-10 text-[#ea4335]" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-[#e8eaed]">
              {!user ? "Sign in required" : "Access denied"}
            </h2>
            <p className="text-[#9aa0a6] text-sm mt-2">
              {!user
                ? "You need to sign in to join this session."
                : "You are not authorized to join this session. Only the assigned doctor and patient can access this room."}
            </p>
          </div>
          {!user ? (
            <SignInButton mode="modal">
              <Button className="bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] font-medium rounded-full px-8 h-10 gap-2">
                <Lock className="h-4 w-4" />
                Sign In
              </Button>
            </SignInButton>
          ) : (
            <Link href="/">
              <Button className="bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed] font-medium rounded-full px-8 h-10 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ===== IN-CALL — Full screen Google Meet UI =====
  if (phase === "in-call" && roomData && userRole) {
    return (
      <VideoSession
        roomId={roomId}
        role={userRole}
        peerName={peerName}
        appointmentId={roomData.appointmentId}
      />
    );
  }

  // ===== PRE-CALL CHECK — Google Meet Lobby =====
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#202124" }}>
      <div className="flex flex-1 flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 py-10">
        {/* ── Left: Camera Preview ── */}
        <div className="flex flex-col items-center gap-4 w-full max-w-xl">
          {/* Preview tile */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden" style={{ backgroundColor: "#3c4043" }}>
            <video
              ref={previewRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "h-full w-full object-cover mirror",
                (!videoPermission || !isCameraOn) && "hidden"
              )}
              style={{ transform: "scaleX(-1)" }}
            />
            {/* Camera off state */}
            {(!videoPermission || !isCameraOn) && !isChecking && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="h-24 w-24 rounded-full flex items-center justify-center text-4xl font-medium"
                  style={{ backgroundColor: "#5f6368" }}
                >
                  <span className="text-white">{selfInitials}</span>
                </div>
              </div>
            )}
            {/* Checking spinner */}
            {isChecking && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#8ab4f8]" />
              </div>
            )}
          </div>

          {/* Camera & Mic toggles below preview */}
          <div className="flex items-center gap-3">
            {/* Mic toggle */}
            <button
              onClick={togglePreviewMic}
              disabled={!audioPermission}
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                audioPermission && isMicOn
                  ? "bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed]"
                  : audioPermission && !isMicOn
                    ? "bg-[#ea4335] hover:bg-[#d93025] text-white"
                    : "bg-[#3c4043] text-[#5f6368] cursor-not-allowed"
              )}
              title={audioPermission ? (isMicOn ? "Turn off microphone" : "Turn on microphone") : "Microphone unavailable"}
            >
              {isMicOn && audioPermission ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            {/* Camera toggle */}
            <button
              onClick={togglePreviewCamera}
              disabled={!videoPermission}
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                videoPermission && isCameraOn
                  ? "bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed]"
                  : videoPermission && !isCameraOn
                    ? "bg-[#ea4335] hover:bg-[#d93025] text-white"
                    : "bg-[#3c4043] text-[#5f6368] cursor-not-allowed"
              )}
              title={videoPermission ? (isCameraOn ? "Turn off camera" : "Turn on camera") : "Camera unavailable"}
            >
              {isCameraOn && videoPermission ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Right: Meeting Info & Join ── */}
        <div className="flex flex-col items-center lg:items-start gap-6 w-full max-w-sm text-center lg:text-left">
          <div>
            <h1 className="text-2xl font-normal text-[#e8eaed]">Ready to join?</h1>
            <p className="text-[#9aa0a6] text-sm mt-2">
              Session with{" "}
              <span className="text-[#e8eaed] font-medium">
                {userRole === "doctor" ? "" : "Dr. "}
                {peerName}
              </span>
            </p>
          </div>

          {/* Device status indicators */}
          <div className="flex flex-col gap-2 w-full">
            {!isChecking && !audioPermission && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: "#ea4335" + "1a" }}>
                <MicOff className="h-4 w-4 text-[#ea4335] flex-shrink-0" />
                <span className="text-xs text-[#ea4335]">
                  Microphone is required. Please allow access and refresh.
                </span>
              </div>
            )}
            {!isChecking && !videoPermission && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: "#fbbc04" + "1a" }}>
                <VideoOff className="h-4 w-4 text-[#fbbc04] flex-shrink-0" />
                <span className="text-xs text-[#fbbc04]">
                  Camera unavailable — you can still join audio-only.
                </span>
              </div>
            )}
          </div>

          {/* Recording notice */}
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 w-full" style={{ backgroundColor: "#3c4043" }}>
            <div className="h-2 w-2 rounded-full bg-[#ea4335] animate-pulse flex-shrink-0" />
            <span className="text-xs text-[#9aa0a6]">
              This session will be recorded for AI summary generation
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full">
            <Button
              onClick={handleJoinCall}
              disabled={(!canJoin && !isChecking) || isChecking}
              className="bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] font-medium rounded-full px-8 h-12 text-sm flex-1 disabled:opacity-40"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                "Join now"
              )}
            </Button>
            <Link
              href={
                userRole === "doctor"
                  ? "/doctor/appointments"
                  : "/patient/appointments"
              }
            >
              <Button
                className="rounded-full h-12 px-6 text-sm font-medium text-[#8ab4f8] hover:bg-[#8ab4f8]/10"
                variant="ghost"
              >
                Cancel
              </Button>
            </Link>
          </div>

          {/* Secure session badge */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#34a853]" />
            <span className="text-xs text-[#9aa0a6]">
              Verified {userRole} · Encrypted session
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
