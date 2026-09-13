import { cn } from "@/lib/utils";
import { INCIDENT_STATUS_CONFIG } from "@/lib/constants";

interface StatusBadgeProps {
  status: keyof typeof INCIDENT_STATUS_CONFIG;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = INCIDENT_STATUS_CONFIG[status] || INCIDENT_STATUS_CONFIG.new;

  return (
    <span className={cn("text-xs font-medium", config.color)}>
      {config.label}
    </span>
  );
}