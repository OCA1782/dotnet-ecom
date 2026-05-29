"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, RefreshCw, LogOut } from "lucide-react";

const TOKEN_KEY = "admin_token";
const WARN_BEFORE_MS = 5 * 60 * 1000; // 5 dakika kala uyar
const CHECK_INTERVAL_MS = 30 * 1000;  // 30 saniyede bir kontrol

function getTokenExpiry(): number | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

interface Props {
  onRefresh: () => Promise<boolean>;
  onLogout: () => void;
}

export default function SessionTimeoutWarning({ onRefresh, onLogout }: Props) {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(() => {
    const expiry = getTokenExpiry();
    if (!expiry) return;
    const remaining = expiry - Date.now();
    if (remaining <= 0) {
      setMinutesLeft(0);
    } else if (remaining <= WARN_BEFORE_MS) {
      setMinutesLeft(Math.ceil(remaining / 60000));
      setDismissed(false);
    } else {
      setMinutesLeft(null);
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [check]);

  async function handleRefresh() {
    setRefreshing(true);
    const ok = await onRefresh();
    setRefreshing(false);
    if (ok) {
      setMinutesLeft(null);
      setDismissed(true);
    }
  }

  if (minutesLeft === null || dismissed) return null;

  const expired = minutesLeft === 0;

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-start gap-3 rounded-2xl shadow-xl border px-5 py-4 max-w-sm transition-all duration-300 ${
      expired
        ? "bg-red-50 border-red-200"
        : "bg-amber-50 border-amber-200"
    }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        expired ? "bg-red-100" : "bg-amber-100"
      }`}>
        <Clock size={18} className={expired ? "text-red-600" : "text-amber-600"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${expired ? "text-red-800" : "text-amber-800"}`}>
          {expired ? "Oturum süresi doldu" : `Oturum ${minutesLeft} dk içinde dolacak`}
        </p>
        <p className={`text-xs mt-0.5 ${expired ? "text-red-600" : "text-amber-600"}`}>
          {expired
            ? "Devam etmek için tekrar giriş yapın."
            : "Çalışmaya devam etmek için oturumu yenileyin."}
        </p>
        <div className="flex gap-2 mt-3">
          {!expired && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-700 transition disabled:opacity-60"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Yenileniyor..." : "Oturumu Yenile"}
            </button>
          )}
          <button
            onClick={() => { onLogout(); }}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
              expired
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-amber-300 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <LogOut size={12} />
            Çıkış Yap
          </button>
          {!expired && (
            <button
              onClick={() => setDismissed(true)}
              className="ml-auto text-xs text-amber-500 hover:text-amber-700 transition px-1"
            >
              Kapat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
