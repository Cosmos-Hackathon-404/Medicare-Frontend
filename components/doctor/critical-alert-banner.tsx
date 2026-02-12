"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertOctagon,
  Bell,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AlertData {
  _id: string;
  _creationTime: number;
  patientClerkId: string;
  doctorClerkId: string;
  patientName: string;
  reportId?: string;
  sessionId?: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  acknowledgedAt?: string;
}

interface CriticalAlertBannerProps {
  doctorClerkId: string;
  className?: string;
}

export function CriticalAlertBanner({
  doctorClerkId,
  className,
}: CriticalAlertBannerProps) {
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const activeAlerts = useQuery(
    api.queries.criticalAlerts.getActiveForDoctor,
    doctorClerkId ? { doctorClerkId } : "skip"
  );

  const acknowledgeAlert = useMutation(
    api.mutations.criticalAlerts.acknowledge
  );
  const resolveAlert = useMutation(api.mutations.criticalAlerts.resolve);

  if (!activeAlerts || activeAlerts.length === 0) return null;

  const criticalCount = activeAlerts.filter(
    (a: AlertData) => a.severity === "critical"
  ).length;
  const urgentCount = activeAlerts.filter(
    (a: AlertData) => a.severity === "urgent"
  ).length;

  return (
    <>
      {/* Persistent Alert Banner */}
      <Card
        className={cn(
          "border-destructive/50 bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent animate-in fade-in slide-in-from-top-2",
          className
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20 animate-pulse">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-destructive flex items-center gap-2">
                  {activeAlerts.length} Critical Alert
                  {activeAlerts.length !== 1 ? "s" : ""}
                  {criticalCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {criticalCount} critical
                    </Badge>
                  )}
                  {urgentCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs border-amber-500 dark:border-amber-600 text-amber-600 dark:text-amber-400"
                    >
                      {urgentCount} urgent
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {activeAlerts[0].title} — {activeAlerts[0].patientName}
                  {activeAlerts.length > 1 &&
                    ` and ${activeAlerts.length - 1} more`}
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowAllAlerts(true)}
              className="gap-1 shrink-0"
            >
              <Bell className="h-3.5 w-3.5" />
              Review Alerts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* All Alerts Dialog */}
      <Dialog open={showAllAlerts} onOpenChange={setShowAllAlerts}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Critical Alerts ({activeAlerts.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-3">
              {activeAlerts.map((alert: AlertData) => (
                <AlertCard
                  key={alert._id}
                  alert={alert}
                  onAcknowledge={async () => {
                    try {
                      await acknowledgeAlert({
                        alertId: alert._id as Id<"criticalAlerts">,
                      });
                      toast.success("Alert acknowledged");
                    } catch {
                      toast.error("Failed to acknowledge alert");
                    }
                  }}
                  onResolve={async () => {
                    try {
                      await resolveAlert({
                        alertId: alert._id as Id<"criticalAlerts">,
                      });
                      toast.success("Alert resolved");
                    } catch {
                      toast.error("Failed to resolve alert");
                    }
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
}: {
  alert: {
    _id: string;
    _creationTime: number;
    patientName: string;
    title: string;
    message: string;
    severity: string;
    type: string;
    status: string;
    reportId?: string;
    sessionId?: string;
  };
  onAcknowledge: () => Promise<void>;
  onResolve: () => Promise<void>;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const severityConfig = {
    critical: {
      bg: "bg-red-500/10 border-red-500/30",
      icon: "text-red-600 dark:text-red-400",
      badge: "destructive" as const,
    },
    urgent: {
      bg: "bg-amber-500/10 border-amber-500/30",
      icon: "text-amber-600 dark:text-amber-400",
      badge: "outline" as const,
    },
    warning: {
      bg: "bg-yellow-500/10 border-yellow-500/30",
      icon: "text-yellow-600 dark:text-yellow-400",
      badge: "secondary" as const,
    },
  };

  const config =
    severityConfig[alert.severity as keyof typeof severityConfig] ??
    severityConfig.warning;

  const typeLabel = {
    report_critical_flag: "Report Finding",
    vitals_abnormal: "Abnormal Vitals",
    drug_interaction: "Drug Interaction",
  }[alert.type] ?? alert.type;

  return (
    <div className={cn("rounded-lg border p-4", config.bg)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <AlertOctagon className={cn("h-5 w-5 mt-0.5 shrink-0", config.icon)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={config.badge} className="text-xs">
                {alert.severity}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {typeLabel}
              </Badge>
            </div>
            <p className="font-semibold text-sm">{alert.title}</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{alert.patientName}</span>
              <span className="mx-1">·</span>
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(alert._creationTime), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
              {alert.message}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 ml-8">
        <Button
          size="sm"
          variant="outline"
          className="gap-1 h-7 text-xs"
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true);
            await onAcknowledge();
            setIsLoading(false);
          }}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3 w-3" />
          )}
          Acknowledge
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1 h-7 text-xs"
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true);
            await onResolve();
            setIsLoading(false);
          }}
        >
          <X className="h-3 w-3" />
          Resolve
        </Button>
      </div>
    </div>
  );
}
