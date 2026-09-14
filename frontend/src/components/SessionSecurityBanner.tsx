'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Clock, LogOut, MapPin } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function SessionSecurityBanner() {
  const router = useRouter();
  const { user, logout } = useStore();
  const [sessionMins, setSessionMins] = useState(30);
  const [istTime, setIstTime] = useState('');

  // Live IST Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setIstTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // 30-minute session countdown
  useEffect(() => {
    const t = setInterval(() => {
      setSessionMins((m) => (m > 0 ? m - 1 : 0));
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const handleSecureLogout = () => {
    logout();
    document.cookie = 'signal_token=; path=/; max-age=0; SameSite=Lax';
    router.replace('/login');
  };

  if (!user) return null;

  const roleLabel =
    user.role === 'operator'
      ? 'Command Operator'
      : user.role === 'dispatcher'
      ? 'Field Dispatcher'
      : user.role === 'responder'
      ? 'First Responder'
      : user.role === 'supervisor'
      ? 'Review Supervisor'
      : String(user.role || 'Officer');

  return (
    <div className="w-full bg-[#0B1120] text-white text-[11px] border-b border-slate-800 relative z-30 shadow-xs">
      <div className="max-w-[1700px] mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Active Security Officer Info */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-bold text-emerald-300 uppercase tracking-wide text-[10px]">
              Active Duty Session
            </span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="font-bold text-slate-100 truncate max-w-[150px] sm:max-w-none">
            {user.full_name || roleLabel}
          </span>
          <span className="px-2 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 font-extrabold uppercase tracking-wider text-[9px]">
            {roleLabel}
          </span>
          <span className="hidden lg:inline text-slate-400 text-[10px]">
            MHA ERSS 112 Grid • Clearance Verified
          </span>
        </div>

        {/* Right: IST Clock, Session Timeout, Logout */}
        <div className="flex items-center gap-2 sm:gap-3.5 flex-wrap">
          <div className="hidden md:flex items-center gap-1.5 text-slate-300 font-mono text-[11px] bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>{istTime || '--:--:--'}</span>
            <span className="text-orange-400 font-sans font-bold text-[9px]">IST</span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 text-slate-400 text-[10px]">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>Audit Logged</span>
          </div>

          <div
            className={`px-2 py-0.5 rounded border font-mono font-bold text-[10px] ${
              sessionMins <= 5
                ? 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            Timeout {sessionMins}m
          </div>

          <button
            type="button"
            onClick={handleSecureLogout}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-200 font-bold transition cursor-pointer text-[10px]"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Secure Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}