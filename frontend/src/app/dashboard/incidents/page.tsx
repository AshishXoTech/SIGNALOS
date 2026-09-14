"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame, MapPin, Clock, Search, ChevronRight, Filter
} from "lucide-react";
import { HAZARD_TYPES } from "@/lib/constants";
import { formatTimeAgo } from "@/lib/utils";
import { api } from "@/lib/api-client";

const INCIDENTS = [
  {
    id: "INC-1042",
    hazard: "landslide",
    severity: "critical",
    status: "response_active",
    title: "Debris blocking road, vehicle trapped",
    location: "Bridge Road, Munnar",
    team: "SDRF Unit Alpha",
    reports: 4,
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
  },
  {
    id: "INC-1041",
    hazard: "structure_fire",
    severity: "high",
    status: "response_active",
    title: "Commercial building fire, 12 injured",
    location: "NH44, Nagpur",
    team: "Fire Service Bravo",
    reports: 7,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: "INC-1040",
    hazard: "flooding",
    severity: "moderate",
    status: "triaged",
    title: "Rising water levels, 40 households at risk",
    location: "Jorhat Sector 4, Assam",
    team: null,
    reports: 12,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "INC-1039",
    hazard: "building_collapse",
    severity: "catastrophic",
    status: "closure_review",
    title: "3-story structure partial collapse",
    location: "Old Delhi Metro Gate 3",
    team: "NDRF Battalion 6",
    reports: 23,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "INC-1038",
    hazard: "waterlogging",
    severity: "low",
    status: "closed",
    title: "Drainage overflow clear; traffic restored",
    location: "Hindmata Flyover, Mumbai",
    team: "Municipal Team C",
    reports: 3,
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: "INC-1037",
    hazard: "cyclone",
    severity: "high",
    status: "response_active",
    title: "Cyclonic winds damage coastal power corridor",
    location: "Puri Coastal Grid, Odisha",
    team: "Police Rapid Unit",
    reports: 18,
    created_at: new Date(Date.now() - 11 * 3600000).toISOString(),
  },
  {
    id: "INC-1036",
    hazard: "earthquake",
    severity: "critical",
    status: "triaged",
    title: "Structural cracks reported across apartment block",
    location: "Sikkim Market Road, Gangtok",
    team: "NDRF Battalion 2",
    reports: 31,
    created_at: new Date(Date.now() - 15 * 3600000).toISOString(),
  },
  {
    id: "INC-1035",
    hazard: "fire",
    severity: "moderate",
    status: "closed",
    title: "Warehouse smoke incident contained",
    location: "Peenya Industrial Area, Bengaluru",
    team: "Fire Service Echo",
    reports: 9,
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
];

const SEV: Record<string, string> = {
  catastrophic: "bg-red-100 text-red-700 border-red-200",
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  moderate: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  triaged: "Triaged",
  response_active: "Active",
  closure_review: "Closure review",
  closed: "Closed",
  reopened: "Reopened",
};

export default function IncidentsListPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [incidents, setIncidents] = useState(INCIDENTS);

  useEffect(() => {
    api.getIncidents()
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setIncidents((data as Record<string, unknown>[]).map((item) => ({
          id: String(item.id),
          hazard: String(item.disaster_type || "other"),
          severity: String(item.severity || "medium"),
          status: String(item.status || "active"),
          title: String(item.title || "Incident"),
          location: `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`,
          team: null,
          reports: Number(item.report_count || 0),
          created_at: String(item.created_at || item.last_updated || new Date().toISOString()),
        })));
      })
      .catch(() => {});
  }, []);

  const filtered = incidents.filter((i) => {
    if (filter === "active" && i.status === "closed") return false;
    if (filter === "closed" && i.status !== "closed") return false;
    if (filter === "unassigned" && i.team) return false;
    if (
      search &&
      !i.title.toLowerCase().includes(search.toLowerCase()) &&
      !i.location.toLowerCase().includes(search.toLowerCase()) &&
      !i.id.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const icon = (h: string) =>
    HAZARD_TYPES.find((x) => x.value === h)?.icon || "•";

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Active Incidents
          </h1>
          <p className="text-sm font-medium text-slate-500">
            All operational events under management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-56 text-sm bg-white border border-slate-200 rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        {[
          { key: "all", label: "All" },
          { key: "active", label: "Active" },
          { key: "unassigned", label: "Unassigned" },
          { key: "closed", label: "Closed" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === f.key
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-orange-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="card-surface overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-2">ID</div>
          <div className="col-span-4">Incident</div>
          <div className="col-span-2">Severity</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Team</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map((inc) => (
            <Link
              key={inc.id}
              href={`/dashboard/incidents/${inc.id}`}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 px-5 py-4 hover:bg-orange-50/40 transition-colors items-center group"
            >
              <div className="md:col-span-2 flex items-center gap-2">
                <span className="text-base">{icon(inc.hazard)}</span>
                <span className="font-mono text-xs font-bold text-slate-500">
                  {inc.id}
                </span>
              </div>

              <div className="md:col-span-4 min-w-0">
                <div className="text-sm font-bold text-slate-900 group-hover:text-orange-600 truncate">
                  {inc.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{inc.location}</span>
                  <span className="text-slate-300">·</span>
                  <Clock className="w-3 h-3 shrink-0" />
                  <span className="font-mono">{formatTimeAgo(inc.created_at)}</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${SEV[inc.severity]}`}
                >
                  {inc.severity}
                </span>
              </div>

              <div className="md:col-span-2">
                <span className="text-xs font-semibold text-slate-600">
                  {STATUS_LABEL[inc.status] || inc.status}
                </span>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {inc.reports} reports
                </div>
              </div>

              <div className="md:col-span-1 text-xs font-semibold text-slate-700 truncate">
                {inc.team || (
                  <span className="text-amber-600 font-bold">Unassigned</span>
                )}
              </div>

              <div className="md:col-span-1 flex justify-end">
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500" />
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Flame className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-slate-600">No incidents match</p>
          </div>
        )}
      </div>
    </div>
  );
}