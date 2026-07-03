"use client";

/**
 * ProductGalleryDB.tsx — Client component
 *
 * Drop-in gallery for the PDP that consumes the DB shape directly:
 *   - `images`          → ProductImageDetail[] from getProduct()
 *   - `availableColors` → array of { id, name, slug, hexCode }
 *
 * How image↔color association works
 * ─────────────────────────────────
 * The DB model ties an image to a specific variant via `variantId`.
 * A variant has a `colorId`. So an image belongs to a color when
 * `image.variantId` is in the set of variant IDs for that color.
 *
 * We receive `variantColorMap` (variantId → colorId) so we can
 * group images by color client-side without an extra fetch.
 *
 * When a color is selected the gallery shows:
 *   1. Images whose variantId maps to that color (sorted by sortOrder).
 *   2. Fallback: images with no variantId (generic product shots).
 *
 * Accessibility:
 *   • Thumbnail buttons are keyboard-navigable (Arrow keys).
 *   • Swatch buttons carry aria-label + aria-pressed.
 *   • Missing-image state renders <GalleryEmptyState />.
 */

import { useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Check, ImageOff } from "lucide-react";
import type { ProductImageDetail } from "@/lib/actions/product";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface ColorOption {
  id: string;
  name: string;
  slug: string;
  hexCode: string;
}

interface ProductGalleryDBProps {
  images: ProductImageDetail[];
  availableColors: ColorOption[];
  /** variantId → colorId mapping, so we can group images by color */
  variantColorMap: Record<string, string>;
  /** Optional badge text shown over the main image */
  badge?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

export function ProductGalleryDBSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="hidden sm:flex flex-col gap-2 w-16 flex-shrink-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-16 h-16 bg-light-300 rounded-sm" />
        ))}
      </div>
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
// Thumbnail
// ─────────────────────────────────────────────────────────────────────────────

interface ThumbnailProps {
  image: ProductImageDetail;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent, index: number, total: number) => void;
  total: number;
}

function Thumbnail({ image, index, isActive, onSelect, onKeyDown, total }: ThumbnailProps) {
  return (
    <button
      type="button"
      aria-label={`Product image ${index + 1}`}
      aria-pressed={isActive}
      onClick={() => onSelect(index)}
      onKeyDown={(e) => onKeyDown(e, index, total)}
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
        src={image.url}
        alt={`Product image ${index + 1}`}
        fill
        sizes="64px"
        className="object-cover object-center bg-light-200"
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Color swatch
// ─────────────────────────────────────────────────────────────────────────────

interface SwatchProps {
  color: ColorOption;
  previewImage?: ProductImageDetail;
  isActive: boolean;
  onSelect: () => void;
}

function Swatch({ color, previewImage, isActive, onSelect }: SwatchProps) {
  return (
    <button
      type="button"
      aria-label={`${color.name}${isActive ? " — selected" : ""}`}
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
          src={previewImage.url}
          alt={color.name}
          fill
          sizes="48px"
          className="object-cover object-center bg-light-200"
        />
      ) : (
        <span
          className="block w-full h-full"
          style={{ backgroundColor: color.hexCode }}
        />
      )}
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

export default function ProductGalleryDB({
  images,
  availableColors,
  variantColorMap,
  badge,
}: ProductGalleryDBProps) {
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // ── Derive the image set for the active color ─────────────────────────
  const activeColor = availableColors[activeColorIndex];

  const colorImages: ProductImageDetail[] = activeColor
    ? images
        .filter(
          (img) =>
            img.variantId !== null &&
            variantColorMap[img.variantId] === activeColor.id
        )
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];

  // Fallback to generic images (no variantId) if color has no images
  const genericImages = images
    .filter((img) => img.variantId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const displayImages =
    colorImages.length > 0 ? colorImages : genericImages.length > 0 ? genericImages : images;

  const activeImage = displayImages[activeImageIndex] ?? displayImages[0];
  const safeIndex   = Math.min(activeImageIndex, Math.max(0, displayImages.length - 1));

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleColorChange = useCallback((idx: number) => {
    setActiveColorIndex(idx);
    setActiveImageIndex(0);
  }, []);

  const handleThumbnailSelect = useCallback((idx: number) => {
    setActiveImageIndex(idx);
  }, []);

  const handleThumbnailKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number, total: number) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setActiveImageIndex(Math.min(idx + 1, total - 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveImageIndex(Math.max(idx - 1, 0));
      }
    },
    []
  );

  const handlePrev = useCallback(() => setActiveImageIndex((i) => Math.max(i - 1, 0)), []);
  const handleNext = useCallback(
    () => setActiveImageIndex((i) => Math.min(i + 1, displayImages.length - 1)),
    [displayImages.length]
  );

  // ── Guard ────────────────────────────────────────────────────────────────
  if (displayImages.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <GalleryEmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Gallery layout ──────────────────────────────────────────────── */}
      {/* Mobile: main image on top, thumbnail row below */}
      {/* Desktop: vertical thumbnail strip on left, main image on right */}
      <div className="flex flex-col-reverse sm:flex-row gap-3">

        {/* Thumbnail strip */}
        <div
          role="group"
          aria-label="Product image thumbnails"
          className="
            flex flex-row sm:flex-col gap-2
            overflow-x-auto sm:overflow-x-visible sm:overflow-y-auto
            scrollbar-none
            sm:w-16 flex-shrink-0
            sm:max-h-[480px]
          "
        >
          {displayImages.map((img, idx) => (
            <Thumbnail
              key={img.id}
              image={img}
              index={idx}
              isActive={idx === safeIndex}
              onSelect={handleThumbnailSelect}
              onKeyDown={handleThumbnailKeyDown}
              total={displayImages.length}
            />
          ))}
        </div>

        {/* Main image */}
        <div className="relative flex-1 aspect-square overflow-hidden rounded-sm bg-light-200 group">
          {activeImage ? (
            <Image
              src={activeImage.url}
              alt={activeColor ? `${activeColor.name} — image ${safeIndex + 1}` : `Product image ${safeIndex + 1}`}
              fill
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 55vw, 45vw"
              className="object-contain object-center p-4"
            />
          ) : (
            <GalleryEmptyState />
          )}

          {/* Badge */}
          {badge && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 bg-light-100/90 backdrop-blur-sm rounded-sm px-2.5 py-1 text-footnote font-medium text-dark-900 shadow-sm">
                <span className="text-orange" aria-hidden="true">★</span>
                {badge}
              </span>
            </div>
          )}

          {/* Prev / Next arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                disabled={safeIndex === 0}
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
                disabled={safeIndex === displayImages.length - 1}
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

      {/* ── Color swatches ───────────────────────────────────────────────── */}
      {availableColors.length > 1 && (
        <div role="group" aria-label="Select colour" className="flex flex-wrap gap-2">
          {availableColors.map((color, idx) => {
            // Use the first image associated with this color as the swatch preview
            const previewImg = images.find(
              (img) =>
                img.variantId !== null &&
                variantColorMap[img.variantId] === color.id
            );
            return (
              <Swatch
                key={color.id}
                color={color}
                previewImage={previewImg}
                isActive={idx === activeColorIndex}
                onSelect={() => handleColorChange(idx)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
