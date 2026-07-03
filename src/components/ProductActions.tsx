"use client";

/**
 * ProductActions.tsx
 *
 * Client wrapper for the PDP's interactive section:
 *   - SizePickerDB (size selection state)
 *   - AddToCartButton (calls server action when size is selected)
 *
 * Kept as a small, focused client boundary so the rest of the PDP
 * stays a server component.
 */

import { useState } from "react";
import SizePickerDB, { type SizeOption } from "@/components/SizePickerDB";
import AddToCartButton from "@/components/AddToCartButton";
import type { ProductVariantDetail } from "@/lib/actions/product";

interface ProductActionsProps {
  availableSizes: SizeOption[];
  variants: ProductVariantDetail[];
  productName: string;
  /** Currently selected color ID (for stock-per-color display) */
  selectedColorId?: string;
}

export default function ProductActions({
  availableSizes,
  variants,
  productName,
  selectedColorId,
}: ProductActionsProps) {
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);

  // Resolve the variant ID that matches the selected size (and color if present)
  const selectedVariant = selectedSizeId
    ? variants.find(
        (v) =>
          v.sizeId === selectedSizeId &&
          (selectedColorId ? v.colorId === selectedColorId : true)
      ) ?? variants.find((v) => v.sizeId === selectedSizeId)
    : null;

  return (
    <>
      <div className="my-5">
        <SizePickerDB
          availableSizes={availableSizes}
          variants={variants}
          selectedColorId={selectedColorId}
          onSizeChange={(sizeId) => setSelectedSizeId(sizeId)}
        />
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <AddToCartButton
          productVariantId={selectedVariant?.id ?? ""}
          productName={productName}
          disabled={!selectedVariant}
        />
      </div>
    </>
  );
}
