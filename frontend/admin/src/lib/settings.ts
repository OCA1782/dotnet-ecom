const API_BASE = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

export async function getSettings(): Promise<Record<string, string>> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${API_BASE}/api/admin/settings`, { cache: "no-store", signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}
