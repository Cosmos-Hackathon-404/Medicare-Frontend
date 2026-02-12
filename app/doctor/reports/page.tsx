"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CriticalFlagsList } from "@/components/doctor/critical-flag-badge";
import { ReportViewerDialog } from "@/components/shared/report-viewer-dialog";
import {
  FileText,
  Search,
  Filter,
  AlertTriangle,
  Eye,
  Download,
  Image,
  FileIcon,
} from "lucide-react";
import { format } from "date-fns";
import type { Report } from "@/types";

type FilterSeverity = "all" | "high" | "medium" | "low";

export default function DoctorReportsPage() {
  const { user } = useUser();
  const doctorClerkId = user?.id ?? "";
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<FilterSeverity>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const reports = useQuery(
    api.queries.reports.getByDoctor,
    doctorClerkId ? { doctorClerkId } : "skip"
  );

  const isLoading = !reports;

  // Filter reports
  const filteredReports = reports?.filter((report) => {
    // Severity filter
    if (severityFilter !== "all") {
      const hasMatchingSeverity = report.criticalFlags?.some(
        (flag) => flag.severity === severityFilter
      );
      if (!hasMatchingSeverity) return false;
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesName = report.fileName.toLowerCase().includes(searchLower);
      const matchesSummary = report.aiSummary?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesSummary) return false;
    }

    return true;
  });

  // Count reports with critical flags
  const criticalCount =
    reports?.filter((r) =>
      r.criticalFlags?.some((f) => f.severity === "high")
    ).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Patient Reports</h1>
        <p className="text-muted-foreground">
          View patient reports with AI summaries and critical flag highlights.
        </p>
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
        <Card className={criticalCount > 0 ? "border-destructive/30 bg-destructive/5" : ""}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${criticalCount > 0 ? "bg-destructive/20" : "bg-muted"}`}>
              <AlertTriangle className={`h-5 w-5 ${criticalCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
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

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={severityFilter}
              onValueChange={(v) => setSeverityFilter(v as FilterSeverity)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Flag Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[200px]" />
          ))}
        </div>
      ) : filteredReports && filteredReports.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <ReportCard
              key={report._id}
              report={report}
              onClick={() => setSelectedReport(report)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-40" />
            <p className="font-medium">No reports found</p>
            <p className="text-sm text-muted-foreground">
              {search || severityFilter !== "all"
                ? "Try adjusting your filters."
                : "Patient reports will appear here."}
            </p>
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

        {!report.aiSummary && !report.criticalFlags?.length && (
          <p className="text-sm text-muted-foreground italic">
            Processing or no analysis available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
