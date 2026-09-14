"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Flame, FileText, Users, CheckCircle2, MapPin,
  Activity, ArrowUpRight, ChevronRight, Loader2, Radio,
  BellRing, Languages, Route, ShieldCheck, Landmark, Database,
} from "lucide-react";
import { SignalLogo } from "@/components/brand/SignalLogo";
import { HAZARD_TYPES } from "@/lib/constants";
import { liveGet } from "@/lib/live";

const LiveMap = dynamic(
  () => import("@/components/map/LiveMap").then((m) => m.LiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] w-full rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    ),
  }
);

type IncidentRow = {
  id: string;
  hazard: string;
  severity: string;
  status: string;
  title: string;
  location: string;
  team: string | null;
  lat: number;
  lng: number;
};

const FALLBACK_INCIDENTS: IncidentRow[] = [
  {
    id: "INC-1042",
    hazard: "landslide",
    severity: "critical",
    status: "Active",
    title: "Debris blocking road, vehicle trapped",
    location: "Bridge Road, Munnar",
    team: "SDRF Unit Alpha",
    lat: 10.0889,
    lng: 77.0595,
  },
  {
    id: "INC-1041",
    hazard: "structure_fire",
    severity: "high",
    status: "Active",
    title: "Commercial building fire, 12 injured",
    location: "NH44, Nagpur",
    team: "Fire Unit Bravo",
    lat: 21.1458,
    lng: 79.0882,
  },
  {
    id: "INC-1040",
    hazard: "flooding",
    severity: "moderate",
    status: "Triaged",
    title: "Rising water levels, 40 households at risk",
    location: "Jorhat Sector 4, Assam",
    team: null,
    lat: 26.7509,
    lng: 94.2166,
  },
  {
    id: "INC-1039",
    hazard: "building_collapse",
    severity: "catastrophic",
    status: "Review",
    title: "3-story structure partial collapse",
    location: "Old Delhi Metro Gate 3",
    team: "NDRF Battalion 6",
    lat: 28.6562,
    lng: 77.2410,
  },
  {
    id: "INC-1037",
    hazard: "cyclone",
    severity: "high",
    status: "Active",
    title: "Cyclonic winds damage coastal power corridor",
    location: "Puri Coastal Grid, Odisha",
    team: "Coastal Response Foxtrot",
    lat: 19.8135,
    lng: 85.8312,
  },
  {
    id: "INC-1036",
    hazard: "earthquake",
    severity: "critical",
    status: "Triaged",
    title: "Structural cracks reported across apartment block",
    location: "Sikkim Market Road, Gangtok",
    team: "Urban Search Golf",
    lat: 27.3314,
    lng: 88.6138,
  },
];

const FALLBACK_REPORTS = [
  { id: "REP-992", hazard: "landslide", place: "Munnar Bridge", ago: "2m", state: "Unreviewed" },
  { id: "REP-991", hazard: "flooding", place: "Jorhat Village", ago: "5m", state: "Unreviewed" },
  { id: "REP-990", hazard: "road_accident", place: "Guwahati Bypass", ago: "8m", state: "Needs review" },
  { id: "REP-989", hazard: "cyclone", place: "Puri Coastal School", ago: "12m", state: "Needs review" },
  { id: "REP-988", hazard: "earthquake", place: "MG Marg, Gangtok", ago: "18m", state: "Unreviewed" },
  { id: "REP-987", hazard: "fire", place: "Peenya Industrial Area", ago: "31m", state: "Confirmed" },
];

