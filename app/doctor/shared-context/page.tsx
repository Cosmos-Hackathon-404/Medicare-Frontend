"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
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
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { SharedContext, Session, Report } from "@/types";

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
              <Clock className={`h-5 w-5 ${pendingCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
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
                              ? "text-orange-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">Patient Context</p>
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
            <div className="py-12 text-center text-muted-foreground">
              <Inbox className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p className="font-medium">No shared contexts yet</p>
              <p className="text-sm">
                Patient contexts shared with you will appear here.
              </p>
            </div>
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
                  Patient Medical Context
                </DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="summary" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">AI Summary</TabsTrigger>
                  <TabsTrigger value="sessions">
                    Sessions ({selectedContext.sessionIds.length})
                  </TabsTrigger>
                  <TabsTrigger value="reports">
                    Reports ({selectedContext.reportIds.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    {selectedContext.aiConsolidatedSummary ? (
                      <div className="space-y-4 rounded-lg bg-muted/30 p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {selectedContext.aiConsolidatedSummary}
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
                      {selectedContext.sessionIds.length > 0 ? (
                        selectedContext.sessionIds.map((sessionId, i) => (
                          <div
                            key={sessionId}
                            className="rounded-lg border p-4"
                          >
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mic className="h-4 w-4" />
                              Session #{i + 1}
                            </div>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                              ID: {sessionId}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          <Mic className="mx-auto mb-3 h-10 w-10 opacity-40" />
                          <p>No sessions included.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="reports" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3 p-1">
                      {selectedContext.reportIds.length > 0 ? (
                        selectedContext.reportIds.map((reportId, i) => (
                          <div key={reportId} className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              Report #{i + 1}
                            </div>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                              ID: {reportId}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
                          <p>No reports included.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
