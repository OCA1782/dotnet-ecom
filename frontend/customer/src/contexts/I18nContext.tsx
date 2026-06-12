"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { type Lang, translations, LANGS } from "@/lib/i18n";

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  langs: typeof LANGS;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'tr',
  setLang: () => {},
  t: (k) => k,
  langs: LANGS,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "tr";
    const saved = localStorage.getItem("ecom:lang") as Lang | null;
    return saved && translations[saved] ? saved : "tr";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('ecom:lang', l);
    document.cookie = `ecom_lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((key: string): string => {
    return translations[lang][key] ?? translations['tr'][key] ?? key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, langs: LANGS }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
