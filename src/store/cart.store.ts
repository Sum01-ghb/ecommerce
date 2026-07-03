"use client";

/**
 * cart.store.ts — Zustand global cart state
 *
 * Design decisions
 * ────────────────
 * • Cart items use UUID string IDs (matching the DB schema) instead of
 *   numeric IDs, fixing the previous number/string mismatch.
 * • `cartItemDbId` is the UUID of the `cart_items` row — needed for
 *   updateCartItem and removeCartItem server actions.
 * • `productVariantId` is stored so the server action can upsert correctly.
 * • Prices are stored in cents (integer) for consistent formatting.
 * • The store is initialized from the server on mount via `setItems`.
 * • `isOpen` drives both the side drawer and any cart-count indicator.
 */

import { create } from "zustand";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CartItem {
  /** UUID of the `cart_items` DB row — used for update/remove server actions */
  cartItemDbId: string;
  /** UUID of the `product_variants` row */
  productVariantId: string;
  /** UUID of the parent product (for linking to PDP) */
  productId: string;
  name: string;
  /** Category label e.g. "Men's Shoes" */
  category: string;
  sizeName: string;
  /** Display price in cents */
  price: number;
  imageUrl: string;
  quantity: number;
  /** Max available stock */
  inStock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;

  // ── Bulk operations ──────────────────────────────────────────────────────
  /** Replace entire items array (called after server fetch) */
  setItems: (items: CartItem[]) => void;
  /** Add or increment an item (called after addCartItem server action) */
  upsertItem: (item: CartItem) => void;
  /** Update quantity for a specific cart_items row */
  updateItemQuantity: (cartItemDbId: string, quantity: number) => void;
  /** Remove a specific cart_items row */
  removeItem: (cartItemDbId: string) => void;
  /** Empty the cart */
  clearItems: () => void;

  // ── UI helpers ───────────────────────────────────────────────────────────
  setIsOpen: (open: boolean) => void;
  toggleCart: () => void;
  setLoading: (loading: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>((set) => ({
  items: [],
  isOpen: false,
  isLoading: false,

  setItems: (items) => set({ items }),

  upsertItem: (item) =>
    set((state) => {
      const existing = state.items.find(
        (i) => i.cartItemDbId === item.cartItemDbId
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.cartItemDbId === item.cartItemDbId ? { ...i, ...item } : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  updateItemQuantity: (cartItemDbId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.cartItemDbId !== cartItemDbId)
          : state.items.map((i) =>
              i.cartItemDbId === cartItemDbId ? { ...i, quantity } : i
            ),
    })),

  removeItem: (cartItemDbId) =>
    set((state) => ({
      items: state.items.filter((i) => i.cartItemDbId !== cartItemDbId),
    })),

  clearItems: () => set({ items: [] }),

  setIsOpen: (open) => set({ isOpen: open }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  setLoading: (loading) => set({ isLoading: loading }),
}));
