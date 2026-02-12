"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2,
  Clock,
  Loader2,
  WifiOff,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoCallProps {
  appointmentId: string;
  role: "doctor" | "patient";
  peerName: string;
  onCallEnd?: (duration: number) => void;
}

export function VideoCall({
  appointmentId,
  role,
  peerName,
  onCallEnd,
}: VideoCallProps) {
  const { user } = useUser();
  const clerkUserId = user?.id ?? "";

  // State
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<string>("new");

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Convex
  const videoRoom = useQuery(api.queries.videoRooms.getByAppointment, {
    appointmentId: appointmentId as Id<"appointments">,
  });

  const signals = useQuery(
    api.queries.videoRooms.getSignals,
    videoRoom?.roomId && clerkUserId
      ? { roomId: videoRoom.roomId, excludeSenderClerkId: clerkUserId }
      : "skip"
  );

  const joinRoom = useMutation(api.mutations.videoRooms.joinRoom);
  const endRoom = useMutation(api.mutations.videoRooms.endRoom);
  const updateSignal = useMutation(api.mutations.videoRooms.updateSignal);
  const clearSignals = useMutation(api.mutations.videoRooms.clearSignals);

  // Initialize local media
  const initLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error("Failed to access media devices:", error);
      // Try audio-only if video fails
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        localStreamRef.current = audioStream;
        setIsVideoEnabled(false);
        return audioStream;
      } catch (audioError) {
        console.error("Failed to access any media devices:", audioError);
        return null;
      }
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(
    (stream: MediaStream) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
        ],
      });

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsConnected(true);
          setIsConnecting(false);
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && videoRoom?.roomId) {
          updateSignal({
            roomId: videoRoom.roomId,
            senderClerkId: clerkUserId,
            signal: JSON.stringify({
              type: "ice-candidate",
              candidate: event.candidate,
            }),
          });
        }
      };

      // Connection state changes
      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        if (pc.connectionState === "connected") {
          setIsConnected(true);
          setIsConnecting(false);
        } else if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          setIsConnected(false);
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    },
    [videoRoom?.roomId, clerkUserId, updateSignal]
  );

  // Start the call
  const startCall = useCallback(async () => {
    if (!videoRoom?.roomId || !clerkUserId) return;

    const stream = await initLocalMedia();
    if (!stream) return;

    // Join the room
    await joinRoom({
      appointmentId: appointmentId as Id<"appointments">,
      clerkUserId,
      role,
    });

    const pc = createPeerConnection(stream);

    // Doctor creates offer, patient waits for offer
    if (role === "doctor") {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await updateSignal({
        roomId: videoRoom.roomId,
        senderClerkId: clerkUserId,
        signal: JSON.stringify({
          type: "offer",
          sdp: offer,
        }),
      });
    }
  }, [
    videoRoom?.roomId,
    clerkUserId,
    appointmentId,
    role,
    initLocalMedia,
    joinRoom,
    createPeerConnection,
    updateSignal,
  ]);

  // Process incoming signals
  useEffect(() => {
    if (!signals || signals.length === 0 || !peerConnectionRef.current) return;

    const processSignals = async () => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      for (const signalDoc of signals) {
        try {
          const signal = JSON.parse(signalDoc.signal);

          if (signal.type === "offer" && role === "patient") {
            await pc.setRemoteDescription(
              new RTCSessionDescription(signal.sdp)
            );
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            if (videoRoom?.roomId) {
              await updateSignal({
                roomId: videoRoom.roomId,
                senderClerkId: clerkUserId,
                signal: JSON.stringify({
                  type: "answer",
                  sdp: answer,
                }),
              });
            }
          } else if (signal.type === "answer" && role === "doctor") {
            await pc.setRemoteDescription(
              new RTCSessionDescription(signal.sdp)
            );
          } else if (signal.type === "ice-candidate") {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        } catch (error) {
          console.error("Error processing signal:", error);
        }
      }
    };

    processSignals();
  }, [signals, role, videoRoom?.roomId, clerkUserId, updateSignal]);

  // Start call on mount
  useEffect(() => {
    if (videoRoom && clerkUserId) {
      startCall();
    }

    return () => {
      // Cleanup
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRoom?.roomId, clerkUserId]);

  // Duration timer
  useEffect(() => {
    if (isConnected && !durationIntervalRef.current) {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [isConnected]);

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;

      // Replace with camera
      if (localStreamRef.current && peerConnectionRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          const sender = peerConnectionRef.current
            ?.getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;

        // Replace video track with screen track
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        // Show screen in local preview
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Handle screen share stop from browser UI
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error("Failed to share screen:", error);
      }
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // End call
  const handleEndCall = async () => {
    // Stop all tracks
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    peerConnectionRef.current?.close();

    // Clear interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // End the room in Convex
    try {
      const result = await endRoom({
        appointmentId: appointmentId as Id<"appointments">,
      });

      // Clear signals
      if (videoRoom?.roomId) {
        await clearSignals({ roomId: videoRoom.roomId });
      }

      onCallEnd?.(result.duration ?? callDuration);
    } catch (error) {
      console.error("Failed to end room:", error);
      onCallEnd?.(callDuration);
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const initials = peerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (!videoRoom) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Setting up video room...</p>
        </CardContent>
      </Card>
    );
  }

  if (videoRoom.status === "ended") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <PhoneOff className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Call Ended</h3>
          {videoRoom.duration && (
            <p className="text-muted-foreground mt-1">
              Duration: {formatDuration(videoRoom.duration)}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-xl overflow-hidden bg-gray-950",
        isFullscreen ? "fixed inset-0 z-50" : "aspect-video"
      )}
    >
      {/* Remote Video (Full Background) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={cn(
          "absolute inset-0 w-full h-full object-cover",
          !isConnected && "hidden"
        )}
      />

      {/* When not connected — waiting state */}
      {!isConnected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-primary/30">
              <AvatarFallback className="bg-primary/20 text-2xl font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isConnecting && (
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary animate-pulse">
                <Phone className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>
          <h3 className="mt-4 text-xl font-semibold text-white">
            {role === "doctor" ? "" : "Dr. "}
            {peerName}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-gray-400">
                  Waiting for {role === "doctor" ? "patient" : "doctor"} to
                  join...
                </span>
              </>
            ) : connectionState === "failed" ? (
              <>
                <WifiOff className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">
                  Connection failed. Try refreshing.
                </span>
              </>
            ) : (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                <span className="text-sm text-yellow-400">Connecting...</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Local Video (Picture-in-Picture) */}
      <div
        className={cn(
          "absolute bottom-20 right-4 z-10 overflow-hidden rounded-xl border-2 border-white/20 shadow-2xl transition-all",
          isFullscreen ? "w-64 h-48" : "w-40 h-30 md:w-52 md:h-40"
        )}
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "h-full w-full object-cover",
            !isVideoEnabled && "hidden"
          )}
        />
        {!isVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <VideoOff className="h-8 w-8 text-gray-400" />
          </div>
        )}
        {isScreenSharing && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-xs">
            <Monitor className="mr-1 h-3 w-3" />
            Sharing
          </Badge>
        )}
      </div>

      {/* Top Bar — Call Info */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={cn(
              "gap-1 text-white border-white/30",
              isConnected
                ? "bg-green-500/20"
                : "bg-yellow-500/20 animate-pulse"
            )}
          >
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-green-400" : "bg-yellow-400"
              )}
            />
            {isConnected ? "Connected" : "Connecting"}
          </Badge>
          {isConnected && (
            <Badge variant="outline" className="gap-1 text-white border-white/30">
              <Clock className="h-3 w-3" />
              {formatDuration(callDuration)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-3 bg-gradient-to-t from-black/60 to-transparent p-4">
        <TooltipProvider>
          {/* Audio Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                variant={isAudioEnabled ? "secondary" : "destructive"}
                className={cn(
                  "h-12 w-12 rounded-full",
                  isAudioEnabled
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : ""
                )}
                onClick={toggleAudio}
              >
                {isAudioEnabled ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isAudioEnabled ? "Mute" : "Unmute"}
            </TooltipContent>
          </Tooltip>

          {/* Video Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                variant={isVideoEnabled ? "secondary" : "destructive"}
                className={cn(
                  "h-12 w-12 rounded-full",
                  isVideoEnabled
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : ""
                )}
                onClick={toggleVideo}
              >
                {isVideoEnabled ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            </TooltipContent>
          </Tooltip>

          {/* Screen Share */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                variant={isScreenSharing ? "default" : "secondary"}
                className={cn(
                  "h-12 w-12 rounded-full",
                  !isScreenSharing
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : "bg-primary"
                )}
                onClick={toggleScreenShare}
              >
                {isScreenSharing ? (
                  <MonitorOff className="h-5 w-5" />
                ) : (
                  <Monitor className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isScreenSharing ? "Stop sharing" : "Share screen"}
            </TooltipContent>
          </Tooltip>

          {/* End Call */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                variant="destructive"
                className="h-12 w-16 rounded-full"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>End Call</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// ===== Call Status Badge Component =====
export function CallStatusBadge({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const videoRoom = useQuery(api.queries.videoRooms.getByAppointment, {
    appointmentId: appointmentId as Id<"appointments">,
  });

  if (!videoRoom) return null;

  return (
    <Badge
      variant={
        videoRoom.status === "active"
          ? "default"
          : videoRoom.status === "waiting"
            ? "secondary"
            : "outline"
      }
      className={cn(
        "gap-1",
        videoRoom.status === "active" && "bg-green-600 animate-pulse"
      )}
    >
      {videoRoom.status === "active" ? (
        <>
          <Video className="h-3 w-3" />
          Live
        </>
      ) : videoRoom.status === "waiting" ? (
        <>
          <Clock className="h-3 w-3" />
          Waiting
        </>
      ) : (
        <>
          <PhoneOff className="h-3 w-3" />
          Ended
        </>
      )}
    </Badge>
  );
}

// ===== Pre-Call Check Component =====
export function PreCallCheck({
  onReady,
  onCancel,
}: {
  onReady: () => void;
  onCancel: () => void;
}) {
  const [videoPermission, setVideoPermission] = useState<boolean | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkPermissions = async () => {
      // Try both video + audio together first
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
        // Combined request failed — check individually below
      }

      // Check video separately
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

      // Check audio separately
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
  }, []);

  // Only microphone is required; camera is optional for audio-only sessions
  const canJoin = audioPermission === true;

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Pre-Call Equipment Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Camera Preview */}
        <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-900">
          <video
            ref={previewRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          {!videoPermission && !isChecking && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <VideoOff className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-400">Camera not available</p>
              </div>
            </div>
          )}
        </div>

        {/* Permission Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span className="text-sm font-medium">Camera</span>
            </div>
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : videoPermission ? (
              <Badge variant="outline" className="text-green-600 border-green-200">
                Ready
              </Badge>
            ) : (
              <Badge variant="destructive">Not Available</Badge>
            )}
          </div>
          {!isChecking && !videoPermission && (
            <p className="text-xs text-amber-600 dark:text-amber-400 px-1">
              Camera not found — you can still join in audio-only mode.
            </p>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span className="text-sm font-medium">Microphone</span>
            </div>
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : audioPermission ? (
              <Badge variant="outline" className="text-green-600 border-green-200">
                Ready
              </Badge>
            ) : (
              <Badge variant="destructive">Not Available</Badge>
            )}
          </div>
          {!isChecking && !audioPermission && (
            <p className="text-xs text-red-600 dark:text-red-400 px-1">
              Microphone is required. Please allow mic access and refresh.
            </p>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="text-sm font-medium">Speaker</span>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200">
              Ready
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => {
              streamRef.current?.getTracks().forEach((track) => track.stop());
              onReady();
            }}
            disabled={!canJoin && !isChecking}
            className="flex-1 gap-2"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4" />
                Join Call
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
