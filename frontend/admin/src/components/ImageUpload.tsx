"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { ImagePlus, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  previewSize?: "sm" | "md";
}

export default function ImageUpload({ value, onChange, label, previewSize = "md" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewCls = previewSize === "sm"
    ? "w-16 h-16"
    : "w-24 h-24";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      onChange(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Yüklenemedi.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-semibold text-slate-600">{label}</p>}
      <div className="flex items-center gap-3">
        {/* Preview */}
        <div className={`${previewCls} rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0`}>
          {value
            ? <img src={value} alt="" className="object-contain w-full h-full p-1" /> // eslint-disable-line @next/next/no-img-element
            : <ImagePlus size={20} className="text-slate-300" />
          }
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <label className={`inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold px-3 py-1.5 rounded-xl border transition
            ${uploading ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-white text-teal-700 border-teal-300 hover:bg-teal-50"}`}>
            <ImagePlus size={13} />
            {uploading ? "Yükleniyor..." : value ? "Değiştir" : "Resim Yükle"}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={handleFile}
            />
          </label>

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition w-fit"
            >
              <X size={11} /> Kaldır
            </button>
          )}

          {value && (
            <p className="text-xs text-slate-400 truncate max-w-[200px]" title={value}>
              {value.split("/").pop()}
            </p>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
