import { AlertTriangle } from "lucide-react";
import { DEMO_NOTICE } from "@/lib/constants";

export function DemoBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2 text-xs text-amber-400">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      <span>{DEMO_NOTICE}</span>
    </div>
  );
}