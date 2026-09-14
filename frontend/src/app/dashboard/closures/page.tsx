"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, Check, X, Clock, MapPin, User,
  FileText, AlertTriangle, MessageSquare,
  ShieldCheck, Users
} from "lucide-react";
import toast from "react-hot-toast";
import { formatTimeAgo } from "@/lib/utils";

type ReviewStatus = "pending" | "approved" | "rejected" | "needs_info";

interface ClosureRequest {
  id: string;
  incidentId: string;
  incidentTitle: string;
  hazard: string;
  severity: string;
  location: string;
  teamName: string;
  submittedBy: string;
  submittedAt: string;
  actionsTaken: string;
  peopleAssisted: number;
  remainingRisks: string;
  status: ReviewStatus;
}

const INITIAL: ClosureRequest[] = [
  {
    id: "cl-01",
    incidentId: "INC-1042",
    incidentTitle: "Debris blocking road, vehicle trapped",
    hazard: "⛰️ Landslide",
    severity: "critical",
    location: "Bridge Road, Munnar",
    teamName: "SDRF Unit Alpha",
    submittedBy: "Responder Amit",
    submittedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    actionsTaken:
      "Evacuated 2 occupants from partially buried pickup. Cleared pedestrian path on north shoulder. Established 50m exclusion zone. Coordinated with local PWD for heavy machinery.",
    peopleAssisted: 2,
    remainingRisks:
      "Primary carriageway still blocked. Secondary slide risk while rain continues. Road closed pending earthmovers (ETA 3 hrs).",
    status: "pending",
  },
  {
    id: "cl-02",
    incidentId: "INC-1041",
    incidentTitle: "Commercial building fire, 12 injured",
    hazard: "🔥 Structure Fire",
    severity: "high",
    location: "NH44, Nagpur",
    teamName: "Fire Service Bravo",
    submittedBy: "Station Officer Mehta",
    submittedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    actionsTaken:
      "Fire knocked down on floors 1–2. 12 civilians treated on scene; 3 transported to Civil Hospital. Building ventilated. Electrical isolation confirmed with utility.",
    peopleAssisted: 12,
    remainingRisks:
      "Structural integrity of east wing unverified. Overnight fire watch recommended. Arson investigation pending.",
    status: "pending",
  },
  {
    id: "cl-03",
    incidentId: "INC-1038",
    incidentTitle: "Drainage overflow, traffic restored",
    hazard: "💧 Waterlogging",
    severity: "low",
    location: "Hindmata Flyover, Mumbai",
    teamName: "Municipal Team C",
    submittedBy: "Supervisor Naik",
    submittedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    actionsTaken:
      "Pumps deployed; water cleared in 90 minutes. Debris removed from drains. Traffic fully restored. Local ward office notified for long-term drain desilt.",
    peopleAssisted: 0,
    remainingRisks: "None immediate. Monitor if heavy rain returns tonight.",
    status: "approved",
  },
  {
    id: "cl-04",
    incidentId: "INC-1035",
    incidentTitle: "Warehouse smoke incident contained",
    hazard: "🔥 Industrial Fire",
    severity: "moderate",
    location: "Peenya Industrial Area, Bengaluru",
    teamName: "Hazmat Support Hotel",
    submittedBy: "Station Officer Rao",
    submittedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    actionsTaken:
      "Isolated the electrical panel, completed thermal sweep, ventilated the shed, and confirmed no trapped civilians or secondary ignition points.",
    peopleAssisted: 6,
    remainingRisks: "Minor smoke damage only. Facility manager instructed to maintain a fire watch overnight.",
    status: "approved",
  },
  {
    id: "cl-05",
    incidentId: "INC-1037",
    incidentTitle: "Cyclonic winds damage coastal power corridor",
    hazard: "🌀 Cyclone",
    severity: "high",
    location: "Puri Coastal Grid, Odisha",
    teamName: "Coastal Response Foxtrot",
    submittedBy: "Team Lead Das",
    submittedAt: new Date(Date.now() - 42 * 60000).toISOString(),
    actionsTaken:
      "Evacuated 14 residents from the exposed lane and cordoned off three fallen power poles while the utility crew secured the feeder.",
    peopleAssisted: 14,
    remainingRisks: "Power restoration pending. Two roads remain restricted until debris clearance is complete.",
    status: "needs_info",
  },
  {
    id: "cl-06",
    incidentId: "INC-1036",
    incidentTitle: "Structural cracks reported across apartment block",
    hazard: "🏚️ Earthquake",
    severity: "critical",
    location: "Sikkim Market Road, Gangtok",
    teamName: "Urban Search Golf",
    submittedBy: "Responder Tashi",
    submittedAt: new Date(Date.now() - 18 * 60000).toISOString(),
    actionsTaken:
      "Completed a rapid structural assessment, evacuated the affected wing, and placed temporary shoring at the north stairwell.",
    peopleAssisted: 42,
    remainingRisks: "Detailed engineering inspection required before residents can return.",
    status: "pending",
  },
];

