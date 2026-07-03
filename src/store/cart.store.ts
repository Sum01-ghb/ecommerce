"use client";

import { create } from "zustand";

export interface CartItem {

  cartItemDbId: string;

  productVariantId: string;

  productId: string;
  name: string;

  category: string;
  sizeName: string;

  price: number;
  imageUrl: string;
  quantity: number;

  inStock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;

  setItems: (items: CartItem[]) => void;

  upsertItem: (item: CartItem) => void;

  updateItemQuantity: (cartItemDbId: string, quantity: number) => void;

  removeItem: (cartItemDbId: string) => void;

  clearItems: () => void;

  setIsOpen: (open: boolean) => void;
  toggleCart: () => void;
  setLoading: (loading: boolean) => void;
}

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