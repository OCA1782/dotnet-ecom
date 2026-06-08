"use client";

import { useState, useRef, useEffect } from "react";

const LANGS = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
] as const;

type Lang = typeof LANGS[number]["code"];
const LANG_KEY = "ecom:lang";

export default function LanguageSwitcher() {
  const [lang, setLangState] = useState<Lang>("tr");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY) as Lang | null;
    if (stored && LANGS.some(l => l.code === stored)) setLangState(stored);
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function chooseLang(code: Lang) {
    setLangState(code);
    localStorage.setItem(LANG_KEY, code);
    setOpen(false);
  }

  const current = LANGS.find(l => l.code === lang) ?? LANGS[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition"
        title="Dil Seç / Language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline font-medium">{current.code.toUpperCase()}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-50">
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
