"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Cart } from "@/types";

// ── Module-level shared state (same pattern as useAuth authListeners) ──────
// All useCart() instances share the same cart data.
let _cachedCart: Cart | null = null;
const _stateListeners  = new Set<(cart: Cart | null) => void>();
const _refetchTriggers = new Set<() => void>();

function _broadcastState(cart: Cart | null) {
  _cachedCart = cart;
  _stateListeners.forEach(fn => fn(cart));
}

/** Called by useAuth on logout — immediately clears the badge for all instances. */
export function clearCartState() {
  _broadcastState(null);
}

/** Called by useAuth after login+merge — makes all mounted instances refetch. */
export function triggerCartRefetch() {
  _refetchTriggers.forEach(fn => fn());
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useCart() {
  // Initialize from module cache so new instances show current cart instantly
  const [cart, setCart]     = useState<Cart | null>(_cachedCart);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Cart>("/api/cart");
      _broadcastState(data);        // updates ALL instances, not just this one
    } catch {
      _broadcastState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Subscribe this instance to shared state updates
    _stateListeners.add(setCart);
    // Register this instance's fetchCart for cross-instance refetch triggers
    _refetchTriggers.add(fetchCart);
    return () => {
      _stateListeners.delete(setCart);
      _refetchTriggers.delete(fetchCart);
    };
  }, [fetchCart]);

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

  const toggleSelection = useCallback(
    async (cartItemId: string, isSelected: boolean) => {
      // Optimistic update — broadcast immediately
      const updated: Cart | null = _cachedCart
        ? { ..._cachedCart, items: _cachedCart.items.map(i => i.cartItemId === cartItemId ? { ...i, isSelected } : i) }
        : null;
      _broadcastState(updated);
      try {
        await api.patch(`/api/cart/items/${cartItemId}/select`, { isSelected });
      } catch {
        await fetchCart(); // rollback on error
      }
    },
    [fetchCart]
  );

  const clearCart = useCallback(async () => {
    await api.delete("/api/cart/clear");
    _broadcastState(null);
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

  const selectedCount = cart?.items.filter(i => i.isSelected).reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const itemCount     = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return {
    cart, loading, fetchCart,
    addToCart, updateItem, removeItem, toggleSelection, clearCart,
    applyCoupon, removeCoupon,
    itemCount, selectedCount,
  };
}
