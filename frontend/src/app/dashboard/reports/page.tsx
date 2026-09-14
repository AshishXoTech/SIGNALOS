"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, Clock, MapPin,
  Search, Eye, Phone, ShieldAlert
} from "lucide-react";
import { HAZARD_TYPES } from "@/lib/constants";
import { formatTimeAgo } from "@/lib/utils";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";

interface DemoReport {
  id: string;
  ref: string;
  hazard: string;
  description: string;
  landmark: string;
  lat: number;
  lng: number;
  received_at: string;
  review: "unreviewed" | "needs_review" | "confirmed" | "disputed";
  contact: string | null;
  audio_url?: string | null;
}

const INITIAL_REPORTS: DemoReport[] = [
  {
    id: "rep-101",
    ref: "SG-9012",
    hazard: "landslide",
    description: "Heavy mud and boulders slid onto Bridge Road. A pickup truck appears partially submerged under debris.",
    landmark: "Near Old Munnar Bridge",
    lat: 10.0889,
    lng: 77.0595,
    received_at: new Date(Date.now() - 4 * 60000).toISOString(),
    review: "unreviewed",
    contact: "+91 98470 11223",
  },
  {
    id: "rep-102",
    ref: "SG-9011",
    hazard: "flooding",
    description: "River water overflowed embankment. Sector 4 main street has ~3 feet standing water entering houses.",
    landmark: "Jorhat Sector 4 Primary School",
    lat: 26.7509,
    lng: 94.2166,
    received_at: new Date(Date.now() - 11 * 60000).toISOString(),
    review: "unreviewed",
    contact: null,
  },
  {
    id: "rep-103",
    ref: "SG-9010",
    hazard: "structure_fire",
    description: "Thick black smoke coming from 2nd floor warehouse. Flames visible from window.",
    landmark: "NH44 Commercial Complex",
    lat: 21.1458,
    lng: 79.0882,
    received_at: new Date(Date.now() - 25 * 60000).toISOString(),
    review: "needs_review",
    contact: "+91 91234 56789",
    audio_url: null,
  },
  {
    id: "rep-104",
    ref: "SG-9009",
    hazard: "cyclone",
    description: "Roof sheets have fallen near the coastal school after severe wind gusts. Children have been moved indoors.",
    landmark: "Puri Coastal School",
    lat: 19.8135,
    lng: 85.8312,
    received_at: new Date(Date.now() - 38 * 60000).toISOString(),
    review: "needs_review",
    contact: "+91 90000 10004",
  },
  {
    id: "rep-105",
    ref: "SG-9008",
    hazard: "earthquake",
    description: "Multiple residents report fresh cracks in load-bearing walls after tremors. No injuries confirmed.",
    landmark: "MG Marg, Gangtok",
    lat: 27.3314,
    lng: 88.6138,
    received_at: new Date(Date.now() - 52 * 60000).toISOString(),
    review: "unreviewed",
    contact: "+91 90000 10005",
  },
  {
    id: "rep-106",
    ref: "SG-9007",
    hazard: "fire",
    description: "Smoke has stopped and fire crews report the industrial shed is safe for re-entry.",
    landmark: "Peenya Industrial Area",
    lat: 13.0324,
    lng: 77.5199,
    received_at: new Date(Date.now() - 95 * 60000).toISOString(),
    review: "confirmed",
    contact: null,
    audio_url: null,
  },
];

