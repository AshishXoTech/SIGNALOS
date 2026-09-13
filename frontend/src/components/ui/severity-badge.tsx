import { cn } from "@/lib/utils";
import { SEVERITY_CONFIG } from "@/lib/constants";

interface SeverityBadgeProps {
  severity: keyof typeof SEVERITY_CONFIG;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.moderate;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border",
        config.color,
        config.bg,
        config.border
      )}
    >
      <span className={cn("status-dot", config.dot)} />
      {config.label}
    </span>
  );
}