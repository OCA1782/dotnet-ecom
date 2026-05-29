"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const STORAGE_KEY = "location_permission";

export default function LocationPermissionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const decision = localStorage.getItem(STORAGE_KEY);
    if (!decision) setVisible(true);
    else if (decision === "granted") sendLog(null, null);
  }, []);

  async function sendLog(lat: number | null, lon: number | null) {
    try {
      await api.post("/api/visitor/log", {
        page: window.location.pathname,
        referrer: document.referrer || null,
        latitude: lat,
        longitude: lon,
      });
    } catch { /* silent */ }
  }

  function handleAllow() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "granted");
    if (!navigator.geolocation) { sendLog(null, null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => sendLog(pos.coords.latitude, pos.coords.longitude),
      () => sendLog(null, null)
    );
  }

  function handleDeny() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "denied");
    sendLog(null, null);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 w-72 pointer-events-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center shrink-0 text-base">📍</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-xs">Konumunuzu paylaşır mısınız?</p>
            <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
              Yakınınızdaki kargo noktalarını gösterebiliriz.
            </p>
          </div>
          <button onClick={handleDeny} className="text-slate-300 hover:text-slate-500 shrink-0 transition">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={handleAllow}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-1.5 rounded-lg transition"
          >
            İzin Ver
          </button>
          <button
            onClick={handleDeny}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold py-1.5 rounded-lg transition"
          >
            Hayır
          </button>
        </div>
      </div>
    </div>
  );
}
