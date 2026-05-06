"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Cart } from "@/types";

export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Cart>("/api/cart");
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(
    async (productId: string, quantity: number, variantId?: string) => {
      await api.post("/api/cart/add", { productId, variantId, quantity });
      await fetchCart();
    },
    [fetchCart]
  );

  const updateItem = useCallback(
    async (cartItemId: string, quantity: number) => {
      await api.put("/api/cart/update", { cartItemId, quantity });
      await fetchCart();
    },
    [fetchCart]
  );

  const removeItem = useCallback(
    async (cartItemId: string) => {
      await api.delete(`/api/cart/remove/${cartItemId}`);
      await fetchCart();
    },
    [fetchCart]
  );

  const clearCart = useCallback(async () => {
    await api.delete("/api/cart/clear");
    setCart(null);
  }, []);

  const applyCoupon = useCallback(
    async (code: string): Promise<string | null> => {
      try {
        await api.post("/api/cart/apply-coupon", { code });
        await fetchCart();
        return null;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Kupon uygulanamadı.";
        return msg;
      }
    },
    [fetchCart]
  );

  const removeCoupon = useCallback(async () => {
    await api.delete("/api/cart/remove-coupon");
    await fetchCart();
  }, [fetchCart]);

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return { cart, loading, fetchCart, addToCart, updateItem, removeItem, clearCart, applyCoupon, removeCoupon, itemCount };
}
