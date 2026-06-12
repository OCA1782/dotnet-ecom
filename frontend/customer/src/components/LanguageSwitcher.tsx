"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/contexts/I18nContext";
import type { Lang } from "@/lib/i18n";

const LANGS = [
  { code: "tr" as Lang, label: "Türkçe", flag: "🇹🇷" },
  { code: "en" as Lang, label: "English", flag: "🇬🇧" },
  { code: "de" as Lang, label: "Deutsch", flag: "🇩🇪" },
  { code: "es" as Lang, label: "Español", flag: "🇪🇸" },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function chooseLang(code: Lang) {
    setLang(code);
    setOpen(false);
    window.location.reload();
  }

  const current = LANGS.find(l => l.code === lang) ?? LANGS[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition"
        title="Dil Seç / Language"
      >
        <span className="font-medium">{current.code.toUpperCase()}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-50">
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 min-w-[130px]">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => chooseLang(l.code)}
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
