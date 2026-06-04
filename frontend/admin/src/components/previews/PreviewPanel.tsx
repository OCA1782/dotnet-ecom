"use client";

import { Eye, EyeOff } from "lucide-react";

interface PreviewPanelProps {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function PreviewToggleButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title="Canlı önizlemeyi aç/kapat"
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
        open
          ? "border-teal-400 bg-teal-50 text-teal-700"
          : "border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600"
      }`}
    >
      {open ? <EyeOff size={13} /> : <Eye size={13} />}
      Önizleme
    </button>
  );
}

export function PreviewPanel({ open, children }: Omit<PreviewPanelProps, "onToggle">) {
  if (!open) return null;
  return (
    <div className="w-[340px] shrink-0 border-l border-slate-100 flex flex-col overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 shrink-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">📱 Müşteri Görünümü</p>
        <p className="text-[10px] text-slate-400">Kayıt sonrası yansır</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-[#F7FAFA]">
        {children}
      </div>
    </div>
  );
}
