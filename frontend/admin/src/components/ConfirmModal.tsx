"use client";

import { X } from "lucide-react";

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title, message, confirmLabel = "Onayla", cancelLabel = "Vazgeç",
  danger = false, icon, children, onConfirm, onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          </div>
          <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          {children && <div className="mt-3">{children}</div>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 font-medium hover:bg-slate-50 transition">
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
