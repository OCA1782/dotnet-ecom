"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";

const REMEMBER_EMAIL_KEY = "admin_remember_email";
const REMEMBER_ME_KEY    = "admin_remember_me";

interface Props {
  siteTitle: string;
  logoUrl: string;
}

function LoginBrandName({ title }: { title: string }) {
  const words = title.trim().split(/\s+/);
  const main = words.length >= 3 ? words.slice(0, -1).join(" ") : title;
  const sub = words.length >= 3 ? words[words.length - 1] : null;
  return (
    <div className="flex flex-col items-center" style={{ gap: "3px" }}>
      <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        {main}
      </span>
      {sub ? (
        <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#5eead4", lineHeight: 1 }}>
          {sub}
        </span>
      ) : (
        <span className="text-slate-400 text-xs">Admin Paneli</span>
      )}
    </div>
  );
}

export default function AdminLoginForm({ siteTitle, logoUrl }: Props) {
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    const saved = localStorage.getItem(REMEMBER_ME_KEY) === "1";
    return saved ? (localStorage.getItem(REMEMBER_EMAIL_KEY) ?? "") : "";
  });
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(REMEMBER_ME_KEY) === "1";
  });
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const router = useRouter();

  // Login sayfası açıldığında eski/geçersiz oturum verilerini temizle
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      localStorage.removeItem("admin_user");
      localStorage.removeItem("admin_refresh_token");
    }
  }, []);

  // "Beni hatırla" durumu değiştiğinde veya email güncellendiğinde anında kaydet
  useEffect(() => {
    if (rememberMe && email) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
      localStorage.setItem(REMEMBER_ME_KEY, "1");
    } else if (!rememberMe) {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  }, [rememberMe, email]);

  function handlePasswordKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    setCapsOn(e.getModifierState("CapsLock"));
  }

  function handlePasswordBlur() {
    setCapsOn(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, rememberMe);
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        localStorage.setItem(REMEMBER_ME_KEY, "1");
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1c2044] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={siteTitle} className="w-full h-full object-contain p-1"
              onError={e => { (e.currentTarget as HTMLImageElement).src = "/logo-icon.svg"; }} />
          </div>
          <LoginBrandName title={siteTitle} />
          {siteTitle.trim().split(/\s+/).length >= 3 && (
            <p className="text-slate-400 text-sm mt-2">Yönetim paneline giriş yapın</p>
          )}
          {siteTitle.trim().split(/\s+/).length < 3 && (
            <p className="text-slate-400 text-sm mt-1">Yönetim paneline giriş yapın</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  onBlur={handlePasswordBlur}
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 pr-10 text-sm text-slate-900 bg-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {capsOn && (
                <div className="mt-1.5 flex items-center gap-1.5 text-amber-600 text-xs">
                  <TriangleAlert size={13} />
                  <span>Caps Lock açık</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-400 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm text-slate-600 cursor-pointer select-none">
                Beni hatırla (30 gün)
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white font-semibold py-2.5 rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
