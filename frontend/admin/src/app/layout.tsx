import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.AdminTitle || "Admin Panel";
  const rawFavicon = settings.AdminFaviconUrl || settings.FaviconUrl || "/logo-icon.png";
  const version = settings.SettingsVersion ?? "";
  const faviconUrl = version ? `${rawFavicon}?v=${version}` : rawFavicon;
  return {
    title,
    description: `${title} yönetim paneli`,
    icons: {
      icon: [{ url: faviconUrl, type: "image/png" }],
      apple: faviconUrl,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full bg-zinc-50 text-zinc-900">{children}</body>
    </html>
  );
}
