"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { ProductListItem } from "@/types";

const MAX = 4;

interface CompareCtx {
  products: ProductListItem[];
  addProduct: (p: ProductListItem) => boolean;
  removeProduct: (id: string) => void;
  clearProducts: () => void;
  isComparing: (id: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareCtx | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductListItem[]>([]);

  const addProduct = useCallback((p: ProductListItem): boolean => {
    let added = false;
    setProducts(prev => {
      if (prev.find(x => x.id === p.id) || prev.length >= MAX) return prev;
      added = true;
      return [...prev, p];
    });
    return added;
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(x => x.id !== id));
  }, []);

  const clearProducts = useCallback(() => setProducts([]), []);

  const isComparing = useCallback((id: string) => products.some(x => x.id === id), [products]);

  return (
    <CompareContext.Provider value={{ products, addProduct, removeProduct, clearProducts, isComparing, isFull: products.length >= MAX }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be within CompareProvider");
  return ctx;
}
