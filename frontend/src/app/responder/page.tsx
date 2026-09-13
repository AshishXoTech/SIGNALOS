"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Navigation, CheckCircle2, MapPin,
  FileText, Phone, Clock, AlertTriangle, ChevronRight,
  Radio, Users, ArrowLeft, Send, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

type Stage =
  | "list"
  | "offered"
  | "accepted"
  | "en_route"
  | "on_scene"
  | "resolving"
  | "submitted";

interface Assignment {
  id: string;
  incidentId: string;
  title: string;
  hazard: string;
  severity: "critical" | "high" | "moderate";
  location: string;
  distance: string;
  description: string;
  accessNote: string;
  reportedAt: string;
  status: Stage;
}

const INITIAL: Assignment[] = [
  {
    id: "asg-1",
    incidentId: "INC-1042",
    title: "Landslide — vehicle trapped",
    hazard: "⛰️ Landslide",
    severity: "critical",
    location: "Bridge Road, Munnar",
    distance: "2.3 km",
    description:
      "Debris blocking primary road. Pickup truck partially buried. Suspected occupants inside. Ongoing rain — secondary slide risk.",
    accessNote: "Use North Bypass. Heavy rainfall. Bridge approach unstable.",
    reportedAt: "18 min ago",
    status: "offered",
  },
  {
    id: "asg-2",
    incidentId: "INC-1040",
    title: "Flooding — residential sector",
    hazard: "🌊 Flooding",
    severity: "moderate",
    location: "Jorhat Sector 4",
    distance: "12 km",
    description:
      "Water levels rising near primary school. ~40 households at risk. Boats may be required.",
    accessNote: "Main road partially waterlogged. Approach from east.",
    reportedAt: "45 min ago",
    status: "offered",
  },
];

