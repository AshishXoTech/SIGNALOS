"use client";

import { useState } from "react";
import {
  Users, MapPin, Radio, Shield, Truck, Heart,
  Search, Filter, Phone, CheckCircle2, Clock,
  AlertTriangle, Navigation
} from "lucide-react";

type TeamStatus = "available" | "deployed" | "returning" | "offline";

interface Team {
  id: string;
  name: string;
  unit: string;
  type: "SDRF" | "NDRF" | "Fire" | "Medical" | "Police";
  status: TeamStatus;
  personnel: number;
  location: string;
  distance?: string;
  capabilities: string[];
  equipment: string[];
  phone: string;
  lastPing: string;
  assignedTo?: string;
}

const TEAMS: Team[] = [
  {
    id: "t1",
    name: "SDRF Unit Alpha",
    unit: "Guwahati Battalion",
    type: "SDRF",
    status: "deployed",
    personnel: 12,
    location: "En route to Munnar Bridge",
    distance: "2.3 km from INC-1042",
    capabilities: ["Landslide", "Flood", "Heavy Rescue"],
    equipment: ["Boats", "Ropes", "Hydraulic Cutters"],
    phone: "+91 98765 00001",
    lastPing: "30s ago",
    assignedTo: "INC-1042",
  },
  {
    id: "t2",
    name: "Fire Service Bravo",
    unit: "Nagpur Station 4",
    type: "Fire",
    status: "deployed",
    personnel: 8,
    location: "NH44 Commercial Belt",
    distance: "On scene",
    capabilities: ["Structure Fire", "Vehicle Fire", "Hazmat"],
    equipment: ["Fire Truck", "Breathing Apparatus", "Ladders"],
    phone: "+91 98765 00002",
    lastPing: "1m ago",
    assignedTo: "INC-1041",
  },
  {
    id: "t3",
    name: "NDRF Battalion 6",
    unit: "National Response Force",
    type: "NDRF",
    status: "available",
    personnel: 45,
    location: "Base Camp — Guwahati",
    capabilities: ["All-Hazard", "K9 Search", "Collapse Rescue"],
    equipment: ["Helicopters", "Sniffer Dogs", "Cranes", "Boats"],
    phone: "+91 98765 00003",
    lastPing: "2m ago",
  },
  {
    id: "t4",
    name: "Medical Response Charlie",
    unit: "Dibrugarh EMS",
    type: "Medical",
    status: "available",
    personnel: 6,
    location: "Dibrugarh Civil Hospital",
    capabilities: ["Trauma", "Mass Casualty", "Evacuation"],
    equipment: ["Ambulances x3", "Stretchers", "Defibrillators"],
    phone: "+91 98765 00004",
    lastPing: "45s ago",
  },
  {
    id: "t5",
    name: "Police Rapid Unit",
    unit: "Assam Police QRT",
    type: "Police",
    status: "returning",
    personnel: 10,
    location: "Returning to HQ",
    capabilities: ["Crowd Control", "Perimeter", "Escort"],
    equipment: ["Patrol Vehicles", "Barricades"],
    phone: "+91 98765 00005",
    lastPing: "3m ago",
    assignedTo: "INC-1038",
  },
  {
    id: "t6",
    name: "SDRF Unit Delta",
    unit: "Jorhat Detachment",
    type: "SDRF",
    status: "available",
    personnel: 14,
    location: "Jorhat Base",
    capabilities: ["Flood", "Waterlogging", "Boat Rescue"],
    equipment: ["Inflatable Boats", "Life Jackets", "Pumps"],
    phone: "+91 98765 00006",
    lastPing: "1m ago",
  },
  {
    id: "t7",
    name: "Fire Service Echo",
    unit: "Delhi Station 12",
    type: "Fire",
    status: "offline",
    personnel: 0,
    location: "Offline — maintenance",
    capabilities: ["Structure Fire"],
    equipment: ["Fire Truck (down)"],
    phone: "+91 98765 00007",
    lastPing: "2h ago",
  },
  {
    id: "t8",
    name: "NDRF Battalion 2",
    unit: "National Response Force",
    type: "NDRF",
    status: "available",
    personnel: 38,
    location: "Standby — Siliguri",
    capabilities: ["Earthquake", "Collapse", "Mountain Rescue"],
    equipment: ["Heavy Machinery", "Medical Tent", "Comms Van"],
    phone: "+91 98765 00008",
    lastPing: "5m ago",
  },
];

