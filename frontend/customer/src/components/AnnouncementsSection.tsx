"use client";

import { useState } from "react";
import Link from "next/link";

export interface AnnouncementItem {
  id: string;
  title: string;
  summary: string | null;
  mediaUrl: string | null;
  mediaType: string;
  category: string;
  linkUrl: string | null;
  linkText: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

const TABS = [
  { value: "",               label: "Tümü" },
  { value: "kampanya",       label: "Kampanya" },
  { value: "duyuru",         label: "Duyuru" },
  { value: "bilgilendirme",  label: "Bilgilendirme" },
  { value: "etkinlik",       label: "Etkinlik" },
] as const;

const CAT_COLORS: Record<string, string> = {
  kampanya:      "bg-orange-100 text-orange-700",
  duyuru:        "bg-blue-100 text-blue-700",
  bilgilendirme: "bg-teal-100 text-teal-700",
  etkinlik:      "bg-purple-100 text-purple-700",
};

const CAT_LABELS: Record<string, string> = {
  kampanya:      "Kampanya",
  duyuru:        "Duyuru",
  bilgilendirme: "Bilgilendirme",
  etkinlik:      "Etkinlik",
};

export default function AnnouncementsSection({ announcements }: { announcements: AnnouncementItem[] }) {
  const [activeTab, setActiveTab] = useState("");

  const filtered = activeTab
    ? announcements.filter(a => a.category === activeTab)
    : announcements;

  if (announcements.length === 0) return null;

  return (
    <div className="bg-[#F7FAFA] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Duyurular</h2>
            <p className="text-slate-500 text-sm mt-1">Kampanyalar, haberler ve etkinlikler</p>
          </div>
        </div>

        {/* Sekme filtreleri */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                activeTab === tab.value
                  ? "bg-teal-600 text-white shadow"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-slate-400 text-sm py-6 text-center">Bu kategoride duyuru bulunmuyor.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                {item.mediaUrl && (
                  <div className="h-44 overflow-hidden bg-slate-100">
                    {item.mediaType === "video" ? (
                      <video
                        src={item.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.mediaUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                )}

                <div className="p-4">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${CAT_COLORS[item.category] ?? "bg-slate-100 text-slate-600"}`}>
                    {CAT_LABELS[item.category] ?? item.category}
                  </span>

                  <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mb-1.5">{item.title}</h3>

                  {item.summary && (
                    <p className="text-xs text-slate-500 line-clamp-3 mb-3">{item.summary}</p>
                  )}

                  {item.linkUrl && (
                    <Link
                      href={item.linkUrl}
                      className="inline-block mt-1 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-xl transition"
                    >
                      {item.linkText || "İncele →"}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
