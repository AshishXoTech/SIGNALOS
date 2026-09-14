"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Radio, 
  PhoneCall, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Activity, 
  Shield, 
  Truck, 
  ClipboardCheck, 
  Users, 
  MapPin, 
  Cpu
} from "lucide-react";
import { SignalLogo } from "@/components/brand/SignalLogo";
import GovHeader from "@/components/GovHeader";
import GovFooter from "@/components/GovFooter";
import { useStore } from "@/lib/store";
import { getRoleHomePath, getRoleWorkspaceName } from "@/lib/routes";

export default function Home() {
  const router = useRouter();
  const { user, hydrate } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  const activeWorkspacePath = user ? getRoleHomePath(user.role) : null;
  const activeWorkspaceName = user ? getRoleWorkspaceName(user.role) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      {/* 🇮🇳 OFFICIAL GOVERNMENT HEADER */}
      <GovHeader />

      {/* ACTIVE DUTY SESSION QUICK BAR (If officer already authenticated) */}
      {mounted && user && (
        <div className="bg-[#0B1120] text-white py-2.5 px-4 border-b border-slate-800 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-medium text-slate-300">Authenticated Duty Session:</span>
              <span className="font-bold text-emerald-300">{user.full_name || user.role}</span>
              <span className="px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 font-extrabold uppercase text-[10px]">
                {user.role}
              </span>
            </div>
            {activeWorkspacePath && (
              <button
                onClick={() => router.push(activeWorkspacePath)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-orange-600 hover:bg-orange-500 text-white font-bold transition shadow-sm cursor-pointer"
              >
                <span>Enter {activeWorkspaceName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* AMBIENT TRICOLOR GLOW */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] pointer-events-none flex justify-center opacity-25 blur-[140px] z-0">
        <div className="w-1/3 h-full bg-orange-500 rounded-full mix-blend-multiply"></div>
        <div className="w-1/3 h-full bg-slate-100 rounded-full mix-blend-multiply"></div>
        <div className="w-1/3 h-full bg-emerald-500 rounded-full mix-blend-multiply"></div>
      </div>

      {/* DOT GRID PATTERN */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none z-0" />

      {/* DEMO SYSTEM DISCLAIMER STRIP */}
      <div className="relative z-20 bg-amber-50/90 backdrop-blur-sm border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-amber-900 tracking-wide">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
        <span>Demonstration Gateway — For real emergencies, dial national helpline 112 immediately.</span>
      </div>

      {/* HERO SECTION */}
      <section className="relative z-10 flex-1 max-w-7xl mx-auto px-4 pt-10 pb-16 flex flex-col items-center">
        
        {/* Emblem & Branding */}
        <div className="flex flex-col items-center text-center max-w-3xl mb-12">
          <div className="relative mb-5">
            <SignalLogo className="h-24 w-24 rounded-3xl shadow-2xl ring-4 ring-white" />
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1.5 rounded-full shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center gap-2.5 mb-3">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Signal OS</h1>
            <span className="px-2.5 py-1 rounded-md bg-orange-100 border border-orange-300 text-orange-800 text-xs font-black uppercase tracking-widest shadow-xs">
              Bharat 🇮🇳
            </span>
          </div>

          <p className="text-sm sm:text-base font-extrabold text-slate-600 uppercase tracking-widest mb-3">
            National Emergency Coordination Platform
          </p>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-medium mb-6">
            Empowering India&apos;s first responders with <strong className="text-slate-900 font-bold">AI-driven spatial intelligence</strong>, micro-geocoding, and multi-agency real-time dispatch across the 112 ERSS grid.
          </p>

          {/* Mission Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 via-slate-100 to-emerald-500/10 border border-slate-200 text-xs font-bold text-slate-800 shadow-xs">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Mission: <strong className="text-slate-900 font-black">Zero Lives Lost</strong></span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">Golden Hour Response Architecture</span>
          </div>
        </div>

        {/* TWO PRIMARY PORTAL GATEWAYS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-12">
          
          {/* GATEWAY 1: OFFICER DUTY PORTAL */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border-2 border-slate-200/80 hover:border-orange-500/80 shadow-[0_10px_35px_rgba(0,0,0,0.05)] hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-slate-600">
                  Responders & Officers
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                Officer Duty Gateway
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-medium mb-6">
                Secure workspace for Command Operators, Dispatchers, SDRF/NDRF Field Responders, and Review Supervisors.
              </p>

              {/* Role Tags */}
              <div className="grid grid-cols-2 gap-2 mb-8">
                {[
                  { title: "Command Room", role: "Operator" },
                  { title: "Incident Control", role: "Dispatcher" },
                  { title: "Field Units", role: "Responder" },
                  { title: "Audit Review", role: "Supervisor" },
                ].map((item) => (
                  <div key={item.role} className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[11px] font-bold text-slate-800">{item.role}</div>
                    <div className="text-[9px] text-slate-500 font-medium">{item.title}</div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/login"
              className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
            >
              <span>Officer Duty Login</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* GATEWAY 2: CITIZEN EMERGENCY PORTAL */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border-2 border-slate-200/80 hover:border-emerald-500/80 shadow-[0_10px_35px_rgba(0,0,0,0.05)] hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800">
                  Public Citizen Access
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                Citizen Incident Reporter
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-medium mb-6">
                Report live emergencies directly to command rooms with automated GPS pinning, voice recording, and AI classification.
              </p>

              {/* Capability List */}
              <div className="space-y-2 mb-8">
                {[
                  "Multilingual Voice Emergency Recording",
                  "Auto-Geolocation & Landmark Extraction",
                  "12 World-Class Disaster Categories",
                  "Offline Queue & Low-Bandwidth Sync",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/report"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
            >
              <span>Report Emergency Incident</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>

        {/* OPERATIONAL CAPABILITY STRIP */}
        <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h3 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            National ERSS 112 Spatial AI Grid Capabilities
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3">
              <Cpu className="w-5 h-5 mx-auto mb-2 text-orange-500" />
              <div className="text-xs font-bold text-slate-900">Gemini 2.0 AI</div>
              <div className="text-[10px] text-slate-500">Real-Time Triage</div>
            </div>
            <div className="p-3">
              <MapPin className="w-5 h-5 mx-auto mb-2 text-blue-500" />
              <div className="text-xs font-bold text-slate-900">GeoAI Navigation</div>
              <div className="text-[10px] text-slate-500">PostGIS Spatial Engine</div>
            </div>
            <div className="p-3">
              <Activity className="w-5 h-5 mx-auto mb-2 text-emerald-500" />
              <div className="text-xs font-bold text-slate-900">24x7 Watch Grid</div>
              <div className="text-[10px] text-slate-500">Live WebSocket Feed</div>
            </div>
            <div className="p-3">
              <Users className="w-5 h-5 mx-auto mb-2 text-purple-500" />
              <div className="text-xs font-bold text-slate-900">Multi-Agency</div>
              <div className="text-[10px] text-slate-500">Police, Fire, SDRF</div>
            </div>
          </div>
        </div>

      </section>

      {/* 🇮🇳 STATUTORY GOVERNMENT FOOTER */}
      <GovFooter />
    </div>
  );
}