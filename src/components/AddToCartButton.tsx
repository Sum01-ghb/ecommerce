"use client";

/**
 * AddToCartButton.tsx
 *
 * Client component used in the Product Detail Page.
 * Connects the "Add to Bag" button to the cart server action and Zustand store.
 *
 * Props:
 *   - productVariantId: UUID of the selected variant
 *   - productName:      used in the aria-label
 *   - disabled:         true when no size has been selected
 */

import { ShoppingBag } from "lucide-react";
import { useTransition, useState } from "react";
import { useCartStore } from "@/store/cart.store";
import { addCartItem }  from "@/lib/actions/cart";

interface AddToCartButtonProps {
  productVariantId: string;
  productName: string;
  disabled?: boolean;
}

export default function AddToCartButton({
  productVariantId,
  productName,
  disabled = false,
}: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<"idle" | "added" | "error">("idle");
  const { upsertItem, setIsOpen } = useCartStore();

  function handleAdd() {
    if (disabled || isPending) return;

    startTransition(async () => {
      const result = await addCartItem(productVariantId);

      if (result.success) {
        upsertItem(result.data);
        setIsOpen(true);
        setFeedback("added");
        setTimeout(() => setFeedback("idle"), 2000);
      } else {
        setFeedback("error");
        setTimeout(() => setFeedback("idle"), 3000);
      }
    });
  }

  const label =
    feedback === "added"
      ? "Added to Bag!"
      : feedback === "error"
      ? "Failed — Try Again"
      : disabled
      ? "Select a Size"
      : isPending
      ? "Adding…"
      : "Add to Bag";

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={disabled || isPending}
      aria-label={`${label} — ${productName}`}
      className={`
        w-full flex items-center justify-center gap-2
        rounded-full py-3.5 text-caption font-medium
        transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2
        ${
          disabled
            ? "bg-light-300 text-dark-500 cursor-not-allowed"
            : feedback === "added"
            ? "bg-green text-light-100"
            : feedback === "error"
            ? "bg-red text-light-100"
            : "bg-dark-900 text-light-100 hover:bg-black"
        }
      `}
    >
      <ShoppingBag size={16} aria-hidden="true" />
      {label}
    </button>
  );
}
