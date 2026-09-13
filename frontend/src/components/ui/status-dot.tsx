import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "critical" | "high" | "moderate" | "low" | "info" | "offline";
  pulse?: boolean;
  size?: "sm" | "md";
}

export function StatusDot({ status, pulse = false, size = "sm" }: StatusDotProps) {
  const colors = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    moderate: "bg-amber-500",
    low: "bg-green-500",
    info: "bg-cyan-500",
    offline: "bg-slate-600",
  };

  return (
    <span
      className={cn(
        "inline-block rounded-full shrink-0",
        size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5",
        colors[status],
        pulse && "animate-pulse"
      )}
    />
  );
}