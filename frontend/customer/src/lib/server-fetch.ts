const API_BASE = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";
const FETCH_TIMEOUT_MS = 15_000;

export async function serverFetch<T>(path: string, revalidate: number): Promise<T> {
  const url = `${API_BASE}${path}`;
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { next: { revalidate }, signal: controller.signal });
      if (!res.ok) throw new Error(`serverFetch ${res.status} ${path}`);
      return res.json() as Promise<T>;
    } catch (err) {
      lastErr = err;
      const name = err instanceof Error ? err.name : "";
      // Retry once on timeout or transient network failure, not on HTTP errors
      if (attempt === 0 && (name === "AbortError" || name === "TypeError")) {
        await new Promise(r => setTimeout(r, 300));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastErr;
}
