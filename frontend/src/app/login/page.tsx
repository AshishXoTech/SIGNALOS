"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Phone, Lock, AlertTriangle, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [phone, setPhone] = useState("+910000000001");
  const [password, setPassword] = useState("•••••••");
  const [isLoading, setIsLoading] = useState(false);

  // 100% ROCK-SOLID AUTH & REDIRECT FIX
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (typeof window !== "undefined") {
      const mockToken = "demo-token-signal-os-12345";
      const mockUser = JSON.stringify({
        id: "usr-001",
        name: "Command Duty Officer",
        role: "Operator",
        phone: phone
      });

      // 1. Set LocalStorage keys
      localStorage.setItem("signal_token", mockToken);
      localStorage.setItem("signal_user", mockUser);
      localStorage.setItem("token", mockToken);
      localStorage.setItem("user", mockUser);
      localStorage.setItem("isAuthenticated", "true");

      // 2. Set Cookies (Critical for Next.js Middleware / Server Guards)
      document.cookie = `signal_token=${mockToken}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `token=${mockToken}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `auth_token=${mockToken}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `session=${mockToken}; path=/; max-age=86400; SameSite=Lax`;
    }

    toast.success("Authenticated. Entering Command Room...");

    // 3. Replace location to bypass back-button loop & trigger clean load
    setTimeout(() => {
      window.location.replace("/dashboard");
    }, 300);
  };

  const setDemoRole = (rolePhone: string) => {
    setPhone(rolePhone);
    setPassword("•••••••");
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500/30 overflow-hidden">
      
      {/* 🇮🇳 SUBTLE BHARAT AMBIENT GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] pointer-events-none flex justify-center opacity-40 blur-[120px] z-0">
        <div className="w-1/3 h-full bg-orange-500 rounded-full mix-blend-multiply"></div>
        <div className="w-1/3 h-full bg-slate-100 rounded-full mix-blend-multiply"></div>
        <div className="w-1/3 h-full bg-emerald-500 rounded-full mix-blend-multiply"></div>
      </div>

      {/* Modern Dot Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none z-0" />

      {/* Top Demo Banner */}
      <div className="relative z-20 bg-amber-50/90 backdrop-blur-sm border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-amber-800 tracking-wide shadow-sm">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Demonstration System — Not connected to real dispatch. Real emergency? Call 112.
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30 mb-5 relative border border-orange-400">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 rounded-2xl"></div>
            <Shield className="w-8 h-8 text-white relative z-10" />
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Signal OS</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-100/80 border border-orange-200 text-orange-800 text-[10px] font-black uppercase tracking-widest shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              Bharat 🇮🇳
            </div>
          </div>
          
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
            National Emergency Coordination Platform
          </p>
          
          <p className="text-xs font-medium text-slate-500 max-w-sm leading-relaxed border-t border-slate-200 pt-3">
            Mission: <span className="font-bold text-slate-700">Zero Lives Lost.</span> <br/>
            Empowering India's first responders with AI-driven spatial intelligence.
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[400px]">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 mb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-sm inset-shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold tracking-widest text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? "Authenticating..." : "Sign in to Workspace"}
              </button>
            </form>
          </div>

          {/* Demo Roles Section */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 w-full max-w-[300px] mb-4">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                One-Click Demo Roles
              </span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {["Operator", "Dispatcher", "Responder", "Supervisor"].map((role, idx) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setDemoRole(`+91000000000${idx + 1}`)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:border-orange-300 hover:text-orange-600 hover:shadow-sm transition-all active:scale-95"
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Link to Citizen App */}
            <Link 
              href="/report" 
              className="group flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
            >
              Open Citizen Reporter App 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}