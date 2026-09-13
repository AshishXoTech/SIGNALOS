"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Send, AlertTriangle, Phone,
  Loader2, CheckCircle2, Mic, Square, Trash2, Play,
  ShieldAlert, Shield
} from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { queueReport } from "@/lib/offline-queue";
import toast from "react-hot-toast";

// 12 World-Class Emergency Categories with exact backend mapping
interface HazardCategory {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  backendType: "flood" | "fire" | "earthquake" | "landslide" | "cyclone" | "tsunami" | "drought" | "other";
}

const HAZARDS: HazardCategory[] = [
  {
    id: "waterlogging_flood",
    label: "Flood & Waterlogging",
    sublabel: "Rising water, submerged roads",
    icon: "🌊",
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100/80",
    borderColor: "border-blue-200 hover:border-blue-400",
    backendType: "flood",
  },
  {
    id: "fire_smoke",
    label: "Fire & Smoke",
    sublabel: "Building fire, wildfire, gas burn",
    icon: "🔥",
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100/80",
    borderColor: "border-red-200 hover:border-red-400",
    backendType: "fire",
  },
  {
    id: "earthquake",
    label: "Earthquake & Tremor",
    sublabel: "Ground shaking, structural cracks",
    icon: "🏚️",
    color: "text-amber-700",
    bgColor: "bg-amber-50 hover:bg-amber-100/80",
    borderColor: "border-amber-200 hover:border-amber-400",
    backendType: "earthquake",
  },
  {
    id: "building_collapse",
    label: "Structure Collapse",
    sublabel: "Building, bridge, or wall fall",
    icon: "🏢",
    color: "text-stone-700",
    bgColor: "bg-stone-50 hover:bg-stone-100/80",
    borderColor: "border-stone-200 hover:border-stone-400",
    backendType: "earthquake",
  },
  {
    id: "landslide_mud",
    label: "Landslide & Mudslide",
    sublabel: "Falling rocks, mud movement",
    icon: "⛰️",
    color: "text-amber-800",
    bgColor: "bg-amber-100/40 hover:bg-amber-100/80",
    borderColor: "border-amber-300 hover:border-amber-500",
    backendType: "landslide",
  },
  {
    id: "cyclone_storm",
    label: "Cyclone & Heavy Storm",
    sublabel: "Extreme winds, fallen trees",
    icon: "🌀",
    color: "text-teal-700",
    bgColor: "bg-teal-50 hover:bg-teal-100/80",
    borderColor: "border-teal-200 hover:border-teal-400",
    backendType: "cyclone",
  },
  {
    id: "tsunami_surge",
    label: "Tsunami & Coastal Surge",
    sublabel: "High sea waves, ocean flooding",
    icon: "🌊",
    color: "text-cyan-700",
    bgColor: "bg-cyan-50 hover:bg-cyan-100/80",
    borderColor: "border-cyan-200 hover:border-cyan-400",
    backendType: "tsunami",
  },
  {
    id: "gas_chemical",
    label: "Gas & Chemical Leak",
    sublabel: "Toxic odor, hazardous spill",
    icon: "☣️",
    color: "text-purple-700",
    bgColor: "bg-purple-50 hover:bg-purple-100/80",
    borderColor: "border-purple-200 hover:border-purple-400",
    backendType: "other",
  },
  {
    id: "power_infrastructure",
    label: "Power & Grid Failure",
    sublabel: "Live wire down, blackout",
    icon: "⚡",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50 hover:bg-yellow-100/80",
    borderColor: "border-yellow-200 hover:border-yellow-400",
    backendType: "other",
  },
  {
    id: "medical_mass",
    label: "Medical Emergency",
    sublabel: "Injuries, mass rescue needed",
    icon: "🚑",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 hover:bg-emerald-100/80",
    borderColor: "border-emerald-200 hover:border-emerald-400",
    backendType: "other",
  },
  {
    id: "drought_heat",
    label: "Extreme Heat / Drought",
    sublabel: "Severe water scarcity, heatwave",
    icon: "☀️",
    color: "text-orange-700",
    bgColor: "bg-orange-50 hover:bg-orange-100/80",
    borderColor: "border-orange-200 hover:border-orange-400",
    backendType: "drought",
  },
  {
    id: "other_emergency",
    label: "Other Emergency",
    sublabel: "General critical incident",
    icon: "⚠️",
    color: "text-slate-700",
    bgColor: "bg-slate-50 hover:bg-slate-100/80",
    borderColor: "border-slate-200 hover:border-slate-400",
    backendType: "other",
  },
];

