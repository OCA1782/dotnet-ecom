"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { AuthUser } from "@/types";

const TOKEN_KEY = "token";
const USER_KEY = "user";

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

export function useAuth() {
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
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthUser>("/api/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
    return data;
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
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return { user, loading, login, register, verifyEmail, verifyTelegram, logout, isAuthenticated: !!user };
}
