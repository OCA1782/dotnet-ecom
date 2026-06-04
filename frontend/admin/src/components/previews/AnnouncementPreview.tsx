"use client";

interface AnnouncementForm {
  title: string;
  summary: string;
  content: string;
  mediaUrl: string;
  mediaType: string;
  category: string;
  linkUrl: string;
  linkText: string;
  isActive: boolean;
}

const CAT_COLORS: Record<string, string> = {
  kampanya:      "bg-orange-100 text-orange-700",
  duyuru:        "bg-blue-100 text-blue-700",
  bilgilendirme: "bg-teal-100 text-teal-700",
  etkinlik:      "bg-purple-100 text-purple-700",
};
const CAT_HEADER: Record<string, { bg: string; icon: string }> = {
  kampanya:      { bg: "bg-orange-100",  icon: "🏷️" },
  duyuru:        { bg: "bg-blue-100",    icon: "📢" },
  bilgilendirme: { bg: "bg-teal-100",    icon: "ℹ️" },
  etkinlik:      { bg: "bg-purple-100",  icon: "🎉" },
};
const CAT_LABELS: Record<string, string> = {
  kampanya: "Kampanya", duyuru: "Duyuru", bilgilendirme: "Bilgilendirme", etkinlik: "Etkinlik",
};

export default function AnnouncementPreview({ form }: { form: AnnouncementForm }) {
  if (!form.title && !form.mediaUrl) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center h-48 text-slate-400 text-xs text-center p-4">
        Başlık veya medya ekleyin
      </div>
    );
  }

  const catColor = CAT_COLORS[form.category] ?? "bg-slate-100 text-slate-600";
  const catHeader = CAT_HEADER[form.category] ?? { bg: "bg-slate-100", icon: "📢" };
  const catLabel  = CAT_LABELS[form.category] ?? form.category;

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Duyuru Kartı</p>

      {/* Announcement card — replicates AnnouncementsSection.tsx */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {form.mediaUrl ? (
          <div className="h-40 overflow-hidden bg-slate-100">
            {form.mediaType === "video" ? (
              <video src={form.mediaUrl} className="w-full h-full object-cover" muted playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.mediaUrl} alt={form.title} className="w-full h-full object-cover" />
            )}
          </div>
        ) : (
          <div className={`h-16 flex items-center justify-center text-3xl ${catHeader.bg}`}>
            {catHeader.icon}
          </div>
        )}

        <div className="p-4">
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${catColor}`}>
            {catLabel}
          </span>
          <h3 className="font-bold text-slate-800 text-sm leading-snug mb-1.5">
            {form.title || "—"}
          </h3>
          {form.summary && (
            <p className="text-xs text-slate-500 line-clamp-3 mb-3">{form.summary}</p>
          )}
          {form.linkUrl && (
            <span className="inline-block text-xs font-semibold bg-teal-600 text-white px-4 py-1.5 rounded-xl">
              {form.linkText || "İncele →"}
            </span>
          )}
        </div>
      </div>

      {/* Content preview (if rich text exists) */}
      {form.content && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">İçerik Detay</p>
          <div
            className="text-xs text-slate-700 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: form.content }}
          />
        </div>
      )}

      {/* Status indicator */}
      <div className="flex gap-2 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${form.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {form.isActive ? "Aktif" : "Pasif"}
        </span>
        {form.mediaUrl && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
            {form.mediaType === "video" ? "Video" : "Görsel"}
          </span>
        )}
      </div>
    </div>
  );
}
