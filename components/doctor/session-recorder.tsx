"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Upload, Loader2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isUploading?: boolean;
  className?: string;
}

export function SessionRecorder({
  onRecordingComplete,
  isUploading,
  className,
}: SessionRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordingBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleUpload = () => {
    if (recordingBlob) {
      onRecordingComplete(recordingBlob);
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingBlob(null);
    setDuration(0);
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic className="h-5 w-5 text-primary" />
          Session Recording
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-6">
          {/* Recording Indicator */}
          <div className="relative flex h-32 w-32 items-center justify-center">
            <div
              className={cn(
                "absolute inset-0 rounded-full bg-primary/10 transition-all duration-300",
                isRecording && !isPaused && "animate-pulse bg-destructive/20",
                isPaused && "bg-amber-500/20"
              )}
            />
            <div
              className={cn(
                "flex h-24 w-24 items-center justify-center rounded-full border-4 transition-all duration-300",
                isRecording && !isPaused
                  ? "border-destructive bg-destructive/10"
                  : isPaused
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-primary/30 bg-background"
              )}
            >
              {isRecording ? (
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "mb-1 h-3 w-3 rounded-full",
                    isPaused ? "bg-amber-500" : "bg-destructive animate-pulse"
                  )} />
                  <span className="font-mono text-lg font-bold">
                    {formatDuration(duration)}
                  </span>
                </div>
              ) : audioUrl ? (
                <span className="font-mono text-lg font-semibold text-primary">
                  {formatDuration(duration)}
                </span>
              ) : (
                <Mic className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Recording Status */}
          {isRecording && (
            <Badge variant={isPaused ? "secondary" : "destructive"} className={isPaused ? "" : "animate-pulse"}>
              {isPaused ? "Recording paused" : "Recording in progress..."}
            </Badge>
          )}

          {/* Audio Playback */}
          {audioUrl && !isRecording && (
            <audio controls src={audioUrl} className="w-full max-w-sm" />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isRecording && !audioUrl && (
              <Button onClick={startRecording} size="lg" className="gap-2">
                <Mic className="h-4 w-4" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <div className="flex gap-2">
                {isPaused ? (
                  <Button
                    onClick={resumeRecording}
                    size="lg"
                    variant="outline"
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    onClick={pauseRecording}
                    size="lg"
                    variant="outline"
                    className="gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                )}
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop Recording
                </Button>
              </div>
            )}

            {audioUrl && !isRecording && (
              <>
                <Button onClick={resetRecording} variant="outline" size="lg">
                  Record Again
                </Button>
                <Button
                  onClick={handleUpload}
                  size="lg"
                  className="gap-2"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Process Session
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
