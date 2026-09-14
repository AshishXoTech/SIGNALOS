'use client';

import { useState } from 'react';
import { ShieldCheck, Radio } from 'lucide-react';

export default function GovHeader() {
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');

  return (
    <header className="w-full bg-gradient-to-r from-[#000040] via-[#000066] to-[#000040] text-white text-xs shadow-md relative z-50 border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        {/* Left: GoI Identity */}
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">🇮🇳</span>
          <div className="flex flex-col leading-tight border-l border-blue-400/30 pl-3">
            <span className="font-bold tracking-wider text-[11px] text-orange-200 uppercase">
              Government of India
            </span>
            <span className="text-[10px] text-gray-300 font-medium">
              भारत सरकार • Ministry of Home Affairs
            </span>
          </div>
        </div>

        {/* Right: Security Status & Utilities */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[11px] bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-400/20">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-bold tracking-wide">ERSS 112 Active Grid</span>
          </div>

          <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-md border border-white/10">
            <button
              type="button"
              onClick={() => setLanguage('EN')}
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition ${
                language === 'EN'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('HI')}
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition ${
                language === 'HI'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              हिं
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}