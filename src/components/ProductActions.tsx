"use client";

import { useState } from "react";
import SizePickerDB, { type SizeOption } from "@/components/SizePickerDB";
import AddToCartButton from "@/components/AddToCartButton";
import type { ProductVariantDetail } from "@/lib/actions/product";

interface ProductActionsProps {
  availableSizes: SizeOption[];
  variants: ProductVariantDetail[];
  productName: string;

  selectedColorId?: string;
}

export default function ProductActions({
  availableSizes,
  variants,
  productName,
  selectedColorId,
}: ProductActionsProps) {
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);

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