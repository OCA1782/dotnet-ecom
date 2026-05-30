"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { AuthUser } from "@/types";

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const data = await api.post<LoginResult>("/api/auth/login", { email, password, rememberMe });
    localStorage.setItem(TOKEN_KEY, data.token);
    const authUser: AuthUser = {
      userId: data.userId, name: data.name, surname: data.surname, email: data.email, token: data.token, roles: data.roles, avatarUrl: data.avatarUrl,
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
        userId: data.userId, name: data.name, surname: data.surname, email: data.email, token: data.token, roles: data.roles, avatarUrl: data.avatarUrl,
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
