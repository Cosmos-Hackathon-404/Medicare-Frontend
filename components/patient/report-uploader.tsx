"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Image, X, Loader2, CheckCircle2, Globe, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "Arabic",
  "Bengali",
  "Portuguese",
  "Mandarin Chinese",
  "Japanese",
  "German",
  "Tamil",
  "Telugu",
  "Urdu",
] as const;

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type UploadStep = "idle" | "uploading" | "creating" | "analyzing" | "complete" | "error";

const STEP_PROGRESS: Record<UploadStep, number> = {
  idle: 0,
  uploading: 30,
  creating: 50,
  analyzing: 75,
  complete: 100,
  error: 0,
};

const STEP_LABELS: Record<UploadStep, string> = {
  idle: "",
  uploading: "Uploading file...",
  creating: "Creating report record...",
  analyzing: "AI analyzing report...",
  complete: "Complete!",
  error: "Upload failed",
};

interface ReportUploaderProps {
  onUpload: (file: File, fileType: "pdf" | "image", language?: string) => Promise<void>;
  isUploading?: boolean;
  className?: string;
  uploadStep?: UploadStep;
}

export function ReportUploader({
  onUpload,
  isUploading,
  className,
  uploadStep = "idle",
}: ReportUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return "Unsupported file type. Please upload PDF, PNG, JPG, or WEBP.";
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setFileError(null);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const fileType = selectedFile.type === "application/pdf" ? "pdf" : "image";
    try {
      await onUpload(selectedFile, fileType, selectedLanguage);
      setTimeout(() => {
        setSelectedFile(null);
      }, 1000);
    } catch {
      // Error handled by parent
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="h-10 w-10" />;
    return selectedFile.type === "application/pdf" ? (
      <FileText className="h-10 w-10 text-orange-500" />
    ) : (
      <Image className="h-10 w-10 text-blue-500" aria-label="Upload image" />
    );
  };

  const currentProgress = STEP_PROGRESS[isUploading ? uploadStep : "idle"];
  const currentLabel = STEP_LABELS[isUploading ? uploadStep : "idle"];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="h-5 w-5 text-primary" />
          Upload Medical Report
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!selectedFile ? (
          <div className="space-y-3">
            <div
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-center font-medium">
                Drag & drop your report here
              </p>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                or click to browse files
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
              <p className="mt-4 text-xs text-muted-foreground">
                Supported: PDF, PNG, JPG, WEBP &middot; Max {MAX_FILE_SIZE_MB}MB
              </p>
            </div>

            {/* File error */}
            {fileError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {fileError}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected File */}
            <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
              {getFileIcon()}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedFile(null);
                    setFileError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <Globe className="h-3.5 w-3.5" />
                Analysis Language
              </Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                AI analysis will be provided in the selected language.
              </p>
            </div>

            {/* Multi-Step Upload Progress */}
            {isUploading && (
              <div className="space-y-3">
                <Progress value={currentProgress} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  {uploadStep === "complete" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : uploadStep === "error" ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {currentLabel}
                </div>
                {/* Step indicators */}
                <div className="flex justify-between px-1">
                  {(["uploading", "creating", "analyzing"] as const).map((step, i) => {
                    const stepOrder = ["uploading", "creating", "analyzing"];
                    const currentIdx = stepOrder.indexOf(uploadStep);
                    const isActive = stepOrder.indexOf(step) <= currentIdx;
                    return (
                      <div
                        key={step}
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          isActive ? "text-primary" : "text-muted-foreground/50"
                        )}
                      >
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          isActive ? "bg-primary" : "bg-muted-foreground/30"
                        )} />
                        {["Upload", "Create", "Analyze"][i]}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedFile(null);
                  setFileError(null);
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleUpload}
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
                    Upload & Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
