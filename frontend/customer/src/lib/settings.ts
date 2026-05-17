const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

export async function getSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/settings`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}
