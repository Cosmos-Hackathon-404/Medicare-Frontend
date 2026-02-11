import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  badge,
}: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-6 lg:px-8 py-5">
        {backHref && (
          <Link
            href={backHref}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 mb-2"
          >
            ← {backLabel || "Back"}
          </Link>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
            {badge}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