const sevStyle: Record<string, string> = {
  catastrophic: "bg-red-100 text-red-700 border-red-200",
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  moderate: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const NATIONAL_CAPABILITIES = [
  {
    title: "Citizen-to-command signal",
    copy: "Geo-tagged reports move from citizen intake to command review with severity, location, and media context ready for triage.",
    metric: "Report → triage",
    icon: FileText,
    tone: "text-orange-700 bg-orange-50 border-orange-200",
  },
  {
    title: "Multi-hazard early warning",
    copy: "Designed around flood, fire, earthquake, landslide, cyclone, and other hazard workflows so teams see a unified risk picture.",
    metric: "All-hazard grid",
    icon: BellRing,
    tone: "text-blue-700 bg-blue-50 border-blue-200",
  },
  {
    title: "Geo-targeted dispatch",
    copy: "Incidents appear on the operational map with nearby assignments, team status, and field navigation context for faster routing.",
    metric: "Map-led routing",
    icon: Route,
    tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  {
    title: "Multilingual public reach",
    copy: "Built to support India-scale communication patterns where warnings and updates must reach citizens in their language and locality.",
    metric: "Local-first",
    icon: Languages,
    tone: "text-indigo-700 bg-indigo-50 border-indigo-200",
  },
];

const GOVERNMENT_BRIEF = [
  "Control-room situation awareness for district, state, and national command teams.",
  "Resource mobilization view for SDRF, NDRF, fire, police, medical, and local administration.",
  "Supervisor closure review so every incident has accountability before it is sealed.",
  "Audit-ready operating picture for preparedness, response, mitigation, and post-incident learning.",
];

export default function DashboardPage() {
  const router = useRouter();
  const [now, setNow] = useState("");
  const [incidents, setIncidents] = useState<IncidentRow[]>(FALLBACK_INCIDENTS);
  const [reports, setReports] = useState(FALLBACK_REPORTS);
  const [liveMode, setLiveMode] = useState<"demo" | "live" | "checking">("checking");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLiveMode("checking");
      // Health check
      const health = await liveGet<{ status?: string }>("/api/health", { status: "down" });
      if (cancelled) return;

      if (health?.status === "healthy" || health?.status === "ok") {
        setLiveMode("live");
        const remote = await liveGet<unknown>("/api/incidents", null);
        // If shape unexpected, keep fallback — hackathon safe
        if (remote && Array.isArray(remote) && remote.length > 0) {
          // map loosely if backend returns list
          try {
            const mapped = (remote as Record<string, unknown>[]).slice(0, 8).map((r, i) => ({
              id: String(r.id || `INC-${i}`),
              hazard: String(r.disaster_type || r.hazard_type || r.hazard || "other"),
              severity: String(r.severity || "moderate"),
              status: String(r.status || "active"),
              title: String(r.title || r.summary || "Incident"),
              location: String(r.location_description || r.location || `${Number(r.latitude || r.lat || 0).toFixed(4)}, ${Number(r.longitude || r.lng || 0).toFixed(4)}`),
              team: (r.assigned_team_name as string) || null,
              lat: Number(r.latitude || r.lat || 26.14),
              lng: Number(r.longitude || r.lng || 91.73),
            }));
            setIncidents(mapped);
          } catch {
            /* keep fallback */
          }
        }
      } else {
        setLiveMode("demo");
        setIncidents(FALLBACK_INCIDENTS);
        setReports(FALLBACK_REPORTS);
      }
      setMapReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const markers = useMemo(
    () =>
      incidents.map((i) => ({
        id: i.id,
        latitude: i.lat,
        longitude: i.lng,
        title: `${i.id} · ${i.title}`,
        severity: (["critical", "high", "moderate", "low", "catastrophic"].includes(i.severity)
          ? i.severity
          : "moderate") as "critical" | "high" | "moderate" | "low" | "catastrophic",
        type: "incident" as const,
      })),
    [incidents]
  );

  const center = useMemo<[number, number]>(() => {
    if (!incidents.length) return [91.7362, 26.1445];
    const lat = incidents.reduce((s, i) => s + i.lat, 0) / incidents.length;
    const lng = incidents.reduce((s, i) => s + i.lng, 0) / incidents.length;
    return [lng, lat];
  }, [incidents]);

  const icon = (h: string) => HAZARD_TYPES.find((x) => x.value === h)?.icon || "•";

  return (
    <div className="relative p-4 md:p-8 max-w-[1480px] mx-auto">
      <div className="pointer-events-none absolute inset-x-4 top-4 h-44 rounded-[2rem] bg-[linear-gradient(105deg,rgba(255,103,31,0.16),rgba(255,255,255,0.72)_38%,rgba(4,106,56,0.14))] blur-3xl" />

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] mb-6">
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,#ff671f_0_33%,#ffffff_33%_66%,#046a38_66%_100%)]" />
        <div className="absolute right-8 top-9 hidden h-28 w-28 rounded-full border-[10px] border-blue-900/5 lg:block" />
        <div className="absolute right-16 top-16 hidden h-14 w-14 rounded-full border border-blue-900/10 lg:block" />
        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-5 p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <SignalLogo className="h-16 w-16 rounded-2xl" />
              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-700">
                  Bharat Command Grid
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                  Rashtriya Suraksha
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
                National Command Overview
              </h1>
              <p className="mt-1 text-sm md:text-base font-semibold text-slate-500">
                Signal OS Bharat emergency response desk · live operational status · {now}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mission</div>
              <div className="text-sm font-black text-slate-900">Zero Lives Lost</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Emergency</div>
              <div className="text-sm font-black text-orange-600">Dial 112</div>
            </div>
          </div>
        </div>
        <div className="relative flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-950 px-5 py-3 md:px-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-bold text-white uppercase tracking-wide">
              System online
            </span>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border text-xs font-bold uppercase tracking-wide ${
              liveMode === "live"
                ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-200"
                : liveMode === "checking"
                ? "bg-slate-400/10 border-slate-400/30 text-slate-200"
                : "bg-orange-400/10 border-orange-400/30 text-orange-200"
            }`}
          >
            {liveMode === "checking" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Radio className="w-3.5 h-3.5" />
            )}
            {liveMode === "live" ? "API live" : liveMode === "checking" ? "Checking API" : "Demo data"}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-400/10 border border-orange-400/30 rounded-full shadow-sm">
            <Activity className="w-3.5 h-3.5 text-orange-300 animate-pulse" />
            <span className="text-xs font-bold text-orange-100 uppercase tracking-wide">
              Live feed
            </span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { l: "Active incidents", v: String(incidents.filter((i) => i.status !== "Closed" && i.status !== "closed").length), c: "text-orange-600", b: "bg-orange-600", bg: "from-orange-100 to-white", i: Flame },
          { l: "Reports today", v: "147", c: "text-blue-700", b: "bg-blue-700", bg: "from-blue-100 to-white", i: FileText },
          { l: "Teams deployed", v: "8", c: "text-indigo-700", b: "bg-indigo-700", bg: "from-indigo-100 to-white", i: Users },
          { l: "Resolved", v: "12", c: "text-emerald-700", b: "bg-emerald-700", bg: "from-emerald-100 to-white", i: CheckCircle2 },
        ].map((k) => (
          <div key={k.l} className={`command-card relative overflow-hidden p-4 md:p-5 bg-gradient-to-br ${k.bg}`}>
            <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full border border-white/80" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                {k.l}
              </span>
              <div className={`p-2 rounded-xl bg-white shadow-sm ${k.c}`}>
                <k.i className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-900">{k.v}</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/80">
              <div className={`h-full rounded-full ${k.b} w-2/3`} />
            </div>
          </div>
        ))}
      </div>

      {/* National mission layer */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.9fr] gap-6 mb-6">
        <div className="command-card overflow-hidden">
          <div className="section-command-header px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-200">India Security Upgrade</p>
            <h2 className="mt-1 text-xl font-black text-white">From public signal to coordinated rescue</h2>
            <p className="mt-1 max-w-3xl text-xs md:text-sm font-medium text-slate-300">
              Signal OS turns citizen reports, field movement, and command decisions into one operational picture for faster, calmer disaster response.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-white/85">
            {NATIONAL_CAPABILITIES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${item.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                      {item.metric}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{item.copy}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="command-card overflow-hidden">
          <div className="h-1.5 bg-[linear-gradient(90deg,#ff671f_0_33%,#ffffff_33%_66%,#046a38_66%_100%)]" />
          <div className="p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/20">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-600">Government Briefing</p>
                <h2 className="text-lg font-black text-slate-950">Why this matters for Bharat</h2>
              </div>
            </div>
            <div className="space-y-3">
              {GOVERNMENT_BRIEF.map((point) => (
                <div key={point} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-xs font-semibold leading-relaxed text-slate-600">{point}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <Database className="mb-2 h-4 w-4 text-blue-700" />
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Evidence</div>
                <div className="text-sm font-black text-slate-900">Decision log</div>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <ShieldCheck className="mb-2 h-4 w-4 text-emerald-700" />
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Trust</div>
                <div className="text-sm font-black text-slate-900">Verified flow</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAP */}
      <div className="command-card command-panel overflow-hidden mb-6">
        <div className="section-command-header px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-[0.14em]">Bharat Operational Map</h2>
            <p className="text-[11px] text-slate-300 font-medium">
              Incident pins across India · command routing · click pin for label
            </p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase text-white font-mono">
            {markers.length} markers
          </span>
        </div>
        <div className="p-2 md:p-3">
          {mapReady ? (
            <LiveMap
              markers={markers}
              center={center}
              zoom={5}
              className="h-[300px] md:h-[380px] w-full rounded-xl border border-slate-200 overflow-hidden shadow-inner"
              onMarkerClick={(id) => {
                router.push(`/dashboard/incidents/${id}`);
              }}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents */}
        <div className="lg:col-span-2 command-card command-panel overflow-hidden">
          <div className="section-command-header px-5 py-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-200">National Response Queue</p>
              <h2 className="font-black text-white">Priority incidents</h2>
            </div>
            <Link href="/dashboard/incidents" className="text-xs font-black text-orange-200 hover:text-white">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-100 bg-white/80">
            {incidents.map((inc) => (
              <Link
                key={inc.id}
                href={`/dashboard/incidents/${inc.id}`}
                className="relative p-4 md:p-5 hover:bg-orange-50/70 transition-colors flex items-center justify-between group block overflow-hidden"
              >
                <span className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-[linear-gradient(180deg,#ff671f,#ffffff,#046a38)] opacity-80" />
                <span className="absolute right-8 top-1/2 hidden h-12 w-12 -translate-y-1/2 rounded-full border-4 border-blue-900/5 md:block" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-base shadow-sm ring-4 ring-slate-50">{icon(inc.hazard)}</span>
                    <span className="font-mono text-xs font-bold text-slate-500">{inc.id}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${sevStyle[inc.severity] || sevStyle.moderate}`}>
                      {inc.severity}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-orange-600 truncate">
                    {inc.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{inc.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.18em]">Team</div>
                    <div className="text-xs font-bold text-slate-800">{inc.team || "Unassigned"}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Reports */}
        <div className="command-card command-panel overflow-hidden">
          <div className="section-command-header px-5 py-4 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Citizen Signals</p>
              <h2 className="font-black text-white">Live reports</h2>
            </div>
            <Link href="/dashboard/reports" className="text-xs font-black text-orange-200 hover:text-white">
              Triage →
            </Link>
          </div>
          <div className="divide-y divide-slate-100 bg-white/80">
            {reports.map((r) => (
              <div key={r.id} className="relative p-4 hover:bg-emerald-50/60 overflow-hidden">
                <span className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-emerald-600/70" />
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {icon(r.hazard)} {r.id}
                  </span>
                  <span className="text-xs font-medium text-slate-400">{r.ago}</span>
                </div>
                <p className="text-sm font-bold text-slate-700 mb-2">{r.place}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {r.state}
                  </span>
                  <Link
                    href="/dashboard/reports"
                    className="text-xs font-bold text-orange-600 inline-flex items-center gap-0.5"
                  >
                    Review <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
