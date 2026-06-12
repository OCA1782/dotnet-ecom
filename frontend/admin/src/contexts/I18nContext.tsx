"use client";

import { createContext, useContext, useState } from "react";
import { LANGS, LANG_KEY, translate, type Lang } from "@/lib/i18n";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
  langs: typeof LANGS;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "tr",
  setLang: () => {},
  t: (key, fallback) => fallback ?? key,
  langs: LANGS,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "tr";
    const stored = window.localStorage.getItem(LANG_KEY) as Lang | null;
    return stored && LANGS.some(l => l.code === stored) ? stored : "tr";
  });

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(LANG_KEY, l);
  }

  function t(key: string, fallback?: string) {
    return translate(lang, key, fallback);
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t, langs: LANGS }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() { return useContext(I18nContext); }
