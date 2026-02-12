"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Inbox,
  Eye,
  FileText,
  Mic,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Pill,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { SharedContext } from "@/types";

// Sub-component that fetches and displays session/report details
function SharedContextDetail({ context }: { context: SharedContext }) {
  const sessionDetails = useQuery(
    api.queries.sessions.getByIds,
    context.sessionIds.length > 0
      ? { sessionIds: context.sessionIds as Id<"sessions">[] }
      : "skip"
  );
  const reportDetails = useQuery(
    api.queries.reports.getByIds,
    context.reportIds.length > 0
      ? { reportIds: context.reportIds as Id<"reports">[] }
      : "skip"
  );

  return (
    <Tabs defaultValue="summary" className="mt-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="summary">AI Summary</TabsTrigger>
        <TabsTrigger value="sessions">
          Sessions ({context.sessionIds.length})
        </TabsTrigger>
        <TabsTrigger value="reports">
          Reports ({context.reportIds.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="mt-4">
        <ScrollArea className="h-[400px]">
          {context.aiConsolidatedSummary ? (
            <div className="space-y-4 rounded-lg bg-muted/30 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {context.aiConsolidatedSummary}
              </p>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p>No AI summary available yet.</p>
            </div>
          )}
        </ScrollArea>
      </TabsContent>

      <TabsContent value="sessions" className="mt-4">
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 p-1">
            {context.sessionIds.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Mic className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>No sessions included.</p>
              </div>
            ) : !sessionDetails ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              sessionDetails.map((session, i) => {
                if (!session) return null;
                let parsed: { chiefComplaint?: string; diagnosis?: string; chief_complaint?: string } | null = null;
                if (session.aiSummary) {
                  try { parsed = JSON.parse(session.aiSummary); } catch { /* ignore */ }
                }
                const summary = parsed?.chiefComplaint ?? parsed?.chief_complaint ?? parsed?.diagnosis ?? session.aiSummary;
                return (
                  <div key={session._id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Mic className="h-4 w-4 text-primary" />
                        Session #{i + 1}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(session._creationTime), "MMM d, yyyy")}
                      </span>
                    </div>
                    {summary && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {summary}
                      </p>
                    )}
                    {session.prescriptions && (
                      <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                        <Pill className="h-3 w-3" />
                        Rx: {session.prescriptions}
                      </div>
                    )}
                    {session.keyDecisions && session.keyDecisions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {session.keyDecisions.map((d, j) => (
                          <Badge key={j} variant="outline" className="text-xs">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="reports" className="mt-4">
        <ScrollArea className="h-[400px]">
          <div className="space-y-3 p-1">
            {context.reportIds.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p>No reports included.</p>
              </div>
            ) : !reportDetails ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              reportDetails.map((report, i) => {
                if (!report) return null;
                return (
                <div key={report._id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-primary" />
                      {report.fileName}
                    </div>
                    <Badge variant="outline" className="text-xs uppercase">
                      {report.fileType}
                    </Badge>
                  </div>
                  {report.aiSummary && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {report.aiSummary}
                    </p>
                  )}
                  {report.criticalFlags && report.criticalFlags.length > 0 && (
                    <div className="space-y-1">
                      {report.criticalFlags.map((flag, j) => (
                        <div key={j} className="flex items-center gap-1 text-xs">
                          <AlertTriangle className={`h-3 w-3 ${
                            flag.severity === "high" ? "text-red-600 dark:text-red-400" : flag.severity === "medium" ? "text-orange-600 dark:text-orange-400" : "text-yellow-600 dark:text-yellow-400"
                          }`} />
                          <span className="font-medium">{flag.issue}</span>
                          <span className="text-muted-foreground">({flag.severity})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

export default function SharedContextPage() {
  const { user } = useUser();
  const doctorClerkId = user?.id ?? "";

  const [selectedContext, setSelectedContext] = useState<SharedContext | null>(
    null
  );

  // Queries
  const sharedContexts = useQuery(
    api.queries.sharedContexts.getForDoctor,
    doctorClerkId ? { doctorClerkId } : "skip"
  );

  // Resolve names
  const allPatients = useQuery(api.queries.patients.getAll);
  const allDoctors = useQuery(api.queries.doctors.getAll);

  const patientNameMap = new Map(
    allPatients?.map((p) => [p.clerkUserId, p.name]) ?? []
  );
  const doctorNameMap = new Map(
    allDoctors?.map((d) => [d.clerkUserId, d.name]) ?? []
  );

  // Mutations
  const markViewed = useMutation(api.mutations.sharedContexts.markViewed);

  const isLoading = !sharedContexts;

  const pendingCount =
    sharedContexts?.filter((ctx) => ctx.status === "pending").length ?? 0;
  const viewedCount =
    sharedContexts?.filter((ctx) => ctx.status === "viewed").length ?? 0;

  const handleViewContext = async (context: SharedContext) => {
    setSelectedContext(context);
    if (context.status === "pending") {
      try {
        await markViewed({
          sharedContextId: context._id as Id<"sharedContexts">,
        });
        toast.success("Marked as viewed");
      } catch (error) {
        console.error("Failed to mark as viewed:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Shared Context Inbox
        </h1>
        <p className="text-muted-foreground">
          View medical context shared by patients from other doctors.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Inbox className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Received</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold">
                  {sharedContexts?.length ?? 0}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className={pendingCount > 0 ? "border-orange-500/30 bg-orange-500/5" : ""}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${pendingCount > 0 ? "bg-orange-500/20" : "bg-muted"}`}>
              <Clock className={`h-5 w-5 ${pendingCount > 0 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold">{pendingCount}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reviewed</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-8" />
              ) : (
                <p className="text-xl font-bold">{viewedCount}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Context List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Inbox className="h-5 w-5 text-primary" />
            Shared Contexts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : sharedContexts && sharedContexts.length > 0 ? (
            <div className="space-y-3">
              {sharedContexts
                .sort((a, b) => b._creationTime - a._creationTime)
                .map((context) => (
                  <div
                    key={context._id}
                    className={`flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                      context.status === "pending"
                        ? "border-orange-500/30 bg-orange-500/5"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          context.status === "pending"
                            ? "bg-orange-500/20"
                            : "bg-muted"
                        }`}
                      >
                        <User
                          className={`h-5 w-5 ${
                            context.status === "pending"
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {patientNameMap.get(context.patientClerkId) ?? "Patient"}
                          </p>
                          <Badge
                            variant={
                              context.status === "pending"
                                ? "default"
                                : "secondary"
                            }
                            className="gap-1"
                          >
                            {context.status === "pending" ? (
                              <Clock className="h-3 w-3" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            {context.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          From Dr. {doctorNameMap.get(context.fromDoctorClerkId) ?? "Unknown"}
                          {" · "}
                          {format(
                            new Date(context._creationTime),
                            "MMMM d, yyyy"
                          )}
                          {" · "}
                          {context.sessionIds.length} session(s),{" "}
                          {context.reportIds.length} report(s)
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleViewContext(context)}
                      variant={
                        context.status === "pending" ? "default" : "outline"
                      }
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                ))}
            </div>
          ) : (
            <EmptyState
              icon={Inbox}
              title="No shared contexts yet"
              description="Patient contexts shared with you will appear here."
            />
          )}
        </CardContent>
      </Card>

      {/* Context Detail Dialog */}
      <Dialog
        open={!!selectedContext}
        onOpenChange={(open) => !open && setSelectedContext(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh]">
          {selectedContext && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {patientNameMap.get(selectedContext.patientClerkId) ?? "Patient"} — Medical Context
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Shared by Dr. {doctorNameMap.get(selectedContext.fromDoctorClerkId) ?? "Unknown"}
                </p>
              </DialogHeader>
              <SharedContextDetail context={selectedContext} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
