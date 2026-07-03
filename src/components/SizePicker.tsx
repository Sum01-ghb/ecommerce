"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";
import type { ProductSize } from "@/lib/data/productDetail";

interface SizePickerProps {
  sizes: ProductSize[];
}

export default function SizePicker({ sizes }: SizePickerProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  return (
    <div>
      {}
      <div className="flex items-center justify-between mb-3">
        <p className="text-caption font-medium text-dark-900">Select Size</p>
        <button
          type="button"
          aria-label="View size guide"
          className="
            inline-flex items-center gap-1 text-footnote text-dark-700
            hover:text-dark-900 underline underline-offset-2 transition-colors cursor-pointer
            focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900
          "
        >
          <Ruler size={12} aria-hidden="true" />
          Size Guide
        </button>
      </div>

      {}
      <div
        role="group"
        aria-label="Available sizes"
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2"
      >
        {sizes.map((size) => {
          const isSelected = selectedSize === size.label;

          return (
            <button
              key={size.label}
              type="button"
              aria-pressed={isSelected}
              aria-disabled={!size.available}
              disabled={!size.available}
              onClick={() => {
                if (size.available) {
                  setSelectedSize(isSelected ? null : size.label);
                }
              }}
              className={`
                relative py-2.5 text-caption border rounded-sm transition-all duration-150 cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-1
                ${!size.available
                  ? "border-light-300 text-dark-500 cursor-not-allowed bg-light-200 opacity-50"
                  : isSelected
                    ? "border-dark-900 bg-dark-900 text-light-100 font-medium"
                    : "border-light-400 text-dark-900 bg-light-100 hover:border-dark-700"
                }
              `}
            >
              {size.label}
              {}
              {!size.available && (
                <span
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full"
                  >
                    <line
                      x1="0" y1="100" x2="100" y2="0"
                      stroke="#CCCCCC"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}