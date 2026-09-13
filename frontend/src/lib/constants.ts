export const HAZARD_TYPES = [
  { value: "road_accident", label: "Accident", icon: "🚌", color: "bg-orange-500" },
  { value: "vehicle_fire", label: "Vehicle Fire", icon: "🔥", color: "bg-red-500" },
  { value: "structure_fire", label: "Building Fire", icon: "🏠", color: "bg-red-600" },
  { value: "building_damage", label: "Building Damage", icon: "🏚️", color: "bg-amber-600" },
  { value: "building_collapse", label: "Collapse", icon: "💥", color: "bg-red-700" },
  { value: "landslide", label: "Landslide", icon: "⛰️", color: "bg-yellow-700" },
  { value: "flooding", label: "Flooding", icon: "🌊", color: "bg-blue-500" },
  { value: "flash_flood", label: "Flash Flood", icon: "🌊", color: "bg-blue-600" },
  { value: "waterlogging", label: "Waterlogging", icon: "💧", color: "bg-cyan-500" },
  { value: "heavy_rainfall", label: "Heavy Rain", icon: "🌧️", color: "bg-slate-500" },
  { value: "felt_shaking", label: "Felt Shaking", icon: "📳", color: "bg-purple-500" },
  { value: "cyclone", label: "Cyclone", icon: "🌀", color: "bg-indigo-500" },
  { value: "chemical_spill", label: "Chemical Spill", icon: "☣️", color: "bg-lime-600" },
  { value: "gas_leak", label: "Gas Leak", icon: "💨", color: "bg-teal-500" },
  { value: "stampede", label: "Stampede", icon: "🏃", color: "bg-pink-500" },
  { value: "other", label: "Other", icon: "❓", color: "bg-slate-600" },
] as const;

export const SEVERITY_CONFIG = {
  catastrophic: { label: "Catastrophic", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", dot: "status-dot-critical" },
  critical: { label: "Critical", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", dot: "status-dot-critical" },
  high: { label: "High", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", dot: "status-dot-high" },
  moderate: { label: "Moderate", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", dot: "status-dot-moderate" },
  low: { label: "Low", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", dot: "status-dot-low" },
} as const;

export const INCIDENT_STATUS_CONFIG = {
  new: { label: "New", color: "text-blue-400" },
  triaged: { label: "Triaged", color: "text-cyan-400" },
  response_active: { label: "Active", color: "text-amber-400" },
  closure_review: { label: "Review", color: "text-purple-400" },
  closed: { label: "Closed", color: "text-green-400" },
  reopened: { label: "Reopened", color: "text-red-400" },
} as const;

export const ASSIGNMENT_STATUS_CONFIG = {
  offered: { label: "Offered", color: "text-blue-400", bg: "bg-blue-500/10" },
  accepted: { label: "Accepted", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  declined: { label: "Declined", color: "text-slate-400", bg: "bg-slate-500/10" },
  en_route: { label: "En Route", color: "text-amber-400", bg: "bg-amber-500/10" },
  on_scene: { label: "On Scene", color: "text-orange-400", bg: "bg-orange-500/10" },
  completed: { label: "Completed", color: "text-green-400", bg: "bg-green-500/10" },
  cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-500/10" },
} as const;

export const DEMO_NOTICE = "DEMONSTRATION SYSTEM — Not connected to real emergency dispatch. For a real emergency, call 112.";