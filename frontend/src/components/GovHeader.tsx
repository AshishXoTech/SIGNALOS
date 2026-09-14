'use client';

import { useState, useEffect } from 'react';
import { Radio, Clock } from 'lucide-react';

export default function GovHeader() {
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format to Indian Standard Time (Asia/Kolkata)
      const formatted = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setIstTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-gradient-to-r from-[#000033] via-[#000066] to-[#000033] text-white text-xs shadow-md relative z-50 border-b border-blue-500/20">
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

        {/* Right: Security Status, IST Clock & Utilities */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live IST Clock */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-400/20 text-gray-200 font-mono">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>{istTime || 'IST Clock'}</span>
            <span className="text-[9px] text-orange-300 font-sans font-bold">IST</span>
          </div>

          {/* Active Grid Status */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-400/20">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-bold tracking-wide">ERSS 112 Grid Active</span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-md border border-white/10">
            <button
              type="button"
              onClick={() => setLanguage('EN')}
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition cursor-pointer ${
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
              className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition cursor-pointer ${
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