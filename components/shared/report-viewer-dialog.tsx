"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CriticalFlagsList } from "@/components/doctor/critical-flag-badge";
import {
  FileText,
  Image as ImageIcon,
  Eye,
  SplitSquareHorizontal,
  Download,
  ExternalLink,
  ChevronDown,
  Lightbulb,
  Stethoscope,
  CheckCircle2,
  ListChecks,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Report, AnalysisStatus } from "@/types";

interface ReportViewerDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportViewerDialog({
  report,
  open,
  onOpenChange,
}: ReportViewerDialogProps) {
  const [viewMode, setViewMode] = useState<"split" | "document" | "analysis">(
    "split"
  );
  const [recosOpen, setRecosOpen] = useState(true);
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  // Collect all file storage IDs (primary + additional pages)
  const allFileStorageIds = report
    ? [
        report.fileStorageId,
        ...(report.additionalFileStorageIds ?? []),
      ]
    : [];
  const totalPages = allFileStorageIds.length;

  // Query URL for the currently viewed page
  const currentStorageId = allFileStorageIds[currentPage] ?? report?.fileStorageId;
  const fileUrl = useQuery(
    api.queries.reports.getFileUrl,
    currentStorageId
      ? { fileStorageId: currentStorageId as Id<"_storage"> }
      : "skip"
  );

  if (!report) return null;

  const isImage = report.fileType !== "pdf";
  const effectiveStatus: AnalysisStatus =
    (report.analysisStatus as AnalysisStatus) ?? (report.aiSummary ? "completed" : "pending");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="flex items-center gap-2">
              {isImage ? (
                <ImageIcon className="h-5 w-5 text-blue-500" />
              ) : (
                <FileText className="h-5 w-5 text-orange-500" />
              )}
              {report.fileName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <AnalysisStatusIndicator status={effectiveStatus} />
              {totalPages > 1 && (
                <Badge variant="outline" className="text-xs gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {totalPages} pages
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {report.fileType.toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(report._creationTime), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant={viewMode === "split" ? "default" : "outline"}
              onClick={() => setViewMode("split")}
              className="gap-1.5 h-8"
            >
              <SplitSquareHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === "document" ? "default" : "outline"}
              onClick={() => setViewMode("document")}
              className="gap-1.5 h-8"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Document</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === "analysis" ? "default" : "outline"}
              onClick={() => setViewMode("analysis")}
              className="gap-1.5 h-8"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Analysis</span>
            </Button>

            {fileUrl && (
              <div className="ml-auto flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1"
                  asChild
                >
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Open</span>
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1"
                  asChild
                >
                  <a href={fileUrl} download={report.fileName}>
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div
            className={`grid h-full ${
              viewMode === "split"
                ? "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1"
            }`}
          >
            {/* Document Panel */}
            {(viewMode === "split" || viewMode === "document") && (
              <div className="h-full border-r overflow-hidden flex flex-col">
                <div className="px-4 py-2 border-b bg-muted/30 shrink-0 flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Original Document
                    {totalPages > 1 && (
                      <span className="ml-1 normal-case">
                        (Page {currentPage + 1} of {totalPages})
                      </span>
                    )}
                  </p>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      >
                        <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                      </Button>
                      <span className="text-xs tabular-nums min-w-[3ch] text-center">
                        {currentPage + 1}/{totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={currentPage === totalPages - 1}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      >
                        <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-auto">
                  {fileUrl === undefined ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="h-[400px] w-[90%]" />
                    </div>
                  ) : fileUrl ? (
                    isImage ? (
                      <div className="flex items-center justify-center p-4 h-full bg-muted/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={fileUrl}
                          alt={report.fileName}
                          className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                        />
                      </div>
                    ) : (
                      <iframe
                        src={fileUrl}
                        className="w-full h-full min-h-[500px]"
                        title={report.fileName}
                      />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Unable to load document preview.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analysis Panel */}
            {(viewMode === "split" || viewMode === "analysis") && (
              <div className="h-full overflow-hidden flex flex-col">
                <div className="px-4 py-2 border-b bg-muted/30 shrink-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    AI Analysis
                  </p>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-5">
                    {/* Analysis Status Banner */}
                    {effectiveStatus === "analyzing" && (
                      <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Analysis in Progress</p>
                          <p className="text-xs text-muted-foreground">
                            AI is analyzing your report. Results will appear here automatically.
                          </p>
                        </div>
                      </div>
                    )}

                    {effectiveStatus === "failed" && (
                      <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Analysis Failed</p>
                          <p className="text-xs text-muted-foreground">
                            The AI analysis encountered an error. You can retry from the reports page.
                          </p>
                        </div>
                      </div>
                    )}

                    {effectiveStatus === "pending" && !report.aiSummary && (
                      <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                        <Clock className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="text-sm font-medium">Pending Analysis</p>
                          <p className="text-xs text-muted-foreground">
                            This report is queued for AI analysis.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Critical Flags */}
                    {report.criticalFlags &&
                      report.criticalFlags.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-sm font-semibold flex items-center gap-2">
                            Critical Flags
                            <Badge variant="destructive" className="text-xs">
                              {report.criticalFlags.length}
                            </Badge>
                          </h4>
                          <CriticalFlagsList
                            flags={report.criticalFlags}
                            expanded
                          />
                        </div>
                      )}

                    {/* AI Summary */}
                    {report.aiSummary && (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          Analysis Summary
                        </h4>
                        <div className="rounded-lg bg-muted/30 p-4">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {report.aiSummary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {report.recommendations && report.recommendations.length > 0 && (
                      <Collapsible open={recosOpen} onOpenChange={setRecosOpen}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <ListChecks className="h-4 w-4 text-green-600 dark:text-green-400" />
                            Recommendations
                            <Badge variant="secondary" className="text-xs">
                              {report.recommendations.length}
                            </Badge>
                          </h4>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              recosOpen && "rotate-180"
                            )}
                          />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="space-y-2">
                            {report.recommendations.map((rec, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 rounded-lg border bg-green-500/5 p-3"
                              >
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                                <p className="text-sm">{rec}</p>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Pre-Diagnosis Insights */}
                    {report.preDiagnosisInsights && (
                      <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            Pre-Diagnosis Insights
                          </h4>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              insightsOpen && "rotate-180"
                            )}
                          />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="rounded-lg border bg-purple-500/5 p-4">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                              {report.preDiagnosisInsights}
                            </p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* No analysis available fallback */}
                    {!report.aiSummary &&
                      effectiveStatus !== "analyzing" &&
                      effectiveStatus !== "pending" &&
                      effectiveStatus !== "failed" && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <FileText className="mb-3 h-10 w-10 text-muted-foreground opacity-40" />
                          <p className="font-medium">No analysis available</p>
                          <p className="text-sm text-muted-foreground">
                            AI analysis is not available for this report.
                          </p>
                        </div>
                      )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ====== Analysis Status Indicator for Dialog Header ======
function AnalysisStatusIndicator({ status }: { status: AnalysisStatus }) {
  const config: Record<AnalysisStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    pending: {
      label: "Pending",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      icon: Clock,
    },
    analyzing: {
      label: "Analyzing...",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      icon: Loader2,
    },
    completed: {
      label: "Analyzed",
      className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      icon: CheckCircle2,
    },
    failed: {
      label: "Failed",
      className: "bg-destructive/10 text-destructive border-destructive/20",
      icon: AlertCircle,
    },
  };

  const { label, className, icon: Icon } = config[status];

  return (
    <Badge variant="outline" className={cn("gap-1 text-xs", className)}>
      <Icon className={cn("h-3 w-3", status === "analyzing" && "animate-spin")} />
      {label}
    </Badge>
  );
}
