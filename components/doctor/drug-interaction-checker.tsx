"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Pill,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface DrugAlert {
  type: "allergy" | "interaction" | "contraindication" | "dosage";
  severity: "critical" | "warning" | "info";
  medication: string;
  message: string;
  details: string;
}

interface DrugInteractionResult {
  safe: boolean;
  alerts: DrugAlert[];
  checkedAt: string;
}

interface DrugInteractionCheckerProps {
  patientClerkId: string;
  prescriptions: Prescription[];
  className?: string;
}

export function DrugInteractionChecker({
  patientClerkId,
  prescriptions,
  className,
}: DrugInteractionCheckerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<DrugInteractionResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const checkDrugInteractions = useAction(
    api.actions.checkDrugInteractions.checkDrugInteractions
  );

  const handleCheck = async () => {
    if (!patientClerkId || prescriptions.length === 0) return;

    setIsChecking(true);
    try {
      const checkResult = await checkDrugInteractions({
        patientClerkId,
        prescriptions: prescriptions.map((p) => ({
          medication: p.medication || "",
          dosage: p.dosage || "",
          frequency: p.frequency || "",
          duration: p.duration || "",
          instructions: p.instructions || "",
        })),
      });
      setResult(checkResult);
      if (!checkResult.safe) {
        setShowDetails(true);
      }
    } catch (error) {
      console.error("Drug interaction check failed:", error);
    } finally {
      setIsChecking(false);
    }
  };

  if (prescriptions.length === 0) return null;

  const criticalAlerts =
    result?.alerts.filter((a) => a.severity === "critical") ?? [];
  const warningAlerts =
    result?.alerts.filter((a) => a.severity === "warning") ?? [];
  const infoAlerts =
    result?.alerts.filter((a) => a.severity === "info") ?? [];

  return (
    <>
      <Card
        className={cn(
          "transition-all",
          result && !result.safe && "border-destructive/50 bg-destructive/5",
          result && result.safe && "border-green-500/50 bg-green-500/5",
          className
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {result ? (
                result.safe ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                    <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20 animate-pulse">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                  </div>
                )
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Pill className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium text-sm">
                  {result
                    ? result.safe
                      ? "Drug Safety Check Passed"
                      : `${result.alerts.length} Safety Alert${result.alerts.length !== 1 ? "s" : ""} Found`
                    : "Drug Interaction & Allergy Check"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {result
                    ? `Checked ${prescriptions.length} prescription${prescriptions.length !== 1 ? "s" : ""} against patient allergies & history`
                    : `${prescriptions.length} prescription${prescriptions.length !== 1 ? "s" : ""} ready to check`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {result && !result.safe && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowDetails(true)}
                  className="gap-1"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  View Alerts
                </Button>
              )}
              <Button
                size="sm"
                variant={result ? "outline" : "default"}
                onClick={handleCheck}
                disabled={isChecking}
                className="gap-1"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Checking...
                  </>
                ) : result ? (
                  "Re-check"
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Run Safety Check
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Inline critical alerts preview */}
          {result && criticalAlerts.length > 0 && (
            <div className="mt-3 space-y-2">
              {criticalAlerts.slice(0, 2).map((alert, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2"
                >
                  <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      {alert.medication}: {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Alerts Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Drug Safety Alerts
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {/* Critical */}
              {criticalAlerts.length > 0 && (
                <AlertSection
                  title="Critical"
                  alerts={criticalAlerts}
                  variant="critical"
                />
              )}

              {/* Warnings */}
              {warningAlerts.length > 0 && (
                <AlertSection
                  title="Warnings"
                  alerts={warningAlerts}
                  variant="warning"
                />
              )}

              {/* Info */}
              {infoAlerts.length > 0 && (
                <AlertSection
                  title="Information"
                  alerts={infoAlerts}
                  variant="info"
                />
              )}

              {result?.safe && (
                <div className="flex flex-col items-center py-6 text-center">
                  <ShieldCheck className="mb-3 h-12 w-12 text-green-500" />
                  <p className="font-medium text-green-700 dark:text-green-400">
                    All Clear
                  </p>
                  <p className="text-sm text-muted-foreground">
                    No drug interactions or allergy conflicts detected.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AlertSection({
  title,
  alerts,
  variant,
}: {
  title: string;
  alerts: DrugAlert[];
  variant: "critical" | "warning" | "info";
}) {
  const colorMap = {
    critical: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      icon: "text-red-600 dark:text-red-400",
      badge: "bg-red-500 text-white",
      text: "text-red-700 dark:text-red-300",
    },
    warning: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      icon: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-500 text-white",
      text: "text-amber-700 dark:text-amber-300",
    },
    info: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      icon: "text-blue-600 dark:text-blue-400",
      badge: "bg-blue-500 text-white",
      text: "text-blue-700 dark:text-blue-300",
    },
  };

  const colors = colorMap[variant];
  const Icon =
    variant === "critical"
      ? AlertOctagon
      : variant === "warning"
        ? AlertTriangle
        : Info;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className={cn("h-4 w-4", colors.icon)} />
        <span className={cn("text-sm font-semibold", colors.text)}>
          {title} ({alerts.length})
        </span>
      </div>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <AlertItem key={i} alert={alert} colors={colors} />
        ))}
      </div>
    </div>
  );
}

function AlertItem({
  alert,
  colors,
}: {
  alert: DrugAlert;
  colors: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);

  const typeLabel = {
    allergy: "Allergy Conflict",
    interaction: "Drug Interaction",
    contraindication: "Contraindication",
    dosage: "Dosage Concern",
  }[alert.type];

  return (
    <div className={cn("rounded-lg border p-3", colors.bg, colors.border)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 font-normal"
            >
              {typeLabel}
            </Badge>
            <span className="font-medium text-sm">{alert.medication}</span>
          </div>
          <p className="text-sm">{alert.message}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 shrink-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      {expanded && (
        <p className="mt-2 text-sm text-muted-foreground border-t pt-2">
          {alert.details}
        </p>
      )}
    </div>
  );
}
