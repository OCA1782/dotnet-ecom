"use client";

import { CompareProvider } from "@/contexts/CompareContext";
import { I18nProvider } from "@/contexts/I18nContext";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <CompareProvider>
        {children}
      </CompareProvider>
    </I18nProvider>
  );
}
