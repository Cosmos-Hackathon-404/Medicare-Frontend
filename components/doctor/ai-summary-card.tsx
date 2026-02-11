"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Brain, Pill, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AISummary {
  chiefComplaint?: string;
  diagnosis?: string;
  prescriptions?: string;
  followUpActions?: string[];
  keyDecisions?: string[];
  comparisonWithPrevious?: string;
}

interface AISummaryCardProps {
  summary?: AISummary | string;
  isLoading?: boolean;
  className?: string;
}

export function AISummaryCard({
  summary,
  isLoading,
  className,
}: AISummaryCardProps) {
  // Handle string summary (raw AI output)
  const parsedSummary: AISummary | null =
    typeof summary === "string"
      ? (() => {
          try {
            return JSON.parse(summary);
          } catch {
            return { chiefComplaint: summary };
          }
        })()
      : summary ?? null;

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            AI Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!parsedSummary) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">
            <Brain className="h-5 w-5" />
            AI Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <FileText className="mb-3 h-12 w-12 opacity-40" />
            <p>No summary available yet.</p>
            <p className="text-sm">
              Record and process the session to generate an AI summary.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          AI Session Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Chief Complaint */}
        {parsedSummary.chiefComplaint && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Chief Complaint
            </div>
            <p className="text-foreground">{parsedSummary.chiefComplaint}</p>
          </div>
        )}

        {/* Diagnosis */}
        {parsedSummary.diagnosis && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              Diagnosis
            </div>
            <p className="text-foreground">{parsedSummary.diagnosis}</p>
          </div>
        )}

        <Separator />

        {/* Prescriptions */}
        {parsedSummary.prescriptions && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Pill className="h-4 w-4" />
              Prescriptions
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="whitespace-pre-wrap font-mono text-sm">
                {parsedSummary.prescriptions}
              </p>
            </div>
          </div>
        )}

        {/* Key Decisions */}
        {parsedSummary.keyDecisions && parsedSummary.keyDecisions.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Key Decisions
            </div>
            <ul className="space-y-2">
              {parsedSummary.keyDecisions.map((decision, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className="mt-0.5 h-5 w-5 shrink-0 rounded-full p-0 text-center text-xs"
                  >
                    {i + 1}
                  </Badge>
                  <span className="text-sm">{decision}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-up Actions */}
        {parsedSummary.followUpActions &&
          parsedSummary.followUpActions.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium text-muted-foreground">
                Follow-up Actions
              </div>
              <div className="flex flex-wrap gap-2">
                {parsedSummary.followUpActions.map((action, i) => (
                  <Badge key={i} variant="secondary">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {/* Comparison with Previous */}
        {parsedSummary.comparisonWithPrevious && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="mb-2 text-sm font-medium text-primary">
              Changes from Previous Visit
            </div>
            <p className="text-sm">{parsedSummary.comparisonWithPrevious}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
