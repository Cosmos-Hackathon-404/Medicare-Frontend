"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  size?: "sm" | "lg";
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  size = "lg",
  action,
}: EmptyStateProps) {
  const iconSize = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const padding = size === "lg" ? "py-12" : "py-8";

  return (
    <div
      className={cn(
        padding,
        "flex flex-col items-center justify-center text-center text-muted-foreground",
        className
      )}
    >
      <div className="animate-empty-bounce">
        <Icon className={cn(iconSize, "mx-auto mb-3 opacity-40")} />
      </div>
      <p className={cn("animate-empty-fade-in", size === "lg" && "font-medium")}>
        {title}
      </p>
      {description && (
        <p className="mt-1 animate-empty-fade-in-delay text-sm">{description}</p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="mt-4 animate-empty-fade-in-delay gap-2"
        >
          {action.icon && <action.icon className="h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