export default function ReportsQueuePage() {
  const [reports, setReports] = useState<DemoReport[]>(INITIAL_REPORTS);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [selected, setSelected] = useState<DemoReport | null>(null);

  useEffect(() => {
    api.getReports()
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setReports((data as Record<string, unknown>[]).map((item) => ({
          id: String(item.id),
          ref: `SG-${String(item.id).slice(0, 8).toUpperCase()}`,
          hazard: String(item.disaster_type || "other"),
          description: String(item.description || ""),
          landmark: String(item.address_text || `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`),
          lat: Number(item.latitude),
          lng: Number(item.longitude),
          received_at: String(item.reported_at || item.created_at || new Date().toISOString()),
          review: item.status === "verified"
            ? "confirmed"
            : item.status === "rejected"
            ? "disputed"
            : "unreviewed",
          contact: null,
          audio_url: typeof item.audio_url === "string" ? item.audio_url : null,
        })));
      })
      .catch(() => {});
  }, []);

  const handleReview = (id: string, status: DemoReport["review"]) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, review: status } : r))
    );
    toast.success(`Report ${id} marked as ${status}`);
    setSelected(null);
  };

  const filtered = reports.filter((r) => {
    if (filter !== "all" && r.review !== filter) return false;
    if (
      search &&
      !r.description.toLowerCase().includes(search.toLowerCase()) &&
      !r.landmark.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const icon = (type: string) => HAZARD_TYPES.find((h) => h.value === type)?.icon || "⚠️";

  return (
    <div className="p-8 max-w-[1400px] mx-auto h-[calc(100vh-36px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Report Triage
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Verify raw citizen observations before dispatching teams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-64 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div className="flex p-1 bg-slate-100 border border-slate-200 rounded-lg shadow-inner">
            {["all", "unreviewed", "needs_review"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-bold capitalize rounded-md transition-all ${
                  filter === f
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        
        {/* Left: Report List */}
        <div className="col-span-2 overflow-y-auto pr-2 space-y-3 pb-8">
          <AnimatePresence>
            {filtered.map((r) => (
              <motion.div
                layout
                key={r.id}
                onClick={() => setSelected(r)}
                className={`card-surface p-5 cursor-pointer transition-all ${
                  selected?.id === r.id
                    ? "ring-2 ring-orange-500 bg-orange-50/50"
                    : "hover:border-orange-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl drop-shadow-sm">{icon(r.hazard)}</span>
                    <div>
                      <div className="font-mono text-xs font-bold text-slate-400 mb-0.5">{r.ref}</div>
                      <div className="text-sm font-bold text-slate-800 capitalize">
                        {r.hazard.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                      r.review === "unreviewed"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : r.review === "needs_review"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {r.review.replace("_", " ")}
                  </span>
                </div>

                <p className="text-sm text-slate-600 font-medium line-clamp-2 mb-4">
                  &quot;{r.description}&quot;
                </p>

                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                    <MapPin className="w-3.5 h-3.5" /> {r.landmark}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                    <Clock className="w-3.5 h-3.5" /> {formatTimeAgo(r.received_at)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-slate-500 font-medium">
              No reports match your filters.
            </div>
          )}
        </div>

        {/* Right: Inspector Panel */}
        <div className="h-full">
          <div className="card-surface h-full flex flex-col bg-white overflow-hidden shadow-sm">
            {selected ? (
              <>
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    <ShieldAlert className="w-4 h-4 text-orange-500" />
                    Inspector Panel
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 capitalize flex items-center gap-2">
                    {icon(selected.hazard)} {selected.hazard.replace("_", " ")}
                  </h2>
                  <div className="font-mono text-sm font-semibold text-slate-500 mt-1">
                    {selected.ref}
                  </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                  <div>
                    <label className="data-label block mb-2">Citizen Description</label>
                    <p className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                      &quot;{selected.description}&quot;
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="data-label block mb-1">Landmark</span>
                      <span className="text-sm font-bold text-slate-800">{selected.landmark}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="data-label block mb-1">Coordinates</span>
                      <span className="text-sm font-mono font-bold text-slate-800">
                        {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {selected.contact && (
                    <div>
                      <label className="data-label block mb-2">Contact</label>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <Phone className="w-4 h-4 text-slate-400" />
                        {selected.contact}
                      </div>
                    </div>
                  )}

                  {selected.audio_url && (
                    <div>
                      <label className="data-label block mb-2">Citizen voice note</label>
                      <audio
                        controls
                        preload="metadata"
                        className="w-full"
                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1$/, "") || "http://localhost:8001"}${selected.audio_url}`}
                      >
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-5 border-t border-slate-200 bg-slate-50">
                  <label className="data-label block mb-3 text-center">Triage Decision</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleReview(selected.id, "confirmed")}
                      className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm shadow-emerald-500/20"
                    >
                      <Check className="w-4 h-4" /> Confirm & Escalate
                    </button>
                    <button
                      onClick={() => handleReview(selected.id, "disputed")}
                      className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold transition-all active:scale-95"
                    >
                      <X className="w-4 h-4" /> False Alarm
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center bg-slate-50/30">
                <Eye className="w-12 h-12 mb-4 text-slate-300" />
                <p className="font-bold text-slate-600 mb-1">No report selected</p>
                <p className="text-sm font-medium">Click on a report in the list to review evidence and make a triage decision.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
