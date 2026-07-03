"use client";

/**
 * CollapsibleSection.tsx — Client component
 *
 * A single accordion-style section with an animated chevron toggle.
 * Used for "Product Details", "Shipping & Returns", and "Reviews".
 *
 * Accessibility:
 *   • Button has aria-expanded.
 *   • Content region has aria-hidden when collapsed.
 *   • Focusable with visible ring.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface CollapsibleSectionProps {
  title: string;
  /** Render the section open by default */
  defaultOpen?: boolean;
  /** Content to show when expanded */
  children: React.ReactNode;
  /** Optional right-side slot (e.g. star rating in Reviews header) */
  headerSlot?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  headerSlot,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = `collapsible-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="border-t border-light-300">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          flex w-full items-center justify-between
          py-4 gap-3
          text-body-medium font-medium text-dark-900
          hover:text-dark-700 transition-colors
          focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900 focus-visible:ring-inset
        "
      >
        <span className="text-left">{title}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {headerSlot}
          {isOpen ? (
            <ChevronUp size={16} aria-hidden="true" className="text-dark-700" />
          ) : (
            <ChevronDown size={16} aria-hidden="true" className="text-dark-700" />
          )}
        </div>
      </button>

      {/* Animated content panel */}
      <div
        id={contentId}
        aria-hidden={!isOpen}
        className={`
          overflow-hidden transition-all duration-200 ease-in-out
          ${isOpen ? "max-h-[600px] opacity-100 pb-5" : "max-h-0 opacity-0"}
        `}
      >
        {children}
      </div>
    </div>
  );
}
