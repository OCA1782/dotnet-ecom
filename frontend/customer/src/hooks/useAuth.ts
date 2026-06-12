"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { AuthUser } from "@/types";
import { clearCartState, triggerCartRefetch } from "@/hooks/useCart";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const REFRESH_TOKEN_KEY = "refresh_token";

const authListeners = new Set<() => void>();
function broadcastAuthChange() { authListeners.forEach(l => l()); }

export interface PendingRegistration {
  userId: string;
  name: string;
  surname: string;
  email: string;
}

interface VerifyResult {
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  token: string | null;
  userId: string | null;
  name: string | null;
  surname: string | null;
  email: string | null;
}

export interface LoginResult {
  userId: string;
  name: string;
  surname: string;
  email: string;
  token: string;
  roles: string[];
  refreshToken?: string;
  requiresTwoFactor?: boolean;
}

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.get("/api/users/me").catch(() => {});
    }
    window.setTimeout(() => setLoading(false), 0);

    function handleAuthChange() {
      const s = localStorage.getItem(USER_KEY);
      if (s) {
        try { setUser(JSON.parse(s)); } catch { setUser(null); }
      } else {
        setUser(null);
      }
    }

    function handleForceLogout() {
      setUser(null);
      clearCartState();
    }

    authListeners.add(handleAuthChange);
    window.addEventListener("auth:force-logout", handleForceLogout);
    return () => {
      authListeners.delete(handleAuthChange);
      window.removeEventListener("auth:force-logout", handleForceLogout);
    };
  }, [user]);

  const completeLogin = useCallback((data: LoginResult) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    const authUser: AuthUser = {
      userId: data.userId,
      name: data.name,
      surname: data.surname,
      email: data.email,
      token: data.token,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(authUser);
    broadcastAuthChange();
    api.post("/api/cart/merge", {}).catch(() => {}).finally(() => triggerCartRefetch());
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const data = await api.post<LoginResult>("/api/auth/google", { idToken });
    if (data.requiresTwoFactor) return data;
    completeLogin(data);
    return data;
  }, [completeLogin]);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const data = await api.post<LoginResult>("/api/auth/login", { email, password, rememberMe });
    if (data.requiresTwoFactor) return data;
    completeLogin(data);
    return data;
  }, [completeLogin]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;
    try {
      const data = await api.post<LoginResult>("/api/auth/refresh", { refreshToken });
      localStorage.setItem(TOKEN_KEY, data.token);
      const authUser: AuthUser = {
        userId: data.userId,
        name: data.name,
        surname: data.surname,
        email: data.email,
        token: data.token,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      setUser(authUser);
      broadcastAuthChange();
      return true;
    } catch {
      return false;
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string, surname: string, phoneNumber?: string): Promise<PendingRegistration> => {
      const data = await api.post<PendingRegistration>("/api/auth/register", {
        email,
        password,
        name,
        surname,
        phoneNumber: phoneNumber || null,
        kvkkConsent: true,
      });
      return data;
    },
    []
  );

  const verifyEmail = useCallback(async (userId: string, code: string): Promise<VerifyResult> => {
    const data = await api.post<VerifyResult>("/api/auth/verify-email", { userId, code });
    if (data.token && data.userId && data.name && data.surname && data.email) {
      const authUser: AuthUser = { userId: data.userId, name: data.name, surname: data.surname, email: data.email, token: data.token };
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      setUser(authUser);
      broadcastAuthChange();
    }
    return data;
  }, []);

  const verifyTelegram = useCallback(async (userId: string, code: string): Promise<VerifyResult> => {
    const data = await api.post<VerifyResult>("/api/auth/verify-telegram", { userId, code });
    if (data.token && data.userId && data.name && data.surname && data.email) {
      const authUser: AuthUser = { userId: data.userId, name: data.name, surname: data.surname, email: data.email, token: data.token };
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      setUser(authUser);
      broadcastAuthChange();
    }
    return data;
  }, []);

  const updateUser = useCallback((updates: Partial<Pick<AuthUser, "name" | "surname">>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      broadcastAuthChange();
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    clearCartState();
    broadcastAuthChange();
  }, []);

  return { user, loading, login, loginWithGoogle, completeLogin, register, verifyEmail, verifyTelegram, logout, refreshSession, updateUser, isAuthenticated: !!user };
}
