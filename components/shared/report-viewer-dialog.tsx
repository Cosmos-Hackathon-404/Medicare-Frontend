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
import { CriticalFlagsList } from "@/components/doctor/critical-flag-badge";
import {
  FileText,
  Image as ImageIcon,
  Eye,
  SplitSquareHorizontal,
  Download,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import type { Report } from "@/types";

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

  const fileUrl = useQuery(
    api.queries.reports.getFileUrl,
    report?.fileStorageId
      ? { fileStorageId: report.fileStorageId as Id<"_storage"> }
      : "skip"
  );

  if (!report) return null;

  const isImage = report.fileType !== "pdf";

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
                <div className="px-4 py-2 border-b bg-muted/30 shrink-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Original Document
                  </p>
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
                    {report.aiSummary ? (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold">
                          Analysis Summary
                        </h4>
                        <div className="rounded-lg bg-muted/30 p-4">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {report.aiSummary}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="mb-3 h-10 w-10 text-muted-foreground opacity-40" />
                        <p className="font-medium">No analysis available</p>
                        <p className="text-sm text-muted-foreground">
                          AI analysis is still processing or unavailable.
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
