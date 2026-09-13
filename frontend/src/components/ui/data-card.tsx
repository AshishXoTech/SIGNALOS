import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface DataCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function DataCard({ label, value, icon, trend, className }: DataCardProps) {
  return (
    <div className={cn("card-surface p-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="data-label">{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold font-mono text-slate-100">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium mb-1",
              trend.positive ? "text-green-400" : "text-red-400"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}