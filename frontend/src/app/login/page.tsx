"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Phone, 
  Lock, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  Building2, 
  Shield, 
  Radio, 
  Truck, 
  CheckCircle2 
} from "lucide-react";
import toast from "react-hot-toast";
import { SignalLogo } from "@/components/brand/SignalLogo";
import GovHeader from "@/components/GovHeader";
import GovFooter from "@/components/GovFooter";
import { api } from "@/lib/api-client";
import { getRoleHomePath, getRoleWorkspaceName } from "@/lib/routes";
import { useStore } from "@/lib/store";

const DEPARTMENTS = [
  "MHA — National Emergency Command (ERSS 112)",
  "State Police Operations & Control Room",
  "Fire & Rescue Services Command",
  "National Disaster Response Force (NDRF)",
  "State Disaster Management Authority (SDMA)",
  "Health & Trauma Emergency Services (108)",
];

const ROLES_INFO = [
  {
    id: "operator",
    name: "Command Operator",
    phone: "+910000000001",
    clearance: "LEVEL 3 — COMMAND ROOM",
    badge: "MHA-OP-112",
    icon: Shield,
    color: "bg-blue-50 border-blue-200 text-blue-800",
    activeColor: "border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20",
    desc: "National Incident Triage & Live AI Spatial Intelligence",
  },
  {
    id: "dispatcher",
    name: "Field Dispatcher",
    phone: "+910000000002",
    clearance: "LEVEL 2 — INCIDENT CONTROL",
    badge: "MHA-DP-108",
    icon: Radio,
    color: "bg-orange-50 border-orange-200 text-orange-800",
    activeColor: "border-orange-600 bg-orange-50/80 ring-2 ring-orange-500/20",
    desc: "Resource Dispatching, Routing & Inter-Agency Coordination",
  },
  {
    id: "responder",
    name: "First Responder",
    phone: "+910000000003",
    clearance: "LEVEL 1 — FIELD UNIT",
    badge: "MHA-FR-099",
    icon: Truck,
    color: "bg-emerald-50 border-emerald-200 text-emerald-800",
    activeColor: "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20",
    desc: "On-Ground Incident Action, Navigation & Closure Submission",
  },
  {
    id: "supervisor",
    name: "Review Supervisor",
    phone: "+910000000004",
    clearance: "LEVEL 4 — AUDIT & CLOSURE",
    badge: "MHA-SV-001",
    icon: CheckCircle2,
    color: "bg-purple-50 border-purple-200 text-purple-800",
    activeColor: "border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20",
    desc: "Incident Closure Verification, Accountability & After-Action Audit",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+910000000001");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [selectedRole, setSelectedRole] = useState(ROLES_INFO[0]);
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
      toast.success(`Authenticated [${selectedRole.badge}]. Entering ${getRoleWorkspaceName(response.user.role)}...`);
      router.replace(getRoleHomePath(response.user.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to authenticate officer credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoRole = (roleItem: typeof ROLES_INFO[0]) => {
    setSelectedRole(roleItem);
    setPhone(roleItem.phone);
    setPassword("YourPassword123");
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500/30 overflow-x-hidden">
      
      {/* 🇮🇳 OFFICIAL GOVERNMENT HEADER WITH IST CLOCK */}
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
            <span>Duty Gateway • Authorized Responders & Officers Only</span>
          </div>
        </div>

        {/* Login Card Container */}
        <div className="w-full max-w-[440px]">
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.06)] border border-slate-200/80 p-7 mb-6">
            
            {/* Header & Role Badge */}
            <div className="mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Officer Verification</h2>
                <p className="text-[11px] font-medium text-slate-500">Sign in to active emergency duty workspace</p>
              </div>
              <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-right">
                <div className="text-[9px] font-black text-slate-400 uppercase">Clearance</div>
                <div className="text-[10px] font-extrabold text-slate-800">{selectedRole.badge}</div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Department / Agency Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-0.5">
                  Department / Agency
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-11 pl-10 pr-8 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-xs appearance-none cursor-pointer"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Mobile / Officer ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-0.5">
                  Officer Mobile ID / Duty Phone
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

              {/* Password */}
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

              {/* Active Duty Role Badge Display */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">{selectedRole.name} Clearance</span>
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-wide">{selectedRole.clearance}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{selectedRole.desc}</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Verifying Credentials...
                  </span>
                ) : (
                  `Sign in as ${selectedRole.name}`
                )}
              </button>
            </form>
          </div>

          {/* Role Selection Grid */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 w-full max-w-[340px] mb-3">
              <div className="h-px flex-1 bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Select Operational Role
              </span>
              <div className="h-px flex-1 bg-slate-300"></div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 w-full mb-6">
              {ROLES_INFO.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedRole.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDemoRole(item)}
                    className={`p-3 bg-white border rounded-xl text-left transition-all cursor-pointer relative overflow-hidden ${
                      isSelected ? item.activeColor : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-orange-600" : "text-slate-500"}`} />
                      <span className="text-xs font-bold text-slate-900">{item.name}</span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 truncate">{item.badge}</div>
                  </button>
                );
              })}
            </div>

            {/* Switch to Citizen Reporter */}
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