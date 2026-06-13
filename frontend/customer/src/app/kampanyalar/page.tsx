import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Campaign } from "@/types";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Kampanyalar",
    description: `${settings.SiteName || ""} — Tüm kampanyalar ve fırsatlar`.trim(),
  };
}

const SCHEME_GRADIENT: Record<string, string> = {
  orange: "from-[#FF7A45] to-[#d95f28]",
  teal:   "from-[#19B7B1] to-[#0c8f8a]",
  navy:   "from-[#12304A] to-[#1a4670]",
  amber:  "from-amber-400 to-orange-500",
  purple: "from-purple-500 to-violet-700",
  green:  "from-emerald-500 to-teal-600",
  rose:   "from-rose-500 to-pink-600",
  sky:    "from-sky-400 to-blue-600",
};

async function getAllCampaigns(): Promise<Campaign[]> {
  try { return await api.get<Campaign[]>("/api/campaigns"); }
  catch { return []; }
}

export default async function KampanyalarPage() {
  const campaigns = await getAllCampaigns();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero başlık */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
            <Link href="/" className="hover:text-teal-600 transition-colors">Ana Sayfa</Link>
            <span>›</span>
            <span className="text-slate-700 font-medium">Kampanyalar</span>
          </nav>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Kampanyalar</h1>
          <p className="text-slate-500 text-sm">Tüm güncel fırsatlar ve özel teklifler</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {campaigns.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🏷️</div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">Henüz kampanya yok</h2>
            <p className="text-slate-400 text-sm mb-6">Yakında yeni fırsatlar eklenecek.</p>
            <Link href="/" className="inline-block bg-teal-600 text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-teal-700 transition">
              Ana Sayfaya Dön
            </Link>
          </div>
        ) : (
          <>
            {/* Öne çıkan kampanyalar */}
            {campaigns.some(c => c.isFeatured) && (
              <div className="mb-10">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>⭐</span> Öne Çıkan Kampanyalar
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {campaigns.filter(c => c.isFeatured).map(c => (
                    <CampaignCard key={c.id} campaign={c} />
                  ))}
                </div>
              </div>
            )}

            {/* Diğer kampanyalar */}
            {campaigns.some(c => !c.isFeatured) && (
              <div>
                {campaigns.some(c => c.isFeatured) && (
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Diğer Kampanyalar</h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaigns.filter(c => !c.isFeatured).map(c => (
                    <CampaignCard key={c.id} campaign={c} compact />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CampaignCard({ campaign: c, compact = false }: { campaign: Campaign; compact?: boolean }) {
  const gradient = SCHEME_GRADIENT[c.colorScheme] ?? SCHEME_GRADIENT.orange;
  const styles = c.stylesJson ? (() => { try { return JSON.parse(c.stylesJson); } catch { return {}; } })() : {};
  const titleStyle = { color: styles.titleColor ?? "#ffffff", fontSize: compact ? undefined : (styles.titleFontSize ? `${styles.titleFontSize}px` : undefined), fontWeight: styles.titleFontWeight ?? "800" };
  const subtitleStyle = { color: styles.subtitleColor ?? "rgba(255,255,255,0.85)" };
  const btnStyle = { color: styles.linkTextColor ?? undefined, backgroundColor: styles.linkBgColor ?? "#ffffff" };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl text-white ${compact ? "p-6" : "p-8"}`}
      style={c.imageUrl ? { backgroundImage: `url(${c.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {!c.imageUrl && <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />}
      {c.imageUrl && <div className="absolute inset-0 bg-black/40" />}
      <div className={`absolute right-4 bottom-0 font-black text-white/15 leading-none select-none ${compact ? "text-[80px]" : "text-[110px]"}`}>{c.icon}</div>
      <div className="relative">
        {c.subtitle && (
          <p className={`font-semibold opacity-80 mb-1.5 ${compact ? "text-xs" : "text-sm"}`} style={subtitleStyle}>{c.subtitle}</p>
        )}
        <h3 className={`font-extrabold mb-3 leading-tight ${compact ? "text-xl" : "text-3xl"}`} style={titleStyle}>{c.title}</h3>
        {c.linkUrl && (
          <Link href={c.linkUrl} className={`inline-block font-bold rounded-xl hover:opacity-90 transition ${compact ? "text-xs px-4 py-2" : "text-sm px-6 py-2.5"}`} style={btnStyle}>
            {c.linkText || "İncele →"}
          </Link>
        )}
      </div>
    </div>
  );
}
