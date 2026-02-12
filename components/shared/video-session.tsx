"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
  PhoneOff,
  Monitor,
  MonitorOff,
  Loader2,
  WifiOff,
  CircleDot,
  Users,
  Info,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface VideoSessionProps {
  roomId: string;
  role: "doctor" | "patient";
  peerName: string;
  appointmentId: string;
}

export function VideoSession({
  roomId,
  role,
  peerName,
  appointmentId,
}: VideoSessionProps) {
  const { user } = useUser();
  const router = useRouter();
  const clerkUserId = user?.id ?? "";

  // State
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<string>("new");
  const [isRecording, setIsRecording] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [peerReadyTick, setPeerReadyTick] = useState(0);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callStartedRef = useRef(false);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  // Convex
  const videoRoom = useQuery(api.queries.videoRooms.getByRoomId, { roomId });

  const signals = useQuery(
    api.queries.videoRooms.getSignals,
    videoRoom?.roomId && clerkUserId
      ? { roomId: videoRoom.roomId, excludeSenderClerkId: clerkUserId }
      : "skip"
  );

  const joinRoom = useMutation(api.mutations.videoRooms.joinRoom);
  const updateSignal = useMutation(api.mutations.videoRooms.updateSignal);
  const generateUploadUrl = useMutation(api.mutations.sessions.generateUploadUrl);
  const endRoomWithSession = useMutation(api.mutations.videoRooms.endRoomWithSession);
  const rejoinRoom = useMutation(api.mutations.videoRooms.rejoinRoom);

  // Auto-reset ended rooms so participants can rejoin
  const [isResetting, setIsResetting] = useState(false);
  useEffect(() => {
    if (videoRoom?.status === "ended" && clerkUserId && !isResetting) {
      setIsResetting(true);
      rejoinRoom({ roomId, clerkUserId })
        .then(() => setIsResetting(false))
        .catch(() => setIsResetting(false));
    }
  }, [videoRoom?.status, clerkUserId, roomId, rejoinRoom, isResetting]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (!isConnected) return;

    const resetTimer = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isConnected]);

  // ===== Audio Recording =====
  const startAudioRecording = useCallback((stream: MediaStream) => {
    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn("No audio tracks available for recording");
        return;
      }

      const audioStream = new MediaStream(audioTracks);
      recordingStreamRef.current = audioStream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const recorder = new MediaRecorder(audioStream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start audio recording:", error);
    }
  }, []);

  const stopAudioRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType;
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        setIsRecording(false);
        resolve(blob.size > 0 ? blob : null);
      };

      recorder.stop();
    });
  }, []);

  // ===== Media & WebRTC =====
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
    } catch {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        localStreamRef.current = audioStream;
        setIsVideoEnabled(false);
        return audioStream;
      } catch {
        console.error("Failed to access any media devices");
        return null;
      }
    }
  }, []);

  const createPeerConnection = useCallback(
    (stream: MediaStream) => {
      peerConnectionRef.current?.close();
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
        ],
      });

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsConnected(true);
          setIsConnecting(false);
        }
      };

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
      setPeerReadyTick((prev) => prev + 1);
      return pc;
    },
    [videoRoom?.roomId, clerkUserId, updateSignal]
  );

  const startCall = useCallback(async () => {
    if (!videoRoom?.roomId || !clerkUserId) return;

    const stream = await initLocalMedia();
    if (!stream) return;

    startAudioRecording(stream);

    await joinRoom({
      appointmentId: appointmentId as Id<"appointments">,
      clerkUserId,
      role,
    });

    const pc = createPeerConnection(stream);

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
    startAudioRecording,
  ]);

  // Process incoming signals
  const processedSignalIds = useRef<Set<string>>(new Set());
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    if (!signals || signals.length === 0) return;

    const processSignals = async () => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      for (const signalDoc of signals) {
        // Skip already-processed signals
        if (processedSignalIds.current.has(signalDoc._id)) continue;
        processedSignalIds.current.add(signalDoc._id);

        try {
          const signal = JSON.parse(signalDoc.signal);

          if (signal.type === "offer" && role === "patient") {
            // Only accept offer if we haven't already set a remote description
            if (pc.signalingState !== "stable" && pc.signalingState !== "have-local-offer") continue;
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Flush any queued ICE candidates now that remote desc is set
            for (const candidate of pendingCandidates.current) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidates.current = [];

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
            // Only set answer if we're expecting one
            if (pc.signalingState !== "have-local-offer") continue;
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

            // Flush any queued ICE candidates
            for (const candidate of pendingCandidates.current) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidates.current = [];
          } else if (signal.type === "ice-candidate") {
            // Queue if remote description isn't set yet
            if (!pc.remoteDescription) {
              pendingCandidates.current.push(signal.candidate);
            } else {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
          }
        } catch (error) {
          console.error("Error processing signal:", error);
        }
      }
    };

    processSignals();
  }, [signals, role, videoRoom?.roomId, clerkUserId, updateSignal, peerReadyTick]);

  // Start call when room is ready (not ended)
  useEffect(() => {
    if (videoRoom && clerkUserId && videoRoom.status !== "ended" && !callStartedRef.current) {
      callStartedRef.current = true;
      startCall().catch((error) => {
        console.error("Failed to start call:", error);
        callStartedRef.current = false;
        setConnectionState("failed");
        setIsConnecting(false);
      });
    }
    // Reset flag when room goes back to ended (so rejoin works)
    if (videoRoom?.status === "ended") {
      callStartedRef.current = false;
      processedSignalIds.current.clear();
      pendingCandidates.current = [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRoom?.roomId, videoRoom?.status, clerkUserId]);

  // Teardown media/peer only on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

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

  // ===== Controls =====
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;

      if (localStreamRef.current && peerConnectionRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          const sender = peerConnectionRef.current
            ?.getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) await sender.replaceTrack(videoTrack);
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(screenTrack);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error("Failed to share screen:", error);
      }
    }
  };

  // ===== End Call — upload audio & create session =====
  const handleEndCall = async () => {
    setIsEndingCall(true);
    toast.info("Ending call and saving recording...");

    try {
      const audioBlob = await stopAudioRecording();

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      let audioStorageId: Id<"_storage"> | undefined;

      if (audioBlob && audioBlob.size > 0) {
        toast.info("Uploading session recording...");
        const uploadUrl = await generateUploadUrl();
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": audioBlob.type },
          body: audioBlob,
        });
        const { storageId } = await uploadResponse.json();
        audioStorageId = storageId;
      }

      await endRoomWithSession({
        appointmentId: appointmentId as Id<"appointments">,
        audioStorageId,
      });

      toast.success("Call ended! Processing session summary...");
      router.push(`/session/${roomId}/complete`);
    } catch (error) {
      console.error("Failed to end call:", error);
      toast.error("Failed to save session. Please try again.");
      setIsEndingCall(false);
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

  const peerInitials = peerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const selfName = user?.fullName ?? (role === "doctor" ? "Doctor" : "Patient");
  const selfInitials = selfName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ===== LOADING =====
  if (!videoRoom) {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ backgroundColor: "#202124" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
          <p className="text-[#e8eaed] text-sm font-medium">Setting up your meeting...</p>
        </div>
      </div>
    );
  }

  // ===== SESSION ENDED (resetting automatically) =====
  if (videoRoom.status === "ended") {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ backgroundColor: "#202124" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#8ab4f8]" />
          <p className="text-[#e8eaed] text-sm font-medium">Preparing room...</p>
        </div>
      </div>
    );
  }

  // ===== ENDING CALL =====
  if (isEndingCall) {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ backgroundColor: "#202124" }}>
        <div className="flex flex-col items-center gap-5 text-center px-6">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
          <div>
            <h2 className="text-xl font-medium text-[#e8eaed]">Saving session...</h2>
            <p className="text-[#9aa0a6] text-sm mt-2">
              Uploading recording and generating AI summary
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===== GOOGLE MEET — IN CALL =====
  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-screen flex-col overflow-hidden select-none"
      style={{ backgroundColor: "#202124" }}
    >
      {/* ── Top Bar ── */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-16 transition-opacity duration-300",
          showControls || !isConnected ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{ backgroundColor: "#202124" }}
      >
        {/* Left — Meeting info */}
        <div className="flex items-center gap-4">
          <span className="text-[#e8eaed] font-medium text-base tracking-tight">
            Medicare Session
          </span>
          <span className="text-[#9aa0a6] text-sm hidden sm:inline-block">|</span>
          <span className="text-[#9aa0a6] text-sm hidden sm:inline-block">
            {formatDuration(callDuration)}
          </span>
          {/* Recording badge */}
          {isRecording && (
            <div className="flex items-center gap-1.5 bg-[#ea4335]/15 border border-[#ea4335]/30 rounded-full px-3 py-1">
              <CircleDot className="h-3 w-3 text-[#ea4335] animate-pulse" />
              <span className="text-[#ea4335] text-xs font-medium">REC</span>
            </div>
          )}
        </div>

        {/* Right — Info & participant count */}
        <div className="flex items-center gap-2">
          <span className="text-[#9aa0a6] text-xs sm:text-sm">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <button className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-[#3c4043] transition-colors">
            <Users className="h-5 w-5 text-[#e8eaed]" />
          </button>
          <button className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-[#3c4043] transition-colors">
            <Info className="h-5 w-5 text-[#e8eaed]" />
          </button>
        </div>
      </div>

      {/* ── Video Grid Area ── */}
      <div className="flex-1 flex items-center justify-center px-3 pt-16 pb-24">
        {/* Waiting for peer */}
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center gap-6 w-full max-w-lg">
            {/* Large Avatar Circle (Google Meet style) */}
            <div
              className="h-40 w-40 rounded-full flex items-center justify-center text-5xl font-medium"
              style={{ backgroundColor: "#5f6368" }}
            >
              <span className="text-white">{peerInitials}</span>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-normal text-[#e8eaed]">
                {role === "doctor" ? "" : "Dr. "}
                {peerName}
              </h2>
              <div className="mt-3 flex items-center justify-center gap-2">
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#8ab4f8]" />
                    <span className="text-sm text-[#9aa0a6]">
                      Waiting for others to join...
                    </span>
                  </>
                ) : connectionState === "failed" ? (
                  <>
                    <WifiOff className="h-4 w-4 text-[#ea4335]" />
                    <span className="text-sm text-[#ea4335]">
                      Connection failed. Try refreshing.
                    </span>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#fbbc04]" />
                    <span className="text-sm text-[#fbbc04]">Connecting...</span>
                  </>
                )}
              </div>
            </div>

            {/* Self-view tile while waiting */}
            <div className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden" style={{ backgroundColor: "#3c4043" }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn("h-full w-full object-cover", !isVideoEnabled && "hidden")}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-medium"
                    style={{ backgroundColor: "#5f6368" }}
                  >
                    <span className="text-white">{selfInitials}</span>
                  </div>
                </div>
              )}
              {/* Self name overlay */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 rounded px-2 py-0.5">
                <span className="text-xs text-white font-medium">You</span>
                {!isAudioEnabled && <MicOff className="h-3 w-3 text-[#ea4335]" />}
              </div>
            </div>
          </div>
        ) : (
          /* ── Connected: Side-by-side equal tiles ── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full h-full max-w-[1400px] max-h-[calc(100vh-10rem)]">
            {/* Remote Video Tile */}
            <div className="relative rounded-lg overflow-hidden min-h-0" style={{ backgroundColor: "#3c4043" }}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              {/* Peer name overlay */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded px-2.5 py-1">
                <span className="text-sm text-white font-medium">
                  {role === "doctor" ? "" : "Dr. "}
                  {peerName}
                </span>
              </div>
            </div>

            {/* Local Video Tile (self — equal size, not PiP) */}
            <div className="relative rounded-lg overflow-hidden min-h-0" style={{ backgroundColor: "#3c4043" }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn("h-full w-full object-cover", !isVideoEnabled && "hidden")}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-medium"
                    style={{ backgroundColor: "#5f6368" }}
                  >
                    <span className="text-white">{selfInitials}</span>
                  </div>
                </div>
              )}
              {/* Self name overlay */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded px-2.5 py-1">
                <span className="text-sm text-white font-medium">You</span>
                {!isAudioEnabled && <MicOff className="h-3.5 w-3.5 text-[#ea4335]" />}
              </div>
              {/* Screen sharing indicator */}
              {isScreenSharing && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#1a73e8] rounded px-2.5 py-1">
                  <Monitor className="h-3.5 w-3.5 text-white" />
                  <span className="text-xs text-white font-medium">Presenting</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Control Bar (Google Meet pill) ── */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center py-4 transition-opacity duration-300",
          showControls || !isConnected ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{ backgroundColor: "#202124" }}
      >
        <div className="flex items-center gap-3 rounded-full px-6 py-2" style={{ backgroundColor: "#303134" }}>
          <TooltipProvider delayDuration={200}>
            {/* Mic */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleAudio}
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                    isAudioEnabled
                      ? "bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed]"
                      : "bg-[#ea4335] hover:bg-[#d93025] text-white"
                  )}
                >
                  {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#e8eaed] text-[#202124] border-0 text-xs font-medium">
                {isAudioEnabled ? "Turn off microphone (Ctrl+D)" : "Turn on microphone (Ctrl+D)"}
              </TooltipContent>
            </Tooltip>

            {/* Camera */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleVideo}
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                    isVideoEnabled
                      ? "bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed]"
                      : "bg-[#ea4335] hover:bg-[#d93025] text-white"
                  )}
                >
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#e8eaed] text-[#202124] border-0 text-xs font-medium">
                {isVideoEnabled ? "Turn off camera (Ctrl+E)" : "Turn on camera (Ctrl+E)"}
              </TooltipContent>
            </Tooltip>

            {/* Screen Share */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleScreenShare}
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                    isScreenSharing
                      ? "bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124]"
                      : "bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed]"
                  )}
                >
                  {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#e8eaed] text-[#202124] border-0 text-xs font-medium">
                {isScreenSharing ? "Stop presenting" : "Present now"}
              </TooltipContent>
            </Tooltip>

            {/* More options */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="h-12 w-12 rounded-full flex items-center justify-center bg-[#3c4043] hover:bg-[#4a4d51] text-[#e8eaed] transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#e8eaed] text-[#202124] border-0 text-xs font-medium">
                More options
              </TooltipContent>
            </Tooltip>

            {/* Separator */}
            <div className="w-px h-8 mx-1" style={{ backgroundColor: "#5f6368" }} />

            {/* End Call */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleEndCall}
                  disabled={isEndingCall}
                  className="h-12 w-[72px] rounded-full flex items-center justify-center bg-[#ea4335] hover:bg-[#d93025] text-white transition-colors disabled:opacity-50"
                >
                  {isEndingCall ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <PhoneOff className="h-5 w-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#e8eaed] text-[#202124] border-0 text-xs font-medium">
                Leave call
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
