"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReportUploader } from "@/components/patient/report-uploader";
import { CriticalFlagsList } from "@/components/doctor/critical-flag-badge";
import { ReportViewerDialog } from "@/components/shared/report-viewer-dialog";
import {
  FileText,
  Upload,
  AlertTriangle,
  Eye,
  Image,
  FileIcon,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Report } from "@/types";

export default function PatientReportsPage() {
  const { user } = useUser();
  const patientClerkId = user?.id ?? "";

  const [showUploader, setShowUploader] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Queries
  const reports = useQuery(
    api.queries.reports.getByPatient,
    patientClerkId ? { patientClerkId } : "skip"
  );

  // Mutations & Actions
  const generateUploadUrl = useMutation(api.mutations.reports.generateUploadUrl);
  const createReport = useMutation(api.mutations.reports.create);
  const analyzeReport = useAction(api.actions.analyzeReport.analyzeReport);

  const isLoading = !reports;

  const handleUpload = async (file: File, fileType: "pdf" | "image", language?: string) => {
    if (!patientClerkId) return;

    setIsUploading(true);
    try {
      // Step 1: Upload file to Convex storage
      toast.info("Uploading file...");
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await uploadResponse.json();

      // Step 2: Create report record
      toast.info("Analyzing with AI...");
      const reportId = await createReport({
        patientClerkId,
        fileStorageId: storageId,
        fileName: file.name,
        fileType,
      });

      // Step 3: Run AI analysis
      await analyzeReport({
        reportId,
        fileStorageId: storageId,
        fileType,
        patientClerkId,
        language: language ?? "English",
      });

      toast.success("Report uploaded and analyzed!");
      setShowUploader(false);
    } catch (error) {
      console.error("Failed to upload report:", error);
      toast.error("Failed to upload report. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Count critical flags
  const criticalCount =
    reports?.reduce(
      (acc, r) =>
        acc + (r.criticalFlags?.filter((f) => f.severity === "high").length ?? 0),
      0
    ) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Reports</h1>
          <p className="text-muted-foreground">
            Upload medical reports and view AI-generated analysis.
          </p>
        </div>
        <Button onClick={() => setShowUploader(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Upload Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold">{reports?.length ?? 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card
          className={
            criticalCount > 0 ? "border-destructive/30 bg-destructive/5" : ""
          }
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                criticalCount > 0 ? "bg-destructive/20" : "bg-muted"
              }`}
            >
              <AlertTriangle
                className={`h-5 w-5 ${
                  criticalCount > 0 ? "text-destructive" : "text-muted-foreground"
                }`}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critical Alerts</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold">{criticalCount}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AI Analyzed</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold">
                  {reports?.filter((r) => r.aiSummary).length ?? 0}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Medical Report</DialogTitle>
          </DialogHeader>
          <ReportUploader onUpload={handleUpload} isUploading={isUploading} />
        </DialogContent>
      </Dialog>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[180px]" />
          ))}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports
            .sort((a, b) => b._creationTime - a._creationTime)
            .map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                onClick={() => setSelectedReport(report)}
              />
            ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground opacity-40" />
            <h3 className="font-semibold">No reports yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Upload your first medical report to get AI analysis.
            </p>
            <Button onClick={() => setShowUploader(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Report Detail Dialog — Side-by-side Document + AI Analysis */}
      <ReportViewerDialog
        report={selectedReport}
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      />
    </div>
  );
}

function ReportCard({
  report,
  onClick,
}: {
  report: Report;
  onClick: () => void;
}) {
  const hasHighPriority = report.criticalFlags?.some(
    (f) => f.severity === "high"
  );

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        hasHighPriority ? "border-destructive/30" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            {report.fileType === "image" ? (
              <Image className="h-5 w-5 text-blue-500" />
            ) : (
              <FileIcon className="h-5 w-5 text-orange-500" />
            )}
            <span className="font-medium line-clamp-1">{report.fileName}</span>
          </div>
          {hasHighPriority && (
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          )}
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          {format(new Date(report._creationTime), "MMM d, yyyy")}
        </p>

        {report.criticalFlags && report.criticalFlags.length > 0 && (
          <div className="mb-3">
            <CriticalFlagsList flags={report.criticalFlags.slice(0, 2)} />
          </div>
        )}

        {report.aiSummary && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {report.aiSummary}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
