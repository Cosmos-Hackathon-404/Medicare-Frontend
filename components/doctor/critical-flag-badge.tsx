"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CriticalFlag, FlagSeverity } from "@/types";

interface CriticalFlagBadgeProps {
  flag: CriticalFlag;
  showDetails?: boolean;
  className?: string;
}

const severityConfig: Record<
  FlagSeverity,
  {
    icon: typeof AlertTriangle;
    variant: "destructive" | "default" | "secondary";
    bgClass: string;
    textClass: string;
  }
> = {
  high: {
    icon: AlertTriangle,
    variant: "destructive",
    bgClass: "bg-destructive/10 border-destructive/30",
    textClass: "text-destructive",
  },
  medium: {
    icon: AlertCircle,
    variant: "default",
    bgClass: "bg-orange-500/10 border-orange-500/30",
    textClass: "text-orange-600 dark:text-orange-400",
  },
  low: {
    icon: Info,
    variant: "secondary",
    bgClass: "bg-blue-500/10 border-blue-500/30",
    textClass: "text-blue-600 dark:text-blue-400",
  },
};

export function CriticalFlagBadge({
  flag,
  showDetails = false,
  className,
}: CriticalFlagBadgeProps) {
  const config = severityConfig[flag.severity];
  const Icon = config.icon;

  const badge = (
    <Badge
      variant={config.variant}
      className={cn(
        "cursor-default gap-1.5 font-medium",
        showDetails && "flex-shrink-0",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {flag.issue}
    </Badge>
  );

  if (showDetails) {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 rounded-lg border p-3",
          config.bgClass
        )}
      >
        {badge}
        <p className="text-sm text-foreground/80">{flag.details}</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className={cn("flex items-center gap-1 font-medium", config.textClass)}>
              <Icon className="h-3.5 w-3.5" />
              {flag.severity.charAt(0).toUpperCase() + flag.severity.slice(1)} Priority
            </div>
            <p className="text-sm">{flag.details}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CriticalFlagsListProps {
  flags: CriticalFlag[];
  expanded?: boolean;
  className?: string;
}

export function CriticalFlagsList({
  flags,
  expanded = false,
  className,
}: CriticalFlagsListProps) {
  if (!flags || flags.length === 0) {
    return null;
  }

  // Sort by severity: high > medium > low
  const sortedFlags = [...flags].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  if (expanded) {
    return (
      <div className={cn("space-y-2", className)}>
        {sortedFlags.map((flag, i) => (
          <CriticalFlagBadge key={i} flag={flag} showDetails />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {sortedFlags.map((flag, i) => (
        <CriticalFlagBadge key={i} flag={flag} />
      ))}
    </div>
  );
}