const SEV: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  moderate: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function ResponderPage() {
  const [assignments, setAssignments] = useState(INITIAL);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("list");
  const [actions, setActions] = useState("");
  const [people, setPeople] = useState("0");
  const [risks, setRisks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const active = assignments.find((a) => a.id === activeId) || null;

  const open = (a: Assignment) => {
    setActiveId(a.id);
    setStage(a.status === "offered" ? "offered" : a.status);
  };

  const go = (next: Stage, msg?: string) => {
    setStage(next);
    if (activeId) {
      setAssignments((prev) =>
        prev.map((a) => (a.id === activeId ? { ...a, status: next } : a))
      );
    }
    if (msg) toast.success(msg);
  };

  const submitResolution = async () => {
    if (!actions.trim()) {
      toast.error("Describe actions taken");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    go("submitted", "Resolution sent for supervisor review");
  };

  const backToList = () => {
    setActiveId(null);
    setStage("list");
    setActions("");
    setPeople("0");
    setRisks("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto border-x border-slate-200 shadow-2xl">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/25">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">
              SDRF Unit Alpha
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Field workspace
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-700 uppercase">Live</span>
        </div>
      </div>

      {/* Demo strip */}
      <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-[10px] font-medium text-amber-800 text-center">
        DEMO — Not linked to real dispatch. Call 112 in real emergencies.
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ========== LIST ========== */}
          {stage === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-3"
            >
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-lg font-bold text-slate-900">My Assignments</h1>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {assignments.filter((a) => a.status !== "submitted").length} open
                </span>
              </div>

              {assignments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => open(a)}
                  className="w-full text-left card-surface p-4 hover:border-orange-300 hover:shadow-md transition-all active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {a.incidentId}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${SEV[a.severity]}`}
                    >
                      {a.severity}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mb-1">
                    {a.hazard} · {a.title}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {a.location}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Navigation className="w-3 h-3" /> {a.distance}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {a.status === "offered" ? "New offer" : a.status.replace("_", " ")}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </button>
              ))}

              {assignments.every((a) => a.status === "submitted") && (
                <div className="text-center py-16 text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                  <p className="font-bold text-slate-600">All clear</p>
                  <p className="text-sm">No active assignments</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ========== DETAIL / WORKFLOW ========== */}
          {active && stage !== "list" && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="flex flex-col min-h-full"
            >
              {/* Back */}
              <button
                onClick={backToList}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold text-orange-600 hover:text-orange-700"
              >
                <ArrowLeft className="w-4 h-4" /> Assignments
              </button>

              {/* Mission card */}
              <div className="mx-4 mb-4 card-surface overflow-hidden border-l-4 border-l-red-500">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {active.incidentId}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${SEV[active.severity]}`}
                    >
                      {active.severity}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mb-1">
                    {active.hazard}
                  </h2>
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    {active.title}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {active.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {active.location}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Navigation className="w-3.5 h-3.5" /> {active.distance}
                    </span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900">
                    <span className="font-bold">Access: </span>
                    {active.accessNote}
                  </div>
                </div>
              </div>

              {/* Progress steps */}
              <div className="px-4 mb-4">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">
                  {["Offer", "Accept", "En route", "On scene", "Done"].map((l, i) => {
                    const order = ["offered", "accepted", "en_route", "on_scene", "submitted"];
                    const idx = order.indexOf(stage === "resolving" ? "on_scene" : stage);
                    const done = i <= idx;
                    return (
                      <span key={l} className={done ? "text-orange-600" : ""}>
                        {l}
                      </span>
                    );
                  })}
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-500"
                    style={{
                      width:
                        stage === "offered"
                          ? "10%"
                          : stage === "accepted"
                          ? "30%"
                          : stage === "en_route"
                          ? "50%"
                          : stage === "on_scene" || stage === "resolving"
                          ? "75%"
                          : "100%",
                    }}
                  />
                </div>
              </div>

              {/* Actions panel */}
              <div className="mx-4 mb-6 card-surface p-4 space-y-3">
                {stage === "offered" && (
                  <>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      New assignment
                    </p>
                    <button
                      onClick={() => go("accepted", "Assignment accepted")}
                      className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Accept assignment
                    </button>
                    <button
                      onClick={() => {
                        toast("Declined — control room notified");
                        backToList();
                      }}
                      className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm"
                    >
                      Cannot respond
                    </button>
                  </>
                )}

                {stage === "accepted" && (
                  <>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Ready to move
                    </p>
                    <button
                      onClick={() => go("en_route", "En route to scene")}
                      className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Navigation className="w-5 h-5" /> Depart — En route
                    </button>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(active.location)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" /> Open navigation
                    </a>
                  </>
                )}

                {stage === "en_route" && (
                  <>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Traveling to scene
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 font-medium">
                      <Radio className="w-4 h-4 animate-pulse" />
                      HQ tracking your unit
                    </div>
                    <button
                      onClick={() => go("on_scene", "Marked on scene")}
                      className="w-full py-3.5 bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <MapPin className="w-5 h-5" /> Arrived on scene
                    </button>
                  </>
                )}

                {stage === "on_scene" && (
                  <>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      On scene
                    </p>
                    <button
                      onClick={() => go("resolving")}
                      className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                      <FileText className="w-5 h-5" /> File resolution report
                    </button>
                    <button
                      onClick={() => toast.success("Backup request sent to HQ")}
                      className="w-full py-3 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" /> Request backup
                    </button>
                  </>
                )}

                {stage === "resolving" && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Resolution report
                    </p>
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        Actions taken *
                      </label>
                      <textarea
                        value={actions}
                        onChange={(e) => setActions(e.target.value)}
                        rows={3}
                        placeholder="Evacuated occupants, cleared debris path, secured perimeter..."
                        className="w-full p-3 text-sm rounded-xl border border-slate-200 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        People assisted
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={people}
                        onChange={(e) => setPeople(e.target.value)}
                        className="w-full p-3 text-sm rounded-xl border border-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1 block">
                        Remaining risks
                      </label>
                      <textarea
                        value={risks}
                        onChange={(e) => setRisks(e.target.value)}
                        rows={2}
                        placeholder="Road still blocked; secondary slide possible..."
                        className="w-full p-3 text-sm rounded-xl border border-slate-200 resize-none"
                      />
                    </div>
                    <button
                      onClick={submitResolution}
                      disabled={submitting}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" /> Submit to supervisor
                        </>
                      )}
                    </button>
                  </div>
                )}

                {stage === "submitted" && (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      Report submitted
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Awaiting supervisor closure review
                    </p>
                    <button
                      onClick={backToList}
                      className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl"
                    >
                      Back to assignments
                    </button>
                  </div>
                )}
              </div>

              {/* Quick contacts */}
              {stage !== "submitted" && stage !== "resolving" && (
                <div className="px-4 pb-8 flex gap-2">
                  <a
                    href="tel:+910000000002"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call HQ
                  </a>
                  <button
                    onClick={() => toast.success("Status ping sent")}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <Users className="w-3.5 h-3.5" /> Ping team
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}