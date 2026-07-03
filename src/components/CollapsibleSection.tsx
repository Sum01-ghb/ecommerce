"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;

  defaultOpen?: boolean;

  children: React.ReactNode;

  headerSlot?: React.ReactNode;
}

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
          hover:text-dark-700 transition-colors cursor-pointer
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

      {}
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