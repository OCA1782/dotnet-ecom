"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered,
  Image as ImageIcon, Video, Link2,
  Eye, Pencil,
  Type, Palette, X, Eraser,
} from "lucide-react";
import { api } from "@/lib/api";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const FONTS = [
  { value: "Arial, sans-serif",                label: "Arial" },
  { value: "Helvetica, Arial, sans-serif",      label: "Helvetica" },
  { value: "Georgia, serif",                   label: "Georgia" },
  { value: "'Times New Roman', serif",          label: "Times" },
  { value: "Verdana, sans-serif",              label: "Verdana" },
  { value: "Tahoma, Geneva, sans-serif",        label: "Tahoma" },
  { value: "'Trebuchet MS', Helvetica, sans-serif", label: "Trebuchet" },
  { value: "'Courier New', Courier, monospace", label: "Courier" },
  { value: "Impact, Charcoal, sans-serif",      label: "Impact" },
  { value: "'Palatino Linotype', 'Book Antiqua', serif", label: "Palatino" },
  { value: "Garamond, serif",                  label: "Garamond" },
  { value: "'Comic Sans MS', cursive",          label: "Comic Sans" },
];

const SIZES_PX = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 96];

function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function Sep() {
  return <div className="w-px h-5 bg-slate-200 mx-0.5 self-center shrink-0" />;
}