const STATUS_STYLE: Record<ReviewStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  needs_info: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function ClosuresPage() {
  const [items, setItems] = useState(INITIAL);
  const [filter, setFilter] = useState<"all" | ReviewStatus>("pending");
  const [selected, setSelected] = useState<ClosureRequest | null>(null);
  const [notes, setNotes] = useState("");

  const filtered = items.filter((i) =>
    filter === "all" ? true : i.status === filter
  );

  const decide = (id: string, status: ReviewStatus) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
    const labels = {
      approved: "Closure approved — incident sealed",
      rejected: "Closure rejected — returned to active response",
      needs_info: "More information requested from team",
      pending: "",
    };
    toast.success(labels[status]);
    setSelected(null);
    setNotes("");
  };

  const counts = {
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
    needs_info: items.filter((i) => i.status === "needs_info").length,
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto h-[calc(100vh-0px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Closure Review
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Supervisor approval required before an incident is sealed
          </p>
        </div>

        <div className="flex p-1 bg-slate-100 border border-slate-200 rounded-lg">
          {([
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
            ["all", "All"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                filter === key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
              {key === "pending" && counts.pending > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px]">
                  {counts.pending}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3 mb-6 shrink-0">
        {[
          { l: "Awaiting review", v: counts.pending, c: "text-amber-600" },
          { l: "Approved today", v: counts.approved, c: "text-emerald-600" },
          { l: "Rejected", v: counts.rejected, c: "text-red-600" },
          { l: "Needs info", v: counts.needs_info, c: "text-blue-600" },
        ].map((k) => (
          <div key={k.l} className="card-surface p-4">
            <div className={`text-2xl font-black ${k.c}`}>{k.v}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              {k.l}
            </div>
          </div>
        ))}
      </div>

      {/* Main split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
        {/* List */}
        <div className="lg:col-span-2 overflow-y-auto space-y-3 pr-1 pb-8">
          <AnimatePresence>
            {filtered.map((item) => (
              <motion.button
                layout
                key={item.id}
                onClick={() => {
                  setSelected(item);
                  setNotes("");
                }}
                className={`w-full text-left card-surface p-4 transition-all ${
                  selected?.id === item.id
                    ? "ring-2 ring-orange-500 bg-orange-50/40"
                    : "hover:border-orange-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {item.incidentId}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLE[item.status]}`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 mb-1">
                  {item.hazard} · {item.incidentTitle}
                </div>
                <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {item.location}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    {item.teamName}
                  </span>
                  <span className="font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(item.submittedAt)}
                  </span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-bold text-slate-600">No closures in this view</p>
            </div>
          )}
        </div>

        {/* Inspector */}
        <div className="lg:col-span-3 min-h-0">
          <div className="card-surface h-full flex flex-col overflow-hidden">
            {selected ? (
              <>
                <div className="p-5 border-b border-slate-100 bg-slate-50/60 shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    <ShieldCheck className="w-4 h-4 text-orange-500" />
                    Supervisor review
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">
                    {selected.hazard}
                  </h2>
                  <p className="text-sm font-medium text-slate-600">
                    {selected.incidentTitle}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs font-semibold text-slate-500">
                    <span className="font-mono">{selected.incidentId}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {selected.submittedBy}
                    </span>
                    <span>•</span>
                    <span>{selected.teamName}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Actions taken */}
                  <div>
                    <label className="data-label flex items-center gap-1.5 mb-2">
                      <FileText className="w-3.5 h-3.5" /> Actions taken
                    </label>
                    <p className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 leading-relaxed">
                      {selected.actionsTaken}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-emerald-700 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wide">
                          People assisted
                        </span>
                      </div>
                      <div className="text-3xl font-black text-emerald-800">
                        {selected.peopleAssisted}
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wide">
                          Location
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {selected.location}
                      </div>
                    </div>
                  </div>

                  {/* Remaining risks */}
                  <div>
                    <label className="data-label flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />{" "}
                      Remaining risks
                    </label>
                    <p className="text-sm font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-4 leading-relaxed">
                      {selected.remainingRisks || "None reported"}
                    </p>
                  </div>

                  {/* Supervisor notes */}
                  {selected.status === "pending" && (
                    <div>
                      <label className="data-label flex items-center gap-1.5 mb-2">
                        <MessageSquare className="w-3.5 h-3.5" /> Your notes
                        (optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Reason for decision, follow-up instructions..."
                        className="w-full p-3 text-sm rounded-xl border border-slate-200 resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Decision bar */}
                {selected.status === "pending" ? (
                  <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => decide(selected.id, "approved")}
                        className="flex items-center justify-center gap-1.5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-emerald-500/20 active:scale-[0.98] transition-all"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => decide(selected.id, "needs_info")}
                        className="flex items-center justify-center gap-1.5 py-3 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
                      >
                        <MessageSquare className="w-4 h-4" /> Need info
                      </button>
                      <button
                        onClick={() => decide(selected.id, "rejected")}
                        className="flex items-center justify-center gap-1.5 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
                      Approve seals the incident · Reject returns it to active response
                    </p>
                  </div>
                ) : (
                  <div className="p-4 border-t border-slate-200 bg-slate-50 text-center shrink-0">
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${STATUS_STYLE[selected.status]}`}
                    >
                      Decision: {selected.status.replace("_", " ")}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                <ClipboardCheck className="w-12 h-12 mb-3 text-slate-300" />
                <p className="font-bold text-slate-600 mb-1">Select a closure request</p>
                <p className="text-sm font-medium max-w-xs">
                  Review field reports, people assisted, and remaining risks before sealing an incident.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