const STATUS_CONFIG: Record<TeamStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  available: { label: "Available", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  deployed: { label: "Deployed", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  returning: { label: "Returning", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  offline: { label: "Offline", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200", dot: "bg-slate-400" },
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  SDRF: <Shield className="w-4 h-4" />,
  NDRF: <Shield className="w-4 h-4" />,
  Fire: <Truck className="w-4 h-4" />,
  Medical: <Heart className="w-4 h-4" />,
  Police: <Radio className="w-4 h-4" />,
};

export default function TeamsPage() {
  const [filter, setFilter] = useState<"all" | TeamStatus>("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = TEAMS.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (
      search &&
      !t.name.toLowerCase().includes(search.toLowerCase()) &&
      !t.location.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const counts = {
    all: TEAMS.length,
    available: TEAMS.filter((t) => t.status === "available").length,
    deployed: TEAMS.filter((t) => t.status === "deployed").length,
    returning: TEAMS.filter((t) => t.status === "returning").length,
    offline: TEAMS.filter((t) => t.status === "offline").length,
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Response Teams
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Live availability, location, and capability board
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-56 text-sm bg-white border border-slate-200 rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Status Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {([
          { key: "all" as const, label: "All Units" },
          { key: "available" as const, label: "Available" },
          { key: "deployed" as const, label: "Deployed" },
          { key: "returning" as const, label: "Returning" },
          { key: "offline" as const, label: "Offline" },
        ]).map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`card-surface p-4 text-left transition-all ${
              filter === s.key
                ? "ring-2 ring-orange-500 bg-orange-50/50"
                : "hover:border-orange-300"
            }`}
          >
            <div className="text-2xl font-black text-slate-900 mb-1">
              {counts[s.key]}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {s.label}
            </div>
          </button>
        ))}
      </div>

      {/* Type chips */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        {["all", "SDRF", "NDRF", "Fire", "Medical", "Police"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              typeFilter === t
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-orange-300"
            }`}
          >
            {t === "all" ? "All Types" : t}
          </button>
        ))}
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((team) => {
          const st = STATUS_CONFIG[team.status];
          return (
            <div
              key={team.id}
              className="card-surface p-5 hover:shadow-md hover:border-orange-200 transition-all flex flex-col"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      team.type === "Fire"
                        ? "bg-red-100 text-red-600"
                        : team.type === "Medical"
                        ? "bg-pink-100 text-pink-600"
                        : team.type === "Police"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {TYPE_ICON[team.type]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {team.name}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
                      {team.unit}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${st.bg} ${st.text} ${st.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-start gap-2 text-xs font-medium text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div>{team.location}</div>
                  {team.distance && (
                    <div className="text-orange-600 font-bold mt-0.5 flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> {team.distance}
                    </div>
                  )}
                </div>
              </div>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {team.capabilities.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide"
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* Equipment */}
              <div className="text-[11px] text-slate-500 mb-4 flex-1">
                <span className="font-bold text-slate-400 uppercase tracking-wide">Gear: </span>
                {team.equipment.join(" · ")}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {team.personnel}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" /> {team.lastPing}
                  </span>
                </div>
                {team.assignedTo ? (
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                    {team.assignedTo}
                  </span>
                ) : team.status === "available" ? (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                ) : null}
              </div>

              {/* Call button */}
              <a
                href={`tel:${team.phone}`}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Contact Unit
              </a>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-bold text-slate-600">No teams match filters</p>
        </div>
      )}
    </div>
  );
}