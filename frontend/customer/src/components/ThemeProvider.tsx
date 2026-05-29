"use client";

import { useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

const GOOGLE_FONTS_MAP: Record<string, string> = {
  "Inter":            "Inter",
  "Roboto":           "Roboto",
  "Open Sans":        "Open+Sans",
  "Lato":             "Lato",
  "Poppins":          "Poppins",
  "Nunito":           "Nunito",
  "DM Sans":          "DM+Sans",
  "Outfit":           "Outfit",
  "Plus Jakarta Sans":"Plus+Jakarta+Sans",
};

export default function ThemeProvider() {
  useEffect(() => {
    fetch(`${API_BASE}/api/settings/theme`)
      .then(r => r.ok ? r.json() : null)
      .then((theme: Record<string, string> | null) => {
        if (!theme) return;
        const root = document.documentElement;

        if (theme.PrimaryColor)   root.style.setProperty("--color-primary",   theme.PrimaryColor);
        if (theme.AccentColor)    root.style.setProperty("--color-accent",    theme.AccentColor);

        if (theme.CustomerFontFamily) {
          const fontName = theme.CustomerFontFamily;
          root.style.setProperty("--font-customer", `"${fontName}", sans-serif`);

          const googleName = GOOGLE_FONTS_MAP[fontName];
          if (googleName && fontName !== "Inter") {
            const linkId = "customer-google-font";
            if (!document.getElementById(linkId)) {
              const link = document.createElement("link");
              link.id = linkId;
              link.rel = "stylesheet";
              link.href = `https://fonts.googleapis.com/css2?family=${googleName}:wght@400;500;600;700&display=swap`;
              document.head.appendChild(link);
            }
          }
        }

        if (theme.FaviconUrl) {
          const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
          if (existing) existing.href = theme.FaviconUrl;
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