function isEffectivelyEmpty(html: string) {
  return !html || html === "<br>" || html === "<div><br></div>" || html.replace(/<[^>]*>/g, "").trim() === "";
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "İçerik yazın…",
  minHeight = 200,
}: RichTextEditorProps) {
  const editorRef      = useRef<HTMLDivElement>(null);
  const lastSentRef    = useRef<string>(value ?? "");
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const savedRangeRef  = useRef<Range | null>(null);

  const [tab,        setTab]        = useState<"edit" | "preview">("edit");
  const [imageModal, setImageModal] = useState(false);
  const [videoModal, setVideoModal] = useState(false);
  const [linkModal,  setLinkModal]  = useState(false);
  const [imageUrl,   setImageUrl]   = useState("");
  const [videoUrl,   setVideoUrl]   = useState("");
  const [linkUrl,    setLinkUrl]    = useState("");
  const [linkText,   setLinkText]   = useState("");
  const [uploading,  setUploading]  = useState(false);
  const [isEmpty,    setIsEmpty]    = useState(isEffectivelyEmpty(value));

  // Set initial innerHTML on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value ?? "";
      lastSentRef.current = value ?? "";
      setIsEmpty(isEffectivelyEmpty(value));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync when parent changes value externally (e.g. openEdit)
  useEffect(() => {
    if (editorRef.current && value !== lastSentRef.current) {
      editorRef.current.innerHTML = value ?? "";
      lastSentRef.current = value ?? "";
      setIsEmpty(isEffectivelyEmpty(value));
    }
  }, [value]);

  const fireChange = useCallback(() => {
    if (!editorRef.current) return;
    const html  = editorRef.current.innerHTML;
    const empty = isEffectivelyEmpty(html);
    const out   = empty ? "" : html;
    lastSentRef.current = out;
    setIsEmpty(empty);
    onChange(out);
  }, [onChange]);

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    if (!savedRangeRef.current || !editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(savedRangeRef.current); }
  }

  function exec(cmd: string, val?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    fireChange();
  }

  function setFontSizePx(px: number) {
    editorRef.current?.focus();
    document.execCommand("fontSize", false, "7");
    editorRef.current?.querySelectorAll('font[size="7"]').forEach(font => {
      const span = document.createElement("span");
      span.style.fontSize = `${px}px`;
      while (font.firstChild) span.appendChild(font.firstChild);
      font.parentNode?.replaceChild(span, font);
    });
    fireChange();
  }

  function insertImage(url: string) {
    if (!url.trim()) return;
    restoreSelection();
    exec("insertHTML", `<img src="${escapeAttr(url)}" alt="" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;display:block;" />`);
    setImageModal(false);
    setImageUrl("");
  }

  function insertVideo(url: string) {
    if (!url.trim()) return;
    restoreSelection();
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    const html = ytMatch
      ? `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:8px 0;border-radius:8px;">` +
        `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" ` +
        `style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:8px;" allowfullscreen></iframe></div>`
      : `<video src="${escapeAttr(url)}" controls style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;display:block;"></video>`;
    exec("insertHTML", html);
    setVideoModal(false);
    setVideoUrl("");
  }

  function insertLink(url: string, text: string) {
    if (!url.trim()) return;
    restoreSelection();
    if (text.trim()) {
      exec("insertHTML", `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer" style="color:#0d9488;text-decoration:underline;">${escapeAttr(text)}</a>`);
    } else {
      exec("createLink", url);
    }
    setLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      setImageUrl(url);
      insertImage(url);
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  }

  const TB  = "p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition shrink-0";
  const INP = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-200";

  return (
    <div className="border border-slate-200 rounded-xl overflow-visible bg-white focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-200 transition">

      {/* Tab bar */}
      <div className="flex border-b border-slate-100 bg-slate-50 rounded-t-xl overflow-hidden">
        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => setTab("edit")}
          className={`flex items-center gap-1.5 text-xs px-3 py-2 font-medium border-r border-slate-100 transition ${
            tab === "edit" ? "bg-white text-teal-600" : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
          }`}
        >
          <Pencil size={11} /> Düzenle
        </button>
        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => setTab("preview")}
          title="Önizleme"
          className={`flex items-center gap-1.5 text-xs px-3 py-2 font-medium transition ${
            tab === "preview" ? "bg-white text-teal-600" : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
          }`}
        >
          <Eye size={11} />
        </button>
      </div>

      {tab === "edit" ? (
        <>
          {/* Toolbar — mousedown prevented so editor keeps focus */}
          <div
            className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50"
            onMouseDown={e => e.preventDefault()}
          >
            {/* Text style */}
            <button type="button" className={TB} title="Kalın (Ctrl+B)"    onClick={() => exec("bold")}><Bold size={13} /></button>
            <button type="button" className={TB} title="İtalik (Ctrl+I)"   onClick={() => exec("italic")}><Italic size={13} /></button>
            <button type="button" className={TB} title="Altı Çizili (Ctrl+U)" onClick={() => exec("underline")}><Underline size={13} /></button>
            <button type="button" className={TB} title="Üstü Çizili"       onClick={() => exec("strikeThrough")}><Strikethrough size={13} /></button>

            <Sep />

            {/* Font family */}
            <select
              title="Yazı Tipi"
              onMouseDown={e => e.stopPropagation()}
              onChange={e => { exec("fontName", e.target.value); e.target.value = ""; }}
              defaultValue=""
              className="text-xs border-0 bg-transparent text-slate-600 hover:bg-slate-100 rounded px-1 py-1 outline-none cursor-pointer max-w-[80px]"
            >
              <option value="" disabled>Font</option>
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>

            {/* Font size */}
            <select
              title="Yazı Boyutu"
              onMouseDown={e => e.stopPropagation()}
              onChange={e => { if (e.target.value) setFontSizePx(Number(e.target.value)); e.target.value = ""; }}
              defaultValue=""
              className="text-xs border-0 bg-transparent text-slate-600 hover:bg-slate-100 rounded px-1 py-1 outline-none cursor-pointer max-w-[80px]"
            >
              <option value="" disabled>Boyut</option>
              {SIZES_PX.map(px => <option key={px} value={px}>{px}px</option>)}
            </select>

            <Sep />

            {/* Colors */}
            <label title="Yazı Rengi" className={`${TB} relative cursor-pointer`} onMouseDown={() => saveSelection()}>
              <Type size={13} />
              <input
                type="color"
                defaultValue="#000000"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={e => { restoreSelection(); exec("foreColor", e.target.value); }}
              />
            </label>
            <label title="Arka Plan Rengi" className={`${TB} relative cursor-pointer`} onMouseDown={() => saveSelection()}>
              <Palette size={13} />
              <input
                type="color"
                defaultValue="#ffff00"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={e => { restoreSelection(); exec("backColor", e.target.value); }}
              />
            </label>

            <Sep />

            {/* Alignment */}
            <button type="button" className={TB} title="Sola Hizala"  onClick={() => exec("justifyLeft")}><AlignLeft size={13} /></button>
            <button type="button" className={TB} title="Ortala"        onClick={() => exec("justifyCenter")}><AlignCenter size={13} /></button>
            <button type="button" className={TB} title="Sağa Hizala"  onClick={() => exec("justifyRight")}><AlignRight size={13} /></button>

            <Sep />

            {/* Lists */}
            <button type="button" className={TB} title="Sırasız Liste" onClick={() => exec("insertUnorderedList")}><List size={13} /></button>
            <button type="button" className={TB} title="Sıralı Liste"  onClick={() => exec("insertOrderedList")}><ListOrdered size={13} /></button>

            <Sep />

            {/* Media insert */}
            <button type="button" className={TB} title="Resim Ekle"     onClick={() => { saveSelection(); setImageModal(true); }}><ImageIcon size={13} /></button>
            <button type="button" className={TB} title="Video Ekle"     onClick={() => { saveSelection(); setVideoModal(true); }}><Video size={13} /></button>
            <button type="button" className={TB} title="Bağlantı Ekle" onClick={() => { saveSelection(); setLinkModal(true); }}><Link2 size={13} /></button>

            <Sep />

            {/* Clear */}
            <button type="button" className={TB} title="Biçimlendirmeyi Temizle" onClick={() => exec("removeFormat")}><Eraser size={13} /></button>
          </div>

          {/* Editable area */}
          <div className="relative">
            {isEmpty && (
              <div className="absolute top-3 left-4 text-sm text-slate-400 pointer-events-none select-none">
                {placeholder}
              </div>
            )}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={fireChange}
              className="px-4 py-3 text-sm text-slate-700 outline-none leading-relaxed"
              style={{ minHeight }}
            />
          </div>
        </>
      ) : (
        <div
          className="px-4 py-3 text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{
            __html: value || `<span style="color:#94a3b8;font-style:italic;">İçerik yok</span>`,
          }}
        />
      )}

      {/* ── Image Modal ── */}
      {imageModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">Resim Ekle</span>
              <button type="button" onClick={() => { setImageModal(false); setImageUrl(""); }} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            <input
              autoFocus
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://örnek.com/resim.jpg"
              className={INP}
              onKeyDown={e => { if (e.key === "Enter") insertImage(imageUrl); }}
            />
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="önizleme"
                className="w-full max-h-32 object-cover rounded-xl border border-slate-100"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <div className="flex gap-2">
              <label className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-teal-200 text-teal-700 text-xs font-semibold rounded-xl hover:bg-teal-50 cursor-pointer transition ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                {uploading ? "Yükleniyor…" : "Bilgisayardan"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                />
              </label>
              <button
                type="button"
                disabled={!imageUrl.trim() || uploading}
                onClick={() => insertImage(imageUrl)}
                className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Video Modal ── */}
      {videoModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">Video Ekle</span>
              <button type="button" onClick={() => { setVideoModal(false); setVideoUrl(""); }} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            <p className="text-xs text-slate-500">YouTube URL&apos;si veya doğrudan video bağlantısı girin.</p>
            <input
              autoFocus
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=… veya https://example.com/video.mp4"
              className={INP}
              onKeyDown={e => { if (e.key === "Enter") insertVideo(videoUrl); }}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setVideoModal(false); setVideoUrl(""); }}
                className="flex-1 py-2 border border-slate-200 text-slate-600 text-xs font-medium rounded-xl hover:bg-slate-50 transition">İptal</button>
              <button
                type="button"
                disabled={!videoUrl.trim()}
                onClick={() => insertVideo(videoUrl)}
                className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition"
              >Ekle</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Link Modal ── */}
      {linkModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">Bağlantı Ekle</span>
              <button type="button" onClick={() => { setLinkModal(false); setLinkUrl(""); setLinkText(""); }} className="p-1 rounded hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            <input
              autoFocus
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://örnek.com"
              className={INP}
            />
            <input
              value={linkText}
              onChange={e => setLinkText(e.target.value)}
              placeholder="Bağlantı metni (boş bırakılırsa seçili metin kullanılır)"
              className={INP}
              onKeyDown={e => { if (e.key === "Enter") insertLink(linkUrl, linkText); }}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setLinkModal(false); setLinkUrl(""); setLinkText(""); }}
                className="flex-1 py-2 border border-slate-200 text-slate-600 text-xs font-medium rounded-xl hover:bg-slate-50 transition">İptal</button>
              <button
                type="button"
                disabled={!linkUrl.trim()}
                onClick={() => insertLink(linkUrl, linkText)}
                className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition"
              >Ekle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
