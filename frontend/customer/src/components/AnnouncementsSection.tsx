"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";

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

const CAT_COLORS: Record<string, string> = {
  kampanya: "bg-orange-100 text-orange-700",
  duyuru: "bg-blue-100 text-blue-700",
  bilgilendirme: "bg-teal-100 text-teal-700",
  etkinlik: "bg-purple-100 text-purple-700",
};

const CAT_HEADER: Record<string, { bg: string; icon: string }> = {
  kampanya: { bg: "bg-orange-100", icon: "🏷️" },
  duyuru: { bg: "bg-blue-100", icon: "📢" },
  bilgilendirme: { bg: "bg-teal-100", icon: "ℹ️" },
  etkinlik: { bg: "bg-purple-100", icon: "🎉" },
};

export default function AnnouncementsSection({ announcements }: { announcements: AnnouncementItem[] }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("");

  const tabs = [
    { value: "", label: t("announcements.all") },
    { value: "kampanya", label: t("announcements.campaign") },
    { value: "duyuru", label: t("announcements.announcement") },
    { value: "bilgilendirme", label: t("announcements.information") },
    { value: "etkinlik", label: t("announcements.event") },
  ] as const;

  const labels: Record<string, string> = {
    kampanya: t("announcements.campaign"),
    duyuru: t("announcements.announcement"),
    bilgilendirme: t("announcements.information"),
    etkinlik: t("announcements.event"),
  };

  const filtered = activeTab
    ? announcements.filter(a => a.category === activeTab)
    : announcements;

  if (announcements.length === 0) return null;

  return (
    <div className="bg-[#F7FAFA] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">{t("announcements.title")}</h2>
            <p className="text-slate-500 text-sm mt-1">{t("announcements.subtitle")}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
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
          <p className="text-slate-400 text-sm py-6 text-center">{t("announcements.empty")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                {item.mediaUrl ? (
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
                ) : (
                  <div className={`h-20 flex items-center justify-center text-3xl ${CAT_HEADER[item.category]?.bg ?? "bg-slate-100"}`}>
                    {CAT_HEADER[item.category]?.icon ?? "📢"}
                  </div>
                )}

                <div className="p-4">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${CAT_COLORS[item.category] ?? "bg-slate-100 text-slate-600"}`}>
                    {labels[item.category] ?? item.category}
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
                      {item.linkText || t("announcements.read_more")}
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
