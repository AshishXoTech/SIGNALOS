"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Activity, CheckCircle2, LayoutDashboard, FileText, Flame, Users, ClipboardCheck, LogOut, Radio } from "lucide-react";
import { SignalLogo } from "@/components/brand/SignalLogo";
import { getRoleHomePath } from "@/lib/routes";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/incidents", label: "Incidents", icon: Flame },
  { href: "/dashboard/teams", label: "Teams", icon: Users },
  { href: "/dashboard/closures", label: "Closures", icon: ClipboardCheck },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hydrate } = useStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      if (!localStorage.getItem("signal_user")) router.push("/login");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;

    const homePath = getRoleHomePath(user.role);
    if (homePath === "/responder" || (homePath !== "/dashboard" && pathname === "/dashboard")) {
      router.replace(homePath);
    }
  }, [pathname, router, user]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="command-sidebar w-64 border-r border-slate-900 flex flex-col shrink-0 shadow-[18px_0_48px_rgba(15,23,42,0.18)] z-10">
          <div className="h-1.5 bg-[linear-gradient(90deg,#ff671f_0_33%,#ffffff_33%_66%,#046a38_66%_100%)]" />
          <div className="h-24 px-6 flex items-center gap-3 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,103,31,0.20),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(4,106,56,0.18),transparent_44%)]">
            <SignalLogo className="h-12 w-12 rounded-xl shadow-lg shadow-orange-500/25" />
            <div>
              <div className="text-[16px] font-black text-white leading-tight">Signal OS</div>
              <div className="text-[10px] font-black text-orange-200 uppercase tracking-[0.22em]">Bharat Command</div>
              <div className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200/80">National 112 Grid</div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 flex flex-col">
            <p className="px-2 mb-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">
              National Operations
            </p>
            <div className="space-y-1">
              {NAV.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={`nav-item ${active ? "nav-item-active" : ""}`}>
                    <Icon className="w-4 h-4" strokeWidth={active ? 2.5 : 2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 space-y-3">
              <div className="sidebar-console-card">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-200">Readiness</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                </div>
                <div className="mt-3 text-2xl font-black text-white">98%</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[98%] rounded-full bg-[linear-gradient(90deg,#ff671f,#ffffff,#046a38)]" />
                </div>
                <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">National response posture</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="sidebar-mini-card">
                  <Activity className="mb-2 h-4 w-4 text-orange-300" />
                  <div className="text-lg font-black text-white">24x7</div>
                  <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Watch</div>
                </div>
                <div className="sidebar-mini-card">
                  <Radio className="mb-2 h-4 w-4 text-emerald-300" />
                  <div className="text-lg font-black text-white">112</div>
                  <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Grid</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bharat Sectors</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                </div>
                {["North", "South", "East", "West"].map((sector) => (
                  <div key={sector} className="mb-2 last:mb-0 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">{sector}</span>
                    <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-black text-emerald-200">Ready</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6">
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,103,31,0.16),rgba(255,255,255,0.05),rgba(4,106,56,0.16))] p-3">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Mission</div>
                <div className="mt-1 text-sm font-black leading-tight text-orange-100">Zero Lives Lost</div>
                <div className="mt-3 h-px bg-white/10" />
                <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">Sarve bhavantu surakshitah</div>
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] shadow-2xl shadow-black/20">
              <div className="h-1 bg-[linear-gradient(90deg,#ff671f_0_33%,#ffffff_33%_66%,#046a38_66%_100%)]" />
              <div className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-black text-xs ring-2 ring-white/20">
                  {user?.full_name?.charAt(0) || "O"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white leading-tight">{user?.full_name || "Operator"}</p>
                  <p className="text-[10px] font-bold text-orange-200 uppercase tracking-[0.16em]">{user?.role || "operator"}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); router.push("/login"); }}
                className="w-full flex items-center justify-center gap-2 border-t border-white/10 px-3 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-slate-200 transition-colors hover:bg-red-500/15 hover:text-red-100"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-50 bg-grid-pattern command-room-bg relative">
          {children}
        </main>
      </div>
    </div>
  );
}
