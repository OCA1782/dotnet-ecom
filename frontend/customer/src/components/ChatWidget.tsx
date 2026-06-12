"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

interface ChatConfig {
  enabled: boolean;
  provider?: string;
  whatsAppNumber?: string;
  whatsAppWelcomeMessage?: string;
  telegramBotUsername?: string;
  n8nEnabled?: boolean;
}

interface Message {
  role: "user" | "bot";
  text: string;
}

const STORAGE_KEY = "chat_session";

function getOrCreateSession() {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export default function ChatWidget() {
  const { t } = useI18n();
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/chatbot/config`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: ChatConfig) => setConfig(d))
      .catch(() => setConfig({ enabled: false, provider: undefined }));
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (config === null) return null;
  if (!config.enabled) return null;

  const showWhatsApp = config.provider === "whatsapp" || config.provider === "both";
  const showTelegram = config.provider === "telegram" || config.provider === "both";
  const showInline = config.n8nEnabled;

  function whatsAppUrl() {
    const num = config?.whatsAppNumber?.replace(/\D/g, "");
    const msg = encodeURIComponent(config?.whatsAppWelcomeMessage ?? t("chat.subtitle"));
    return `https://wa.me/${num}?text=${msg}`;
  }

  function telegramUrl() {
    const username = config?.telegramBotUsername?.replace("@", "");
    return `https://t.me/${username}`;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text }]);
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: getOrCreateSession() }),
      });
      const data = await res.json();
      const reply = data.reply ?? data.output ?? data.message ?? JSON.stringify(data);
      setMessages(prev => [...prev, { role: "bot", text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: t("chat.error") }]);
    }
    setSending(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="bg-teal-600 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">{t("chat.title")}</p>
              <p className="text-teal-200 text-xs">{t("chat.subtitle")}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition">
              <X size={18} />
            </button>
          </div>

          {(showWhatsApp || showTelegram) && (
            <div className="px-4 py-3 flex gap-2 border-b border-slate-100">
              {showWhatsApp && (
                <a
                  href={whatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-2 rounded-xl transition"
                >
                  <WhatsAppIcon /> WhatsApp
                </a>
              )}
              {showTelegram && (
                <a
                  href={telegramUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2 rounded-xl transition"
                >
                  <TelegramIcon /> Telegram
                </a>
              )}
            </div>
          )}

          {!showWhatsApp && !showTelegram && !showInline && (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-slate-600 font-medium mb-1">{t("chat.fallback_title")}</p>
              <p className="text-xs text-slate-400 mb-4">{t("chat.fallback_desc")}</p>
              <a
                href={`mailto:${t("chat.fallback_email")}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-800 transition"
              >
                ✉️ {t("chat.fallback_email")}
              </a>
            </div>
          )}

          {showInline && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 max-h-64 min-h-[80px]">
                {messages.length === 0 && (
                  <p className="text-xs text-slate-400 text-center mt-4">{t("chat.inline_empty")}</p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        m.role === "user"
                          ? "bg-teal-600 text-white rounded-br-sm"
                          : "bg-slate-100 text-slate-800 rounded-bl-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-slate-400">
                      <span className="animate-pulse">...</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="px-3 py-2 border-t border-slate-100 flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder={t("chat.placeholder")}
                  className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition disabled:opacity-40"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg flex items-center justify-center transition"
        aria-label={t("chat.aria")}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
