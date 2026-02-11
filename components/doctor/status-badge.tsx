import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
  info: "bg-blue-50 text-blue-700 border border-blue-200",
  outline: "bg-white text-gray-700 border border-gray-300",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  outline: "bg-gray-500",
};

export function getStatusVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case "scheduled":
    case "confirmed":
    case "completed":
    case "viewed":
    case "active":
    case "normal":
      return "success";
    case "pending":
    case "in-progress":
      return "warning";
    case "cancelled":
    case "overdue":
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "info";
    default:
      return "default";
  }
}

export default function StatusBadge({
  status,
  variant,
  size = "sm",
  dot = false,
}: StatusBadgeProps) {
  const v = variant || getStatusVariant(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium capitalize",
        variantStyles[v],
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", dotStyles[v])}
        />
      )}
      {status}
    </span>
  );
}
