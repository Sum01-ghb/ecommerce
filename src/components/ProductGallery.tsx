"use client";

/**
 * ProductGallery.tsx — Client component
 *
 * Renders the main product image alongside a vertical thumbnail strip
 * on desktop and a horizontal scroll strip on mobile.
 *
 * Variant swatches let the user switch colour — selecting a swatch
 * resets the gallery to that variant's first image.
 *
 * Accessibility:
 *   • Thumbnail buttons are keyboard-focusable with visible focus rings.
 *   • Arrow-key navigation across thumbnails.
 *   • Swatch buttons carry aria-label + aria-pressed.
 *   • ImageOff empty-state renders when no images are available.
 */

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Check, ImageOff } from "lucide-react";
import type { ProductVariant, ProductVariantImage } from "@/lib/data/productDetail";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface ProductGalleryProps {
  variants: ProductVariant[];
  /** Optional badge text shown over the main image (e.g. "★ Highly Rated") */
  badge?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton — shown while the real gallery mounts
// ─────────────────────────────────────────────────────────────────────────────

export function ProductGallerySkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      {/* Thumbnail strip skeleton */}
      <div className="hidden sm:flex flex-col gap-2 w-16 flex-shrink-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-16 h-16 bg-light-300 rounded-sm" />
        ))}
      </div>
      {/* Main image skeleton */}
      <div className="flex-1 aspect-square bg-light-300 rounded-sm" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function GalleryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center aspect-square w-full bg-light-200 rounded-sm gap-3">
      <ImageOff size={48} className="text-dark-500" aria-hidden="true" />
      <p className="text-caption text-dark-500">No image available</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Thumbnail button
// ─────────────────────────────────────────────────────────────────────────────

interface ThumbnailProps {
  image: ProductVariantImage;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent, index: number) => void;
}

