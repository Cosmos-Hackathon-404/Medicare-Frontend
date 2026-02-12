"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Mic, FileText, Calendar, User, Search, Filter } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import Link from "next/link";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";

type FilterStatus = "all" | "has-summary" | "transcribed" | "no-recording";
type FilterTime = "all" | "7days" | "30days" | "90days";

export default function DoctorSessionsPage() {
  const { user } = useUser();
  const doctorClerkId = user?.id ?? "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [timeFilter, setTimeFilter] = useState<FilterTime>("all");

  const sessions = useQuery(
    api.queries.sessions.getByDoctor,
    doctorClerkId ? { doctorClerkId } : "skip"
  );

  const isLoading = !sessions;

  // Filter sessions
  const filteredSessions = sessions
    ?.filter((session) => {
      // Status filter
      if (statusFilter === "has-summary" && !session.aiSummary) return false;
      if (statusFilter === "transcribed" && !session.transcript) return false;
      if (statusFilter === "no-recording" && (session.transcript || session.aiSummary)) return false;

      // Time filter
      if (timeFilter !== "all") {
        const daysMap = { "7days": 7, "30days": 30, "90days": 90 };
        const cutoff = subDays(new Date(), daysMap[timeFilter]);
        if (!isAfter(new Date(session._creationTime), cutoff)) return false;
      }

      // Search by patient name
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesName = session.patientName?.toLowerCase().includes(searchLower);
        const matchesSummary = session.aiSummary?.toLowerCase().includes(searchLower);
        const matchesTranscript = session.transcript?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesSummary && !matchesTranscript) return false;
      }

      return true;
    })
    .sort((a, b) => b._creationTime - a._creationTime);

  const summaryCount = sessions?.filter((s) => s.aiSummary).length ?? 0;
  const transcribedCount = sessions?.filter((s) => s.transcript).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
        <p className="text-muted-foreground">
          View all past consultation sessions and AI-generated summaries.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          icon={Mic}
          title="Total Sessions"
          value={sessions?.length ?? 0}
          isLoading={isLoading}
        />
        <StatsCard
          icon={FileText}
          title="AI Summaries"
          value={summaryCount}
          variant="green"
          isLoading={isLoading}
        />
        <StatsCard
          icon={Calendar}
          title="Transcribed"
          value={transcribedCount}
          variant="blue"
          isLoading={isLoading}
        />
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
                placeholder="Search by patient, summary, or transcript..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as FilterStatus)}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="has-summary">Has AI Summary</SelectItem>
                <SelectItem value="transcribed">Transcribed</SelectItem>
                <SelectItem value="no-recording">No Recording</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={timeFilter}
              onValueChange={(v) => setTimeFilter(v as FilterTime)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="No sessions yet"
          description="Sessions will appear here after recording a consultation."
        />
      ) : filteredSessions && filteredSessions.length > 0 ? (
        <div className="space-y-4">
          {filteredSessions
            .map((session) => (
              <Card key={session._id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {session.patientName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(session._creationTime), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.aiSummary ? (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Summary Ready
                        </Badge>
                      ) : session.transcript ? (
                        <Badge variant="outline" className="gap-1">
                          Transcribed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          No Recording
                        </Badge>
                      )}
                    </div>
                  </div>

                  {session.aiSummary && (
                    <div className="mt-3 rounded-lg bg-muted/50 p-3">
                      <p className="text-sm line-clamp-2">
                        {(() => {
                          try {
                            const parsed = JSON.parse(session.aiSummary);
                            return parsed.diagnosis || parsed.chiefComplaint || parsed.chief_complaint || session.aiSummary;
                          } catch {
                            return session.aiSummary;
                          }
                        })()}
                      </p>
                    </div>
                  )}

                  <div className="mt-3">
                    <Link
                      href={`/doctor/session/${session.appointmentId}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Full Session →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No sessions match your filters"
          description="Try adjusting your search or filters."
        />
      )}
    </div>
  );
}
