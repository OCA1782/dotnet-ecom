// INTERNAL_API_URL: Docker-internal URL for SSR (not exposed to browser)
// NEXT_PUBLIC_API_URL: public URL baked into client bundle at build time
const API_BASE = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

// Process-level cache: API geçici olarak erişilemez olduğunda (deploy, restart, timeout)
// son başarılı settings yanıtını bu değişkende tutarız. Process yeniden başlayana kadar geçerli.
// Server restart sonrası kalıcılık için .env.local'daki NEXT_PUBLIC_FALLBACK_TEMPLATE devreye girer.
let _lastKnownSettings: Record<string, string> | null = null;

export async function getSettings(): Promise<Record<string, string>> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${API_BASE}/api/admin/settings`, {
      next: { revalidate: 60 },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error("settings fetch failed");
    const data = await res.json() as Record<string, string>;
    _lastKnownSettings = data; // başarılı yanıtı sakla
    return data;
  } catch {
    if (_lastKnownSettings) return _lastKnownSettings;
    // Son çare: .env.local'daki NEXT_PUBLIC_FALLBACK_TEMPLATE — process yeniden başlasa bile şablon korunur
    const fallback = process.env.NEXT_PUBLIC_FALLBACK_TEMPLATE;
    return fallback ? { CustomerTemplate: fallback } : {};
  }
}
