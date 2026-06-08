"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import type { Lang } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { lang, setLang, langs } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = langs.find(l => l.code === lang) ?? langs[0];

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title="Language / Dil"
        className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-sm font-medium transition border ${
          open
            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
            : "text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100 hover:border-slate-200"
        }`}
      >
        <Globe size={13} className="shrink-0" />
        <span className="text-sm leading-none">{current.flag}</span>
        <span className="hidden sm:inline text-xs font-bold tracking-wide">{current.short}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={`opacity-50 transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 w-48 py-1">
          <div className="px-3 pt-2 pb-1.5 border-b border-slate-100 mb-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Globe size={9} />
              Dil / Language
            </p>
          </div>
          {langs.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code as Lang); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition ${
                lang === l.code
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-base w-6 text-center leading-none">{l.flag}</span>
              <span className="flex-1 text-left font-medium">{l.label}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider ${
                lang === l.code ? "bg-indigo-100 text-indigo-600" : "text-slate-300"
              }`}>
                {l.short}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
