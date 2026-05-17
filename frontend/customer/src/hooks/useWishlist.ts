"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { WishlistItem } from "@/types";

export function useWishlist(isLoggedIn: boolean) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isLoggedIn) { setItems([]); return; }
    setLoading(true);
    try {
      const data = await api.get<WishlistItem[]>("/api/wishlist");
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const isInWishlist = (productId: string) => items.some(i => i.productId === productId);

  async function toggle(productId: string) {
    if (!isLoggedIn) return false;
    if (isInWishlist(productId)) {
      await api.delete(`/api/wishlist/${productId}`);
      setItems(prev => prev.filter(i => i.productId !== productId));
    } else {
      await api.post(`/api/wishlist/${productId}`, {});
      await fetchWishlist();
    }
    return true;
  }

  return { items, loading, isInWishlist, toggle, refresh: fetchWishlist };
}
