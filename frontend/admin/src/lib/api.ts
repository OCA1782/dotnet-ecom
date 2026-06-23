const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5124";

const TOKEN_KEY = "admin_token";
export const REFRESH_TOKEN_KEY = "admin_refresh_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function tryRefreshToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json() as { token?: string; refreshToken?: string };
    if (!data.token) return false;
    localStorage.setItem(TOKEN_KEY, data.token);
    if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function friendlyError(status: number, body: Record<string, string>): string {
  if (body.error) return body.error;
  if (body.title) return body.title;
  const map: Record<number, string> = {
    400: "Geçersiz istek. Lütfen bilgileri kontrol edin.",
    401: "Oturum süresi dolmuş. Lütfen tekrar giriş yapın.",
    403: "Bu işlem için yetkiniz yok.",
    404: "İstenen kayıt bulunamadı.",
    409: "Çakışma: Bu kayıt zaten mevcut.",
    422: "Gönderilen veriler işlenemedi.",
    429: "Çok fazla istek gönderildi. Lütfen bekleyin.",
    500: "Sunucu hatası. Lütfen daha sonra tekrar deneyin.",
    502: "Ağ geçidi hatası. Sunucuya ulaşılamıyor.",
    503: "Servis şu anda kullanılamıyor.",
  };
  return map[status] ?? `Beklenmeyen hata (${status}).`;
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error("Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.");
  }

  if (res.status === 401 && !isRetry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return request<T>(path, options, true);
    // Refresh başarısız — TÜM oturum verilerini temizle ve yönlendir
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem("admin_user");
      window.location.href = "/giris";
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>;
    throw new Error(friendlyError(res.status, body));
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ url: string }>("/api/admin/upload", { method: "POST", body: fd });
  },
};
