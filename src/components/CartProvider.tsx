"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart.store";
import { getCart } from "@/lib/actions/cart";

export default function CartProvider() {
  const setItems  = useCartStore((s) => s.setItems);
  const setLoading = useCartStore((s) => s.setLoading);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      setLoading(true);
      try {
        const result = await getCart();
        if (!cancelled && result.success) {
          setItems(result.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };

  }, []);

  return null;
}