function Thumbnail({ image, index, isActive, onSelect, onKeyDown }: ThumbnailProps) {
  return (
    <button
      type="button"
      aria-label={image.alt}
      aria-pressed={isActive}
      onClick={() => onSelect(index)}
      onKeyDown={(e) => onKeyDown(e, index)}
      className={`
        relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-sm transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-1
        ${isActive
          ? "ring-2 ring-dark-900"
          : "ring-1 ring-light-400 hover:ring-dark-500"
        }
      `}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="64px"
        className="object-cover object-center bg-light-200"
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Colour swatch button
// ─────────────────────────────────────────────────────────────────────────────

interface SwatchProps {
  variant: ProductVariant;
  isActive: boolean;
  onSelect: () => void;
}

function Swatch({ variant, isActive, onSelect }: SwatchProps) {
  // Use the variant's first image as the swatch thumbnail
  const previewImage = variant.images[0];

  return (
    <button
      type="button"
      aria-label={`${variant.colorName}${isActive ? " — selected" : ""}`}
      aria-pressed={isActive}
      onClick={onSelect}
      className={`
        relative w-12 h-12 overflow-hidden rounded-sm transition-all duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-1
        ${isActive
          ? "ring-2 ring-dark-900"
          : "ring-1 ring-light-300 hover:ring-dark-500"
        }
      `}
    >
      {previewImage ? (
        <Image
          src={previewImage.src}
          alt={variant.colorName}
          fill
          sizes="48px"
          className="object-cover object-center bg-light-200"
        />
      ) : (
        <span
          className="block w-full h-full"
          style={{ backgroundColor: variant.hexCode }}
        />
      )}
      {/* Selection check overlay */}
      {isActive && (
        <span className="absolute inset-0 flex items-center justify-center bg-dark-900/20">
          <Check size={14} className="text-light-100 drop-shadow-sm" aria-hidden="true" />
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductGallery({ variants, badge }: ProductGalleryProps) {
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [activeImageIndex,   setActiveImageIndex]   = useState(0);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const activeVariant = variants[activeVariantIndex];
  const images        = activeVariant?.images ?? [];
  const activeImage   = images[activeImageIndex];

  // Switch variant — reset image index to 0
  const handleVariantChange = useCallback((variantIdx: number) => {
    setActiveVariantIndex(variantIdx);
    setActiveImageIndex(0);
  }, []);

  // Select a thumbnail
  const handleThumbnailSelect = useCallback((imageIdx: number) => {
    setActiveImageIndex(imageIdx);
  }, []);

  // Arrow key navigation on thumbnails
  const handleThumbnailKeyDown = useCallback(
    (e: React.KeyboardEvent, imageIdx: number) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const next = Math.min(imageIdx + 1, images.length - 1);
        setActiveImageIndex(next);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = Math.max(imageIdx - 1, 0);
        setActiveImageIndex(prev);
      }
    },
    [images.length]
  );

  // Prev / Next arrows on the main image
  const handlePrev = useCallback(() => {
    setActiveImageIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleNext = useCallback(() => {
    setActiveImageIndex((i) => Math.min(i + 1, images.length - 1));
  }, [images.length]);

  // Guard: no variants / no images at all
  if (variants.length === 0 || images.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <GalleryEmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Gallery layout ──────────────────────────────────────────────── */}
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        {/* Thumbnail strip — vertical on desktop, horizontal scroll on mobile */}
        <div
          ref={thumbnailsRef}
          aria-label="Product image thumbnails"
          role="group"
          className="
            flex flex-row sm:flex-col gap-2
            overflow-x-auto sm:overflow-x-visible sm:overflow-y-auto
            scrollbar-none
            sm:w-16 flex-shrink-0
            sm:max-h-[480px]
          "
        >
          {images.map((image, idx) => (
            <Thumbnail
              key={idx}
              image={image}
              index={idx}
              isActive={idx === activeImageIndex}
              onSelect={handleThumbnailSelect}
              onKeyDown={handleThumbnailKeyDown}
            />
          ))}
        </div>

        {/* Main image */}
        <div className="relative flex-1 aspect-square overflow-hidden rounded-sm bg-light-200 group">
          {activeImage ? (
            <>
              <Image
                src={activeImage.src}
                alt={activeImage.alt}
                fill
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 55vw, 45vw"
                className="object-contain object-center p-4"
              />
            </>
          ) : (
            <GalleryEmptyState />
          )}

          {/* Badge — top-left */}
          {badge && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 bg-light-100/90 backdrop-blur-sm rounded-sm px-2.5 py-1 text-footnote font-medium text-dark-900 shadow-sm">
                <span className="text-orange" aria-hidden="true">★</span>
                {badge}
              </span>
            </div>
          )}

          {/* Prev / Next navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeImageIndex === 0}
                aria-label="Previous image"
                className="
                  absolute left-2 top-1/2 -translate-y-1/2 z-10
                  w-8 h-8 flex items-center justify-center
                  rounded-full bg-light-100/80 hover:bg-light-100
                  text-dark-900 shadow-sm transition-all duration-150
                  disabled:opacity-30 disabled:cursor-not-allowed
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900
                "
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={activeImageIndex === images.length - 1}
                aria-label="Next image"
                className="
                  absolute right-2 top-1/2 -translate-y-1/2 z-10
                  w-8 h-8 flex items-center justify-center
                  rounded-full bg-light-100/80 hover:bg-light-100
                  text-dark-900 shadow-sm transition-all duration-150
                  disabled:opacity-30 disabled:cursor-not-allowed
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900
                "
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Colour swatches ─────────────────────────────────────────────── */}
      {variants.length > 1 && (
        <div
          role="group"
          aria-label="Select colour"
          className="flex flex-wrap gap-2"
        >
          {variants.map((variant, idx) => (
            <Swatch
              key={variant.colorSlug}
              variant={variant}
              isActive={idx === activeVariantIndex}
              onSelect={() => handleVariantChange(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