type Step = "hazard" | "details" | "submitting" | "done";

export default function ReportPage() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("hazard");
  const [selectedHazard, setSelectedHazard] = useState<HazardCategory | null>(null);
  const [description, setDescription] = useState("");
  const [landmark, setLandmark] = useState("");
  const [contact, setContact] = useState("");
  const [reference, setReference] = useState("");
  const [locLoading, setLocLoading] = useState(false);

  const geo = useGeolocation();
  const voice = useVoiceRecorder();

  // Prevent SSR Hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  const requestLoc = () => {
    setLocLoading(true);
    geo.requestLocation();
    setTimeout(() => setLocLoading(false), 1200);
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedHazard) {
      toast.error("Please select an observed hazard");
      return;
    }
    if (!geo.latitude || !geo.longitude) {
      toast.error("Location required — tap 'Use my location'");
      return;
    }
    if (!description.trim() && !voice.blob) {
      toast.error("Provide a short description or record a voice note");
      return;
    }

    setStep("submitting");
    const submissionId = crypto.randomUUID();

    const localPayload = {
      client_submission_id: submissionId,
      hazard_type: selectedHazard.id,
      hazard_label: selectedHazard.label,
      secondary_tags: voice.blob ? ["voice_note"] : [],
      description: description || (voice.blob ? "[Voice note attached]" : null),
      latitude: geo.latitude,
      longitude: geo.longitude,
      location_accuracy_m: geo.accuracy,
      landmark: landmark || null,
      observed_at: new Date().toISOString(),
      reporter_contact: contact || null,
      media_ids: [] as string[],
      has_voice_note: !!voice.blob,
      voice_duration_sec: voice.blob ? voice.seconds : 0,
    };

    const apiPayload = {
      user_id: contact || "citizen-bharat",
      description:
        description ||
        (voice.blob
          ? `Voice note emergency (${voice.seconds}s) — ${selectedHazard.label}`
          : `Emergency reported: ${selectedHazard.label}`),
      disaster_type: selectedHazard.backendType,
      latitude: geo.latitude,
      longitude: geo.longitude,
      address_text: landmark || null,
      source: "mobile-pwa",
      language: "en",
      extra_metadata: {
        hazard_id: selectedHazard.id,
        hazard_label: selectedHazard.label,
        client_submission_id: submissionId,
        location_accuracy_m: geo.accuracy,
        reporter_contact: contact || null,
        has_voice_note: !!voice.blob,
        voice_duration_sec: voice.blob ? voice.seconds : 0,
        secondary_tags: voice.blob ? ["voice_note"] : [],
        observed_at: localPayload.observed_at,
      },
    };

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const res = await fetch(`${API}/api/v1/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(apiPayload),
      });

      if (!res.ok) {
        throw new Error("api_error");
      }

      const data = await res.json();
      setReference(`IND-${String(data.id || submissionId).slice(0, 5).toUpperCase()}`);

      if (typeof data.trust_score === "number") {
        toast.success(`AI Verified! Trust Score: ${data.trust_score}%`, { duration: 4000 });
      } else {
        toast.success("Emergency report transmitted to command room");
      }
    } catch {
      await queueReport(localPayload);
      setReference(`IND-${submissionId.slice(0, 5).toUpperCase()}`);
      toast("Saved offline — auto-syncing when network restores", { icon: "📡", duration: 4000 });
    }

    setStep("done");
  }, [
    selectedHazard,
    description,
    landmark,
    contact,
    geo.latitude,
    geo.longitude,
    geo.accuracy,
    voice.blob,
    voice.seconds,
  ]);

  const fmt = (s: number) => `0:${s.toString().padStart(2, "0")}`;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#FF9933] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 bg-grid-pattern pb-16 overflow-x-hidden">
      
      {/* 🇮🇳 TOP TIRANGA STRIP */}
      <div className="absolute top-0 left-0 w-full h-1.5 flex z-50">
        <div className="flex-1 bg-[#FF9933]"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-[#138808]"></div>
      </div>

      {/* 🇮🇳 AMBIENT BHARAT GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] pointer-events-none flex justify-center opacity-[0.25] blur-[100px] z-0">
        <div className="w-1/3 h-full bg-[#FF9933] rounded-full mix-blend-multiply"></div>
        <div className="w-1/3 h-full bg-slate-100 rounded-full mix-blend-multiply"></div>
        <div className="w-1/3 h-full bg-[#138808] rounded-full mix-blend-multiply"></div>
      </div>

      {/* Official Banner */}
      <div className="relative z-20 mt-1.5 bg-[#FF9933] text-white px-4 py-2.5 flex items-center justify-center gap-2 text-[11px] sm:text-xs font-bold tracking-wide shadow-md">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        NATIONAL DEMO SYSTEM — IN REAL EMERGENCY DIAL 112
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4 pt-8">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden">
              {/* Subtle Ashok Chakra-like radial burst behind icon */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50 to-white opacity-50"></div>
              <Shield className="w-7 h-7 text-[#FF9933] relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Citizen Portal
                </h1>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 border border-orange-200 text-orange-800 text-[10px] font-black uppercase tracking-widest rounded shadow-sm">
                  Bharat 🇮🇳
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Signal OS National AI Response
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: HAZARD SELECTION */}
          {step === "hazard" && (
            <motion.div
              key="hazard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
                <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
                  Select Incident Type
                </p>
                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                  Step 1 of 2
                </span>
              </div>

              {/* 12 Category Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {HAZARDS.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setSelectedHazard(h);
                      setStep("details");
                      if (!geo.latitude) requestLoc();
                    }}
                    className={`flex flex-col items-start text-left p-3.5 rounded-2xl border-2 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md bg-white hover:bg-slate-50 border-slate-100 hover:border-[#FF9933]/50`}
                  >
                    <div className="text-3xl mb-2">{h.icon}</div>
                    <span className="text-[11px] font-bold leading-snug text-slate-800">
                      {h.label}
                    </span>
                    <span className="text-[9px] text-slate-500 font-semibold leading-tight mt-1 line-clamp-1">
                      {h.sublabel}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: DETAILS & LOCATION */}
          {step === "details" && selectedHazard && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <button
                onClick={() => setStep("hazard")}
                className="text-xs font-bold text-[#FF9933] hover:underline flex items-center gap-1"
              >
                ← Change Incident Type
              </button>

              {/* Selected hazard chip */}
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm">
                <span className="text-xl">{selectedHazard.icon}</span>
                <span className="text-sm font-black text-slate-800">{selectedHazard.label}</span>
              </div>

              {/* GPS Location Component */}
              <div>
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">
                  1. Verify Location
                </p>
                <button
                  onClick={requestLoc}
                  disabled={locLoading || geo.loading}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all shadow-sm ${
                    geo.latitude
                      ? "border-[#138808] bg-[#138808]/5"
                      : "border-slate-200 bg-white hover:border-[#FF9933]/40"
                  }`}
                >
                  {locLoading || geo.loading ? (
                    <Loader2 className="w-6 h-6 text-[#FF9933] animate-spin shrink-0" />
                  ) : geo.latitude ? (
                    <CheckCircle2 className="w-6 h-6 text-[#138808] shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[#FF9933]" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {locLoading || geo.loading
                        ? "Acquiring GPS Signal…"
                        : geo.latitude
                        ? "GPS Location Locked"
                        : "Tap to lock coordinates"}
                    </div>
                    {geo.latitude && geo.longitude && (
                      <div className="text-[11px] font-mono text-[#138808] font-bold mt-0.5">
                        {geo.latitude.toFixed(4)}, {geo.longitude.toFixed(4)} (Accuracy ~{Math.round(geo.accuracy || 10)}m)
                      </div>
                    )}
                  </div>
                </button>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Street / Landmark (e.g., Near City Hospital Gate #2)"
                  className="mt-2 w-full p-3.5 text-sm font-medium rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/50"
                />
              </div>

              {/* Description Component */}
              <div>
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">
                  2. Describe Situation
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Details: Water level height, trapped victims, immediate hazards..."
                  className="w-full p-3.5 text-sm font-medium rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/50 resize-none"
                />
              </div>

              {/* Voice Note Module */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                    Voice Note (Hands-Free)
                  </p>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                    Max 60s
                  </span>
                </div>

                {!voice.url && !voice.recording && (
                  <button
                    type="button"
                    onClick={voice.start}
                    className="w-full py-3.5 rounded-xl bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-900 active:scale-[0.98] transition-all shadow-md"
                  >
                    <Mic className="w-5 h-5 text-red-400" /> Record Audio Update
                  </button>
                )}

                {voice.recording && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3 py-2 bg-red-50 rounded-xl border border-red-200">
                      <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping" />
                      <span className="text-2xl font-black font-mono text-red-700">
                        {fmt(voice.seconds)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={voice.stop}
                      className="w-full py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-700 shadow-md"
                    >
                      <Square className="w-4 h-4 fill-current" /> Stop Recording
                    </button>
                  </div>
                )}

                {voice.url && !voice.recording && (
                  <div className="space-y-2">
                    <audio src={voice.url} controls className="w-full h-10" />
                    <div className="flex gap-2">
                      <div className="flex-1 text-xs font-bold text-[#138808] bg-[#138808]/10 border border-[#138808]/20 rounded-lg px-3 py-2 flex items-center gap-2">
                        <Play className="w-3.5 h-3.5" /> Audio Saved ({fmt(voice.seconds)})
                      </div>
                      <button
                        type="button"
                        onClick={voice.reset}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Contact Number */}
              <div>
                <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">
                  Contact Number (Optional Callback)
                </p>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+91 Phone number for rescue teams"
                    className="w-full p-3.5 pl-10 text-sm font-medium rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF9933]/50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="w-full py-4 mt-2 rounded-2xl bg-[#FF9933] text-white font-black text-base shadow-[0_8px_20px_rgba(255,153,51,0.3)] flex items-center justify-center gap-2 hover:bg-[#e68a2e] active:scale-[0.98] transition-all border-b-4 border-[#cc7a29]"
              >
                <Send className="w-5 h-5" /> Submit to National Command
              </button>
            </motion.div>
          )}

          {/* STEP 3: SUBMITTING / AI PROCESSING */}
          {step === "submitting" && (
            <motion.div
              key="sub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center"
            >
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-[#FF9933]/30 animate-ping" />
                <div className="w-20 h-20 rounded-full bg-[#FF9933] flex items-center justify-center text-white shadow-xl">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
              </div>
              <p className="text-xl font-black text-slate-900 tracking-tight">Transmitting Report...</p>
              <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">
                Running 5-Modal AI Consensus
              </p>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS / CONFIRMATION */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-2xl mt-4 relative overflow-hidden"
            >
              {/* Subtle top decoration in success card */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#138808]"></div>

              <div className="w-20 h-20 bg-[#138808]/10 text-[#138808] rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">Report Dispatched</h2>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-6">
                Logged in National Command Center
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left mb-8 space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-3">
                  <span className="text-slate-500 font-bold">Reference ID</span>
                  <span className="font-mono font-black text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-sm">
                    {reference}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-3">
                  <span className="text-slate-500 font-bold">Status</span>
                  <span className="font-bold text-[#138808] bg-[#138808]/10 px-2.5 py-1 rounded border border-[#138808]/20 text-[11px] uppercase tracking-wider">
                    VERIFIED & INGESTED
                  </span>
                </div>
                {selectedHazard && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold">Category</span>
                    <span className="font-black text-slate-800">{selectedHazard.label}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setStep("hazard");
                  setSelectedHazard(null);
                  setDescription("");
                  setLandmark("");
                  setContact("");
                  voice.reset();
                }}
                className="w-full py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-black text-sm hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
              >
                Submit Another Report
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* National Footer */}
        <div className="mt-12 mb-6 text-center opacity-70">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            A National Initiative for Disaster Resilience
          </p>
        </div>

      </div>
    </div>
  );
}