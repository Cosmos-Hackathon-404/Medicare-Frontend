"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatsCardVariant = "default" | "blue" | "green" | "red" | "orange" | "purple";

const variantStyles: Record<StatsCardVariant, { icon: string; bg: string; card?: string }> = {
  default: {
    icon: "text-primary",
    bg: "bg-primary/10",
  },
  blue: {
    icon: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  green: {
    icon: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
  },
  red: {
    icon: "text-destructive",
    bg: "bg-destructive/10",
  },
  orange: {
    icon: "text-orange-500",
    bg: "bg-orange-500/20",
    card: "border-orange-500/30 bg-orange-500/5",
  },
  purple: {
    icon: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
  },
};

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value?: number | string;
  description?: string;
  isLoading?: boolean;
  variant?: StatsCardVariant;
  highlight?: boolean;
  className?: string;
}

export function StatsCard({
  icon: Icon,
  title,
  value,
  description,
  isLoading,
  variant = "default",
  highlight,
  className,
}: StatsCardProps) {
  const style = variantStyles[highlight ? "orange" : variant];

  return (
    <Card className={cn(style.card, className)}>
      <CardContent className="flex items-center gap-4 p-4 sm:p-6">
        <div
          className={cn(
            "flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg transition-colors",
            style.bg
          )}
        >
          <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", style.icon)} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          {isLoading || value === undefined ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p className="text-xl sm:text-2xl font-bold">{value}</p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
