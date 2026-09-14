'use client';

import { ShieldAlert, PhoneCall } from 'lucide-react';

export default function GovFooter() {
  return (
    <footer className="w-full mt-12 border-t border-slate-200 bg-slate-100/80 backdrop-blur-md text-slate-600 relative z-20">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Statutory Legal Warning */}
        <div className="bg-amber-500/10 border-l-4 border-amber-600 rounded-r p-3">
          <p className="text-xs text-amber-950 leading-relaxed font-medium">
            <strong className="font-bold text-amber-900">⚠ RESTRICTED OFFICIAL PORTAL:</strong> Authorized access only under the{' '}
            <span className="font-semibold underline">IT Act 2000 (Section 66)</span>. Unauthorized access attempts or misuse will attract criminal prosecution. All activities are recorded, timestamped, and audited by National Cyber Security Threat Monitoring.
          </p>
        </div>

        {/* Emergency Callout & Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-200/80 pt-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <PhoneCall className="w-4 h-4 text-red-600" />
            <span>
              National Emergency Helpline:{' '}
              <a
                href="tel:112"
                className="font-bold text-red-600 hover:underline px-2 py-0.5 bg-red-100 rounded border border-red-200"
              >
                Dial 112
              </a>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
            <a href="#" className="hover:text-slate-900 transition">MHA Guidelines</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-900 transition">ERSS Protocol</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-900 transition">Privacy & Security</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-900 transition">IT Helpdesk</a>
          </div>
        </div>

        {/* Digital India Attribution */}
        <div className="text-center pt-3 border-t border-slate-200/80 text-[11px] text-slate-500">
          <p className="font-bold text-slate-700 tracking-wide">
            Signal OS • National Emergency Response & Spatial AI Coordination Architecture
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
            Designed for Bharat&apos;s First Responders • Mission Zero Lives Lost
          </p>
        </div>
      </div>
    </footer>
  );
}