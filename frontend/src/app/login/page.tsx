"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Lock, AlertTriangle, ArrowRight, ShieldCheck, UserCheck, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { SignalLogo } from "@/components/brand/SignalLogo";
import GovHeader from "@/components/GovHeader";
import GovFooter from "@/components/GovFooter";
import { api } from "@/lib/api-client";
import { getRoleHomePath, getRoleWorkspaceName } from "@/lib/routes";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+910000000001");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useStore((state) => state.setUser);
  const setToken = useStore((state) => state.setToken);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.login(phone, password);
      setToken(response.access_token);
      setUser({ ...response.user, full_name: response.user.full_name || response.user.role });
      document.cookie = `signal_token=${encodeURIComponent(response.access_token)}; path=/; max-age=86400; SameSite=Lax`;
      toast.success(`Authenticated. Entering ${getRoleWorkspaceName(response.user.role)}...`);
      router.replace(getRoleHomePath(response.user.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to authenticate");
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoRole = (rolePhone: string) => {
    setPhone(rolePhone);
    setPassword("YourPassword123");
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      
      {/* 🇮🇳 OFFICIAL GOVERNMENT HEADER */}
      <GovHeader />

      {/* SUBTLE BHARAT AMBIENT GLOW */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[450px] pointer-events-none flex justify-center opacity-30 blur-[130px] z-0">
        <div className="w-1/3 h-full bg-orange-500 rounded-full mix-blend-multiply"></div>
        <div className="w-1/3 h-full bg-slate-100 rounded-full mix-blend-multiply"></div>
        <div className="w-1/3 h-full bg-emerald-500 rounded-full mix-blend-multiply"></div>
      </div>

      {/* Modern Dot Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-50 pointer-events-none z-0" />

      {/* Top Demo Banner */}
      <div className="relative z-20 bg-amber-50/90 backdrop-blur-sm border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold text-amber-900 tracking-wide shadow-sm">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
        <span>Demonstration System — Not connected to live dispatch. Real emergency? Dial 112.</span>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Government Officer Gateway Header */}
        <div className="flex flex-col items-center mb-6 text-center max-w-md">
          <div className="relative mb-4">
            <SignalLogo className="h-20 w-20 rounded-2xl shadow-xl ring-4 ring-white" />
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1 rounded-full shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Signal OS</h1>
            <span className="px-2 py-0.5 rounded bg-orange-100 border border-orange-300 text-orange-800 text-[10px] font-black uppercase tracking-wider shadow-xs">
              Bharat 🇮🇳
            </span>
          </div>
          
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
            National Emergency Coordination Platform
          </p>
          
          <div className="bg-slate-200/60 text-slate-700 text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>Officer & Responder Duty Access Gateway</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[420px]">
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-slate-200/80 p-7 mb-6">
            
            <div className="mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Officer Authentication</h2>
                <p className="text-[11px] font-medium text-slate-500">Enter your registered mobile & security key</p>
              </div>
              <KeyRound className="w-5 h-5 text-orange-500 opacity-80" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-0.5">
                  Mobile ID / Officer Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+910000000001"
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-0.5">
                  Security Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold tracking-wider text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-xs"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Authenticating Officer...
                  </span>
                ) : (
                  "Sign in to Command Workspace"
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Role Selector */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 w-full max-w-[320px] mb-3">
              <div className="h-px flex-1 bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Quick Role Selector (Demo)
              </span>
              <div className="h-px flex-1 bg-slate-300"></div>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full mb-6">
              {[
                { name: "Operator", phone: "+910000000001", role: "Command Room" },
                { name: "Dispatcher", phone: "+910000000002", role: "Incident Control" },
                { name: "Responder", phone: "+910000000003", role: "Field Unit" },
                { name: "Supervisor", phone: "+910000000004", role: "Closure Review" },
              ].map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setDemoRole(item.phone)}
                  className={`p-2.5 bg-white border rounded-xl text-left hover:border-orange-400 hover:shadow-xs transition-all cursor-pointer ${
                    phone === item.phone ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/30" : "border-slate-200"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-800">{item.name}</div>
                  <div className="text-[10px] font-medium text-slate-500">{item.role}</div>
                </button>
              ))}
            </div>

            {/* Link to Citizen App */}
            <Link 
              href="/report" 
              className="group flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl text-xs font-bold text-orange-700 transition-all"
            >
              <span>Switch to Public Citizen Incident Reporter</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
      </div>

      {/* 🇮🇳 STATUTORY GOVERNMENT FOOTER */}
      <GovFooter />
    </div>
  );
}