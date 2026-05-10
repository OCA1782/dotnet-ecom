"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import type { ProductImage } from "@/types";

interface Props {
  images: ProductImage[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: Props) {
  const [current, setCurrent] = useState(() => {
    const idx = images.findIndex((i) => i.isMain);
    return idx >= 0 ? idx : 0;
  });
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, prev, next]);

  useEffect(() => {
    if (fullscreen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [fullscreen]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - (touchStartY.current ?? 0));
    if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  }

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-slate-100 rounded-2xl flex items-center justify-center">
        <span className="text-6xl">📦</span>
      </div>
    );
  }

  const img = images[current];

  return (
    <>
      <div>
        <div
          className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden group cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.imageUrl}
            alt={img.altText ?? productName}
            className="object-contain w-full h-full p-8 select-none"
            draggable={false}
          />

          <button
            onClick={() => setFullscreen(true)}
            className="absolute top-3 right-3 bg-white/80 hover:bg-white text-slate-700 rounded-xl p-2 opacity-0 group-hover:opacity-100 transition shadow-md"
          >
            <Maximize2 size={16} />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-700 rounded-xl p-2 opacity-0 group-hover:opacity-100 transition shadow-md"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-700 rounded-xl p-2 opacity-0 group-hover:opacity-100 transition shadow-md"
              >
                <ChevronRight size={22} />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "bg-slate-800 w-5" : "bg-slate-400 w-1.5"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {images.map((thumb, i) => (
              <button
                key={thumb.id}
                onClick={() => setCurrent(i)}
                className={`w-16 h-16 shrink-0 bg-slate-100 rounded-xl overflow-hidden border-2 transition-all ${
                  i === current ? "border-teal-500 shadow-md" : "border-transparent hover:border-slate-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb.imageUrl} alt={thumb.altText ?? ""} className="object-contain w-full h-full p-1" />
              </button>
            ))}
          </div>
        )}
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-white/50 text-sm">{current + 1} / {images.length}</span>
            <button
              onClick={() => setFullscreen(false)}
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-2 transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative min-h-0 px-14">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.imageUrl}
              alt={img.altText ?? productName}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 bg-white/10 hover:bg-white/20 text-white rounded-xl p-3 transition"
                >
                  <ChevronLeft size={26} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 bg-white/10 hover:bg-white/20 text-white rounded-xl p-3 transition"
                >
                  <ChevronRight size={26} />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 justify-center overflow-x-auto px-4 py-3 shrink-0">
              {images.map((thumb, i) => (
                <button
                  key={thumb.id}
                  onClick={() => setCurrent(i)}
                  className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    i === current ? "border-teal-400" : "border-white/20 hover:border-white/50"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb.imageUrl} alt={thumb.altText ?? ""} className="object-contain w-full h-full p-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
