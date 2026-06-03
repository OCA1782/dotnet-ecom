"use client";

import { useState, useRef, useEffect } from "react";
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
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition"
        title="Dil Seç / Language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline font-medium">{current.code.toUpperCase()}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="opacity-50">
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 min-w-[130px]">
          {langs.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code as Lang); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition hover:bg-slate-50 ${
                lang === l.code ? "bg-teal-50 text-teal-700 font-semibold" : "text-slate-700"
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
