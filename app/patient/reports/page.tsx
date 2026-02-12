"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Search,
  LayoutGrid,
  List,
  SortAsc,
  SortDesc,
  Filter,
  Trash2,
  RotateCcw,
  MoreVertical,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  FileUp,
  X,
} from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { toast } from "sonner";
import type { Report, AnalysisStatus } from "@/types";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const LANGUAGES = [
  "English", "Hindi", "Spanish", "French", "Arabic", "Bengali",
  "Portuguese", "Mandarin Chinese", "Japanese", "German", "Tamil", "Telugu", "Urdu",
] as const;

type SortOption = "newest" | "oldest" | "name" | "severity";
type FilterOption = "all" | "critical" | "analyzed" | "pending" | "failed" | "pdf" | "image";
type ViewMode = "grid" | "list";

export default function PatientReportsPage() {
  const { user } = useUser();
  const patientClerkId = user?.id ?? "";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search, Filter, Sort, View states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Queries
  const reports = useQuery(
    api.queries.reports.getByPatient,
    patientClerkId ? { patientClerkId } : "skip"
  );

  // Mutations & Actions
  const generateUploadUrl = useMutation(api.mutations.reports.generateUploadUrl);
  const createReport = useMutation(api.mutations.reports.create);
  const scheduleAnalysis = useMutation(api.mutations.reports.scheduleAnalysis);
  const deleteReportMutation = useMutation(api.mutations.reports.deleteReport);

  const isLoading = !reports;

  // Track analysis status changes to show toast notifications
  const prevAnalysisStatusesRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    if (!reports) return;
    const prevStatuses = prevAnalysisStatusesRef.current;
    for (const report of reports) {
      const prev = prevStatuses.get(report._id);
      const current = report.analysisStatus ?? "pending";
      if (prev && prev !== current) {
        if (current === "completed") {
          toast.success(`Analysis complete for "${report.fileName}"`);
        } else if (current === "failed") {
          toast.error(`Analysis failed for "${report.fileName}". You can retry from the report card.`);
        }
      }
      prevStatuses.set(report._id, current);
    }
  }, [reports]);

  // ====== File Selection: open native picker, validate, then show language dialog ======
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = ""; // reset so same files can be re-selected
    if (files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}": Unsupported file type. Please upload PDF, PNG, JPG, or WEBP.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`"${file.name}": File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setPendingFiles(validFiles);
    setSelectedLanguage("English");
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  // ====== Optimistic Upload: close dialog after create, run analysis in background ======
  const handleConfirmUpload = async () => {
    if (!patientClerkId || pendingFiles.length === 0) return;

    const files = pendingFiles;
    const primaryFile = files[0];
    const fileType: "pdf" | "image" = primaryFile.type === "application/pdf" ? "pdf" : "image";
    const language = selectedLanguage;

    setIsUploading(true);
    try {
      // Step 1: Upload ALL files to Convex storage
      const storageIds: string[] = [];
      for (const file of files) {
        const uploadUrl = await generateUploadUrl();
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await uploadResponse.json();
        storageIds.push(storageId);
      }

      const primaryStorageId = storageIds[0];
      const additionalStorageIds = storageIds.length > 1 ? storageIds.slice(1) : undefined;
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      const reportName = files.length > 1
        ? `${primaryFile.name} (+${files.length - 1} pages)`
        : primaryFile.name;

      // Step 2: Create report record (with analysisStatus = "pending")
      const reportId = await createReport({
        patientClerkId,
        fileStorageId: primaryStorageId,
        additionalFileStorageIds: additionalStorageIds,
        fileName: reportName,
        fileType,
        fileSize: totalSize,
        totalPages: files.length,
      });

      // Step 3: Close dialog immediately — analysis runs as background job
      toast.success(
        files.length > 1
          ? `Report uploaded (${files.length} pages)! AI analysis is running in the background.`
          : "Report uploaded! AI analysis is running in the background."
      );
      setPendingFiles([]);
      setIsUploading(false);

      // Schedule AI analysis as a Convex background job (non-blocking)
      scheduleAnalysis({
        reportId,
        fileStorageId: primaryStorageId,
        additionalFileStorageIds: additionalStorageIds,
        fileType,
        patientClerkId,
        language,
      }).catch(() => {
        toast.error(`Failed to start analysis for "${reportName}". You can retry from the report card.`);
      });
    } catch (error) {
      console.error("Failed to upload report:", error);
      toast.error("Failed to upload report. Please try again.");
      setIsUploading(false);
    }
  };

  // ====== Re-Analyze ======
  const handleReAnalyze = useCallback(
    async (report: Report) => {
      try {
        toast.info(`Re-analyzing "${report.fileName}"...`);
        await scheduleAnalysis({
          reportId: report._id as Id<"reports">,
          fileStorageId: report.fileStorageId as Id<"_storage">,
          additionalFileStorageIds: report.additionalFileStorageIds as Id<"_storage">[] | undefined,
          fileType: report.fileType,
          patientClerkId: report.patientClerkId,
          language: "English",
        });
        toast.success("Re-analysis started! Results will appear shortly.");
      } catch {
        toast.error("Failed to start re-analysis. Please try again.");
      }
    },
    [scheduleAnalysis]
  );

  // ====== Delete ======
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteReportMutation({ reportId: deleteTarget._id as Id<"reports"> });
      toast.success("Report deleted.");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete report.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ====== Computed Data ======
  const filteredAndSortedReports = useMemo(() => {
    if (!reports) return [];

    let result = [...reports];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.fileName.toLowerCase().includes(q) ||
          r.aiSummary?.toLowerCase().includes(q) ||
          r.criticalFlags?.some(
            (f) =>
              f.issue.toLowerCase().includes(q) ||
              f.details.toLowerCase().includes(q)
          )
      );
    }

    // Category filter
    switch (filterBy) {
      case "critical":
        result = result.filter((r) =>
          r.criticalFlags?.some((f) => f.severity === "high")
        );
        break;
      case "analyzed":
        result = result.filter((r) => r.analysisStatus === "completed" || r.aiSummary);
        break;
      case "pending":
        result = result.filter(
          (r) => r.analysisStatus === "pending" || r.analysisStatus === "analyzing"
        );
        break;
      case "failed":
        result = result.filter((r) => r.analysisStatus === "failed");
        break;
      case "pdf":
        result = result.filter((r) => r.fileType === "pdf");
        break;
      case "image":
        result = result.filter((r) => r.fileType === "image");
        break;
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => b._creationTime - a._creationTime);
        break;
      case "oldest":
        result.sort((a, b) => a._creationTime - b._creationTime);
        break;
      case "name":
        result.sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
      case "severity":
        result.sort((a, b) => {
          const aHigh = a.criticalFlags?.filter((f) => f.severity === "high").length ?? 0;
          const bHigh = b.criticalFlags?.filter((f) => f.severity === "high").length ?? 0;
          return bHigh - aHigh;
        });
        break;
    }

    return result;
  }, [reports, searchQuery, filterBy, sortBy]);

  // Stats
  const criticalCount =
    reports?.reduce(
      (acc, r) =>
        acc + (r.criticalFlags?.filter((f) => f.severity === "high").length ?? 0),
      0
    ) ?? 0;

  const analyzedCount = reports?.filter((r) => r.aiSummary || r.analysisStatus === "completed").length ?? 0;
  const recentCount = reports?.filter((r) =>
    isAfter(new Date(r._creationTime), subDays(new Date(), 7))
  ).length ?? 0;

  const hasActiveFilters = searchQuery.trim() !== "" || filterBy !== "all";

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
        <Button onClick={triggerFileSelect} className="gap-2">
          <Plus className="h-4 w-4" />
          Upload Report
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Enhanced Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-bold">{reports?.length ?? 0}</p>
                  {recentCount > 0 && (
                    <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <TrendingUp className="mr-0.5 h-3 w-3" />
                      +{recentCount} this week
                    </span>
                  )}
                </div>
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
                <p className="text-xl font-bold">{analyzedCount}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Analysis</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold">
                  {reports?.filter(
                    (r) =>
                      r.analysisStatus === "pending" ||
                      r.analysisStatus === "analyzing" ||
                      (!r.analysisStatus && !r.aiSummary)
                  ).length ?? 0}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search, Filter, Sort & View Toggle Toolbar */}
      {!isLoading && reports && reports.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Filter */}
          <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
            <SelectTrigger className="w-[150px] gap-1">
              <Filter className="h-3.5 w-3.5" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="critical">Critical Only</SelectItem>
              <SelectItem value="analyzed">Analyzed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pdf">PDFs Only</SelectItem>
              <SelectItem value="image">Images Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[150px] gap-1">
              {sortBy === "newest" || sortBy === "severity" ? (
                <SortDesc className="h-3.5 w-3.5" />
              ) : (
                <SortAsc className="h-3.5 w-3.5" />
              )}
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="severity">Most Critical</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={() => {
                setSearchQuery("");
                setFilterBy("all");
              }}
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}

          {/* View Toggle */}
          <div className="ml-auto flex items-center rounded-lg border p-0.5">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Language Confirmation Dialog */}
      <Dialog
        open={pendingFiles.length > 0}
        onOpenChange={(open) => {
          if (!open && !isUploading) {
            setPendingFiles([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingFiles.length > 1
                ? `Upload ${pendingFiles.length} files as one report`
                : `Upload "${pendingFiles[0]?.name}"`}
            </DialogTitle>
            <DialogDescription>
              {pendingFiles.length > 1 ? (
                <span className="block space-y-1">
                  <span className="block text-sm font-medium text-foreground/80">
                    {pendingFiles.length} pages/files will be analyzed together as a single report.
                  </span>
                  <span className="block text-xs">
                    Total size: {(pendingFiles.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                  </span>
                </span>
              ) : (
                pendingFiles[0] && (
                  <span>
                    {pendingFiles[0].type === "application/pdf" ? "PDF" : "Image"} &middot;{" "}
                    {(pendingFiles[0].size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )
              )}
            </DialogDescription>
          </DialogHeader>

          {/* File list preview for multi-file uploads */}
          {pendingFiles.length > 1 && (
            <div className="max-h-32 overflow-y-auto rounded-lg border bg-muted/30 p-2 space-y-1">
              {pendingFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-medium text-primary">
                    {idx + 1}
                  </span>
                  <span className="truncate">{file.name}</span>
                  <span className="ml-auto shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    disabled={isUploading}
                    onClick={() => {
                      const next = pendingFiles.filter((_, i) => i !== idx);
                      if (next.length === 0) setPendingFiles([]);
                      else setPendingFiles(next);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 py-2">
            <Label className="text-sm">Analysis Language</Label>
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
              {pendingFiles.length > 1
                ? "All pages will be analyzed holistically in the selected language."
                : "AI analysis will be provided in the selected language."}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPendingFiles([])}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUpload}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading{pendingFiles.length > 1 ? ` ${pendingFiles.length} files...` : "..."}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload & Analyze{pendingFiles.length > 1 ? ` (${pendingFiles.length} pages)` : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.fileName}&rdquo;? This will
              permanently remove the report, its AI analysis, and associated alerts. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reports Grid / List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      ) : reports && reports.length > 0 ? (
        filteredAndSortedReports.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedReports.map((report) => (
                <ReportCard
                  key={report._id}
                  report={report}
                  onClick={() => setSelectedReport(report)}
                  onDelete={() => setDeleteTarget(report)}
                  onReAnalyze={() => handleReAnalyze(report)}
                />
              ))}
            </div>
          ) : (
            <ReportListView
              reports={filteredAndSortedReports}
              onSelect={setSelectedReport}
              onDelete={setDeleteTarget}
              onReAnalyze={handleReAnalyze}
            />
          )
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="mb-4 h-10 w-10 text-muted-foreground opacity-40" />
              <h3 className="font-semibold">No matching reports</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterBy("all");
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5">
              <FileUp className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No reports yet</h3>
            <p className="mb-2 max-w-sm text-center text-sm text-muted-foreground">
              Upload your medical reports to get AI-powered analysis with
              critical flag detection and personalized recommendations.
              Select multiple files to upload a multi-page report for holistic analysis.
            </p>
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {["Blood Work", "X-Rays", "MRI Scans", "Prescriptions", "Lab Results"].map(
                (type) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                )
              )}
            </div>
            <Button onClick={triggerFileSelect} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Your First Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Report Detail Dialog */}
      <ReportViewerDialog
        report={selectedReport}
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      />
    </div>
  );
}

// ====== Analysis Status Badge ======
function AnalysisStatusBadge({ status, hasAiSummary }: { status?: AnalysisStatus; hasAiSummary?: boolean }) {
  // Handle legacy reports that don't have analysisStatus
  const effectiveStatus: AnalysisStatus = status ?? (hasAiSummary ? "completed" : "pending");

  const config: Record<AnalysisStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
    pending: {
      label: "Pending",
      icon: Clock,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    },
    analyzing: {
      label: "Analyzing",
      icon: Loader2,
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    },
    completed: {
      label: "Analyzed",
      icon: CheckCircle2,
      className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    },
    failed: {
      label: "Failed",
      icon: AlertCircle,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };

  const { label, icon: Icon, className } = config[effectiveStatus];

  return (
    <Badge variant="outline" className={cn("gap-1 text-xs font-normal", className)}>
      <Icon className={cn("h-3 w-3", effectiveStatus === "analyzing" && "animate-spin")} />
      {label}
    </Badge>
  );
}

// ====== Report Thumbnail ======
function ReportThumbnail({ report }: { report: Report }) {
  const fileUrl = useQuery(
    api.queries.reports.getFileUrl,
    report.fileType === "image"
      ? { fileStorageId: report.fileStorageId as Id<"_storage"> }
      : "skip"
  );

  if (report.fileType === "image" && fileUrl) {
    return (
      <div className="relative h-10 w-10 overflow-hidden rounded-lg border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/50">
      {report.fileType === "image" ? (
        <Image className="h-5 w-5 text-blue-500" />
      ) : (
        <FileIcon className="h-5 w-5 text-orange-500" />
      )}
    </div>
  );
}

// ====== Report Card (Grid View) ======
function ReportCard({
  report,
  onClick,
  onDelete,
  onReAnalyze,
}: {
  report: Report;
  onClick: () => void;
  onDelete: () => void;
  onReAnalyze: () => void;
}) {
  const hasHighPriority = report.criticalFlags?.some(
    (f) => f.severity === "high"
  );

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md",
        hasHighPriority && "border-destructive/30"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ReportThumbnail report={report} />
            <div className="min-w-0 flex-1">
              <span className="font-medium line-clamp-1">{report.fileName}</span>
              <p className="text-xs text-muted-foreground">
                {format(new Date(report._creationTime), "MMM d, yyyy")}
                {report.fileSize && (
                  <> &middot; {(report.fileSize / 1024 / 1024).toFixed(1)} MB</>
                )}
                {(report.totalPages ?? 1) > 1 && (
                  <> &middot; {report.totalPages} pages</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasHighPriority && (
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={onClick}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {(report.analysisStatus === "failed" || (!report.aiSummary && !report.analysisStatus)) && (
                  <DropdownMenuItem onClick={onReAnalyze}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Re-Analyze
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-3">
          <AnalysisStatusBadge status={report.analysisStatus as AnalysisStatus} hasAiSummary={!!report.aiSummary} />
        </div>

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

// ====== Report List View ======
function ReportListView({
  reports,
  onSelect,
  onDelete,
  onReAnalyze,
}: {
  reports: Report[];
  onSelect: (report: Report) => void;
  onDelete: (report: Report) => void;
  onReAnalyze: (report: Report) => void;
}) {
  return (
    <Card>
      <div className="divide-y">
        {reports.map((report) => {
          const hasHighPriority = report.criticalFlags?.some(
            (f) => f.severity === "high"
          );
          return (
            <div
              key={report._id}
              className={cn(
                "group flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-muted/50",
                hasHighPriority && "bg-destructive/5"
              )}
              onClick={() => onSelect(report)}
            >
              <ReportThumbnail report={report} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{report.fileName}</p>
                  <AnalysisStatusBadge
                    status={report.analysisStatus as AnalysisStatus}
                    hasAiSummary={!!report.aiSummary}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(report._creationTime), "MMM d, yyyy 'at' h:mm a")}
                  {report.fileSize && (
                    <> &middot; {(report.fileSize / 1024 / 1024).toFixed(1)} MB</>
                  )}
                  {(report.totalPages ?? 1) > 1 && (
                    <> &middot; {report.totalPages} pages</>
                  )}
                  {report.criticalFlags && report.criticalFlags.length > 0 && (
                    <>
                      {" "}&middot;{" "}
                      <span className={hasHighPriority ? "text-destructive" : ""}>
                        {report.criticalFlags.length} flag{report.criticalFlags.length !== 1 && "s"}
                      </span>
                    </>
                  )}
                </p>
              </div>
              {report.aiSummary && (
                <p className="hidden lg:block max-w-xs text-sm text-muted-foreground truncate">
                  {report.aiSummary}
                </p>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onSelect(report)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {(report.analysisStatus === "failed" || (!report.aiSummary && !report.analysisStatus)) && (
                    <DropdownMenuItem onClick={() => onReAnalyze(report)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Re-Analyze
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(report)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
