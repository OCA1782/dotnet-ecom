"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ShoppingCart, AlertTriangle, MessageSquare, X } from "lucide-react";
import { api } from "@/lib/api";

interface NotificationItem {
  type: "order" | "stock" | "review";
  title: string;
  body: string;
  link: string;
  createdAt: string;
}

interface NotificationsDto {
  totalCount: number;
  items: NotificationItem[];
}

const TYPE_ICON = {
  order: ShoppingCart,
  stock: AlertTriangle,
  review: MessageSquare,
} as const;

const TYPE_COLOR = {
  order: "text-teal-600 bg-teal-50",
  stock: "text-amber-600 bg-amber-50",
  review: "text-violet-600 bg-violet-50",
} as const;

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

export default function NotificationsPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get<NotificationsDto>("/api/admin/notifications");
      setData(res);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const count = data?.totalCount ?? 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-800">Bildirimler</span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
              <X size={16} />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {loading && !data && (
              <div className="px-4 py-6 text-center text-sm text-slate-400">Yükleniyor...</div>
            )}
            {!loading && data?.items.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-400">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                Bildirim yok
              </div>
            )}
            {data?.items.map((item, i) => {
              const Icon = TYPE_ICON[item.type];
              const color = TYPE_COLOR[item.type];
              return (
                <button
                  key={i}
                  onClick={() => { setOpen(false); router.push(item.link); }}
                  className="w-full flex gap-3 px-4 py-3 hover:bg-slate-50 transition text-left"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700">{item.title}</p>
                    <p className="text-xs text-slate-500 truncate">{item.body}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(item.createdAt)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
            <button
              onClick={fetchNotifications}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium transition"
            >
              Yenile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
