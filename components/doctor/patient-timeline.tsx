"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Mic,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { Appointment, Session, Report } from "@/types";

type TimelineItemType = "appointment" | "session" | "report";

interface TimelineItem {
  type: TimelineItemType;
  date: Date;
  title: string;
  description?: string;
  status?: string;
  id: string;
}

interface PatientTimelineProps {
  appointments?: Appointment[];
  sessions?: Session[];
  reports?: Report[];
  onItemClick?: (type: TimelineItemType, id: string) => void;
  className?: string;
}

const typeConfig: Record<
  TimelineItemType,
  { icon: typeof Calendar; color: string; bgColor: string }
> = {
  appointment: {
    icon: Calendar,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  session: {
    icon: Mic,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  report: {
    icon: FileText,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
  },
};

export function PatientTimeline({
  appointments = [],
  sessions = [],
  reports = [],
  onItemClick,
  className,
}: PatientTimelineProps) {
  // Build timeline items
  const timelineItems: TimelineItem[] = [
    ...appointments.map((apt) => ({
      type: "appointment" as const,
      date: parseISO(apt.dateTime),
      title: "Appointment",
      description: apt.notes,
      status: apt.status,
      id: apt._id,
    })),
    ...sessions.map((session) => ({
      type: "session" as const,
      date: new Date(session._creationTime),
      title: "Session Recording",
      description: session.transcript
        ? `${session.transcript.substring(0, 100)}...`
        : "Audio recorded",
      id: session._id,
    })),
    ...reports.map((report) => ({
      type: "report" as const,
      date: new Date(report._creationTime),
      title: report.fileName,
      description: report.aiSummary
        ? `${report.aiSummary.substring(0, 100)}...`
        : "Report uploaded",
      id: report._id,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (timelineItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Patient Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="mx-auto mb-3 h-12 w-12 opacity-40" />
            <p>No history available yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Patient Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-0 p-6">
            {timelineItems.map((item, index) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;
              const isLast = index === timelineItems.length - 1;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={cn(
                    "relative flex gap-4 pb-6",
                    onItemClick &&
                      "cursor-pointer transition-colors hover:bg-muted/50 -mx-3 px-3 rounded-lg"
                  )}
                  onClick={() => onItemClick?.(item.type, item.id)}
                >
                  {/* Timeline Line */}
                  {!isLast && (
                    <div className="absolute left-[19px] top-10 h-[calc(100%-24px)] w-px bg-border" />
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      config.bgColor
                    )}
                  >
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium">{item.title}</h4>
                      {item.status && (
                        <Badge
                          variant={
                            item.status === "completed"
                              ? "default"
                              : item.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                          }
                          className="gap-1"
                        >
                          {item.status === "completed" && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {item.status === "cancelled" && (
                            <XCircle className="h-3 w-3" />
                          )}
                          {item.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(item.date, "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    {item.description && (
                      <p className="text-sm text-foreground/80">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
