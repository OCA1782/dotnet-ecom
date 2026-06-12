"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { AnnouncementItem } from "./AnnouncementsSection";

const CAT_GRADIENTS: Record<string, string> = {
  kampanya:      "from-orange-600 via-rose-600 to-pink-700",
  duyuru:        "from-blue-700 via-indigo-700 to-violet-800",
  bilgilendirme: "from-teal-700 via-cyan-700 to-sky-800",
  etkinlik:      "from-purple-700 via-fuchsia-700 to-pink-800",
};

const INTERVAL_MS = 5000;

interface Props {
  announcements: AnnouncementItem[];
}

export default function HeroSlider({ announcements }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const dragStartX = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = 1 + announcements.length;

  const go = useCallback((idx: number) => {
    setCurrent(((idx % total) + total) % total);
  }, [total]);

  const next = useCallback(() => go(current + 1), [current, go]);
  const prev = useCallback(() => go(current - 1), [current, go]);

  useEffect(() => {
    if (paused || lightboxSrc || total <= 1) return;
    timerRef.current = setInterval(next, INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, lightboxSrc, next, total]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxSrc) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxSrc]);

  function openLightbox(src: string) {
    setLightboxSrc(src);
    setPaused(true);
  }

  function closeLightbox() {
    setLightboxSrc(null);
    setPaused(false);
  }

  function onDragStart(x: number) {
    dragStartX.current = x;
    setDragging(true);
    setPaused(true);
  }

  function onDragEnd(x: number) {
    if (!dragging) return;
    const delta = dragStartX.current - x;
    if (delta > 40) next();
    else if (delta < -40) prev();
    setDragging(false);
    setPaused(false);
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div
          className="relative rounded-3xl overflow-hidden select-none"
          style={{ cursor: dragging ? "grabbing" : "grab" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => { setPaused(false); setDragging(false); }}
          onMouseDown={e => onDragStart(e.clientX)}
          onMouseUp={e => onDragEnd(e.clientX)}
          onMouseMove={e => { if (dragging && Math.abs(e.clientX - dragStartX.current) > 2) e.preventDefault(); }}
          onTouchStart={e => onDragStart(e.touches[0].clientX)}
          onTouchEnd={e => onDragEnd(e.changedTouches[0].clientX)}
        >
          {/* Slides strip */}
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)`, willChange: "transform" }}
          >
            {/* ── Slide 0: Hero ── */}
            <div className="w-full shrink-0">
              <section className="relative bg-gradient-to-br from-[#19B7B1] via-[#0c9e98] to-[#12304A] text-white overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#FF7A45]/15 rounded-full blur-3xl" />
                </div>
                <div className="absolute right-8 bottom-4 w-72 h-72 pointer-events-none hidden lg:block opacity-[0.07]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-icon.svg" alt="" className="w-full h-full object-contain" style={{ filter: "brightness(100)" }} />
                </div>
                <div className="relative px-8 py-16 lg:px-16 lg:py-20">
                  <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-white/20">
                    🎉 Yeni Sezon İndirimleri Başladı
                  </span>
                  <h1 className="text-4xl lg:text-6xl font-extrabold mb-5 tracking-tight leading-tight max-w-2xl">
                    Keyifli Alışverişin<br />
                    <span className="text-[#FF7A45]">Yeni Adresi</span>
                  </h1>
                  <p className="text-teal-100 text-lg lg:text-xl mb-10 max-w-lg leading-relaxed">
                    Sevdiğin ürünleri keşfet, güvenle satın al,<br className="hidden lg:block" /> hızlı teslimatla kapına gelsin.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/urunler"
                      className="inline-flex items-center gap-2 bg-[#FF7A45] hover:bg-[#e86c3a] text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/20 text-base"
                      draggable={false}
                    >
                      Alışverişe Başla →
                    </Link>
                    <Link
                      href="/urunler"
                      className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-8 py-4 rounded-2xl backdrop-blur-sm transition border border-white/30 text-base"
                      draggable={false}
                    >
                      Kampanyaları Gör
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            {/* ── Announcement Slides ── */}
            {announcements.map((a) => {
              const grad = CAT_GRADIENTS[a.category] ?? "from-slate-700 via-slate-600 to-slate-800";
              const hasMedia = !!a.mediaUrl && a.mediaType !== "none";
              const isVideo = hasMedia && a.mediaType === "video";
              return (
                <div key={a.id} className="w-full shrink-0">
                  <section
                    className={`relative text-white overflow-hidden ${hasMedia ? "" : `bg-gradient-to-br ${grad}`}`}
                    style={{ minHeight: "340px" }}
                  >
                    {/* Medya arka plan */}
                    {hasMedia && (
                      <div className="absolute inset-0">
                        {isVideo ? (
                          <video
                            src={a.mediaUrl!}
                            className="w-full h-full object-cover"
                            autoPlay muted loop playsInline
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.mediaUrl!} alt={a.title} className="w-full h-full object-cover" draggable={false} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
                      </div>
                    )}
                    {/* Gradient overlay (no media) */}
                    {!hasMedia && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-black/10 rounded-full blur-3xl" />
                      </div>
                    )}

                    <div className="relative px-8 py-16 lg:px-16 lg:py-20 max-w-2xl">
                      <span className="inline-block text-xs font-bold uppercase tracking-widest bg-white/20 border border-white/25 backdrop-blur-sm px-3 py-1 rounded-full mb-5">
                        {a.category}
                      </span>
                      <h2 className="text-3xl lg:text-5xl font-extrabold mb-4 leading-tight drop-shadow">
                        {a.title}
                      </h2>
                      {a.summary && (
                        <p className="text-white/85 text-base lg:text-lg mb-8 leading-relaxed max-w-lg">
                          {a.summary}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {/* Video izle butonu */}
                        {isVideo && (
                          <button
                            onClick={e => { e.stopPropagation(); openLightbox(a.mediaUrl!); }}
                            draggable={false}
                            className="inline-flex items-center gap-2.5 bg-white text-slate-900 font-bold px-7 py-3.5 rounded-2xl hover:bg-white/90 active:scale-95 transition-all shadow-lg text-sm"
                          >
                            <span className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                              <svg width="10" height="12" viewBox="0 0 10 12" fill="white"><path d="M1 1l8 5-8 5V1z"/></svg>
                            </span>
                            Videoyu İzle
                          </button>
                        )}
                        {a.linkUrl && (
                          <Link
                            href={a.linkUrl}
                            draggable={false}
                            className={`inline-flex items-center gap-2 font-bold px-7 py-3.5 rounded-2xl transition-all shadow-lg text-sm ${
                              isVideo
                                ? "bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm"
                                : "bg-white text-slate-900 hover:bg-white/90"
                            }`}
                          >
                            {a.linkText || "İncele"} →
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Video slide sağ köşe play ikonı */}
                    {isVideo && (
                      <button
                        onClick={e => { e.stopPropagation(); openLightbox(a.mediaUrl!); }}
                        draggable={false}
                        aria-label="Videoyu izle"
                        className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex w-16 h-16 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-sm border border-white/30 items-center justify-center transition-all hover:scale-110"
                      >
                        <svg width="20" height="24" viewBox="0 0 20 24" fill="white"><path d="M2 2l16 10L2 22V2z"/></svg>
                      </button>
                    )}
                  </section>
                </div>
              );
            })}
          </div>

          {/* ── Prev / Next Buttons ── */}
          {total > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition z-10"
                aria-label="Önceki"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition z-10"
                aria-label="Sonraki"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </>
          )}

          {/* ── Dot Indicators ── */}
          {total > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {Array.from({ length: total }).map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); go(i); }}
                  className={`rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-6 h-2 bg-white"
                      : "w-2 h-2 bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* ── Progress bar ── */}
          {total > 1 && !paused && !lightboxSrc && (
            <div className="absolute bottom-0 left-0 h-0.5 bg-white/40 z-10"
              style={{ width: "100%", transformOrigin: "left" }}>
              <div
                key={current}
                className="h-full bg-white"
                style={{ animation: `slideProgress ${INTERVAL_MS}ms linear forwards` }}
              />
            </div>
          )}
        </div>

        <style>{`
          @keyframes slideProgress {
            from { width: 0% }
            to   { width: 100% }
          }
        `}</style>
      </div>

      {/* ── Video Lightbox ── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Kapat butonu */}
            <button
              onClick={closeLightbox}
              className="absolute -top-11 right-0 flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold transition"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Kapat
            </button>
            <video
              src={lightboxSrc}
              className="w-full rounded-2xl shadow-2xl bg-black"
              controls
              autoPlay
              style={{ maxHeight: "80vh" }}
            />
          </div>
        </div>
      )}
    </>
  );
}
