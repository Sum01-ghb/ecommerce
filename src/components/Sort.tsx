"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { ChevronDown } from "lucide-react";
import {
  type SortOption,
  SORT_LABELS,
  parseSearchParams,
  setSort,
  buildQueryString,
} from "@/lib/utils/query";

const SORT_OPTIONS: SortOption[] = [
  "featured",
  "newest",
  "price_asc",
  "price_desc",
];

export default function Sort() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const rawParams = Object.fromEntries(searchParams.entries());
  const parsed    = parseSearchParams(rawParams);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSort   = e.target.value as SortOption;
      const updated   = setSort(parsed, newSort);
      const qs        = buildQueryString(updated);
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [parsed, pathname, router]
  );

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <label
        htmlFor="sort-select"
        className="text-caption text-dark-700 whitespace-nowrap hidden sm:inline"
      >
        Sort By
      </label>

      <div className="relative">
        <select
          id="sort-select"
          value={parsed.sort}
          onChange={handleChange}
          aria-label="Sort products"
          className="
            appearance-none
            cursor-pointer
            bg-transparent
            border border-light-400
            rounded-sm
            pl-3 pr-8 py-1.5
            text-caption text-dark-900
            hover:border-dark-500
            focus:outline-none focus:ring-1 focus:ring-dark-900 focus:border-dark-900
            transition-colors duration-150
          "
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {SORT_LABELS[opt]}
            </option>
          ))}
        </select>

        {}
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-700"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}