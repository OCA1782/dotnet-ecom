"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import type { AuthUser } from "@/types";
import { normalizeAdminRoles } from "@/lib/roles";

const TOKEN_KEY = "admin_token";
const USER_KEY = "admin_user";
const REFRESH_TOKEN_KEY = "admin_refresh_token";

interface LoginResult {
  userId: string;
  name: string;
  surname: string;
  email: string;
  token: string;
  roles: string[];
  refreshToken?: string;
  avatarUrl?: string;
}

export function useAdminAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      // Token yoksa user kaydı geçersiz — döngüyü önlemek için temizle
      if (!localStorage.getItem(TOKEN_KEY)) {
        localStorage.removeItem(USER_KEY);
        return null;
      }
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        const normalized = { ...parsed, roles: normalizeAdminRoles(parsed.roles) };
        if ((parsed.roles ?? []).join("|") !== normalized.roles.join("|")) {
          localStorage.setItem(USER_KEY, JSON.stringify(normalized));
        }
        return normalized;
      } catch {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
    return null;
  });
  const loading = false;
  const initialUserRef = useRef(user);

  useEffect(() => {
    if (!initialUserRef.current) return;
    // Token yoksa arka plan çağrısı yapma — useState initializer zaten null döndürdü
    if (!localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(USER_KEY);
      return;
    }
    // Arka planda profil tazelemesi — farklı sekmede yapılan ad/soyad güncellemelerini yakalar
    api.get<{ name: string; surname: string; avatarUrl?: string | null }>("/api/users/me")
      .then(data => {
        setUser(prev => {
          if (!prev) return prev;
          const updated = { ...prev, name: data.name, surname: data.surname, avatarUrl: data.avatarUrl ?? prev.avatarUrl };
          localStorage.setItem(USER_KEY, JSON.stringify(updated));
          return updated;
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function onAvatarChanged(e: Event) {
      const detail = (e as CustomEvent<{ userId?: string; avatarUrl?: string }>).detail;
      // Sadece kendi avatarı değiştiyse header'ı güncelle
      const storedRaw = localStorage.getItem(USER_KEY);
      if (storedRaw && detail?.userId) {
        try {
          const stored = JSON.parse(storedRaw) as { userId?: string };
          if (stored.userId !== detail.userId) return;
        } catch { return; }
      }
      try {
        const data = await api.get<{ avatarUrl?: string | null }>("/api/users/me");
        const freshUrl = data.avatarUrl ?? undefined;
        setUser(prev => {
          if (!prev || prev.avatarUrl === freshUrl) return prev;
          const updated = { ...prev, avatarUrl: freshUrl };
          localStorage.setItem(USER_KEY, JSON.stringify(updated));
          return updated;
        });
      } catch {
        // ignore — header stays as-is on network error
      }
    }
    window.addEventListener("ecom:avatar-changed", onAvatarChanged);
    return () => window.removeEventListener("ecom:avatar-changed", onAvatarChanged);
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const data = await api.post<LoginResult>("/api/auth/login", { email, password, rememberMe });
    localStorage.setItem(TOKEN_KEY, data.token);
    const authUser: AuthUser = {
      userId: data.userId, name: data.name, surname: data.surname, email: data.email, token: data.token, roles: normalizeAdminRoles(data.roles), avatarUrl: data.avatarUrl,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    setUser(authUser);
    return data;
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;
    try {
      const data = await api.post<LoginResult>("/api/auth/refresh", { refreshToken });
      localStorage.setItem(TOKEN_KEY, data.token);
      const authUser: AuthUser = {
        userId: data.userId, name: data.name, surname: data.surname, email: data.email, token: data.token, roles: normalizeAdminRoles(data.roles), avatarUrl: data.avatarUrl,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      setUser(authUser);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
  }, []);

  return { user, loading, login, logout, refreshSession, isAuthenticated: !!user };
}
