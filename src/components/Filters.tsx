"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from "lucide-react";
import {
  parseSearchParams,
  toggleFilterValue,
  setPriceRange,
  clearAllFilters,
  hasActiveFilters,
  buildQueryString,
  type ParsedQuery,
  type ProductFilters,
} from "@/lib/utils/query";
import {
  GENDER_OPTIONS,
  COLOR_OPTIONS,
  SIZE_OPTIONS,
  PRICE_RANGES,
} from "@/lib/data/products";

interface FilterGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterGroup({ title, children, defaultOpen = true }: FilterGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-light-300 py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="
          flex w-full items-center justify-between
          text-caption font-medium text-dark-900
          hover:text-dark-700 transition-colors cursor-pointer
          focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900
        "
        aria-expanded={open}
      >
        <span>{title}</span>
        {open ? (
          <ChevronUp size={14} aria-hidden="true" />
        ) : (
          <ChevronDown size={14} aria-hidden="true" />
        )}
      </button>

      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

interface CheckboxItemProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}

function CheckboxItem({ id, label, checked, onChange }: CheckboxItemProps) {
  return (
    <label
      htmlFor={id}
      className="
        flex items-center gap-2.5 cursor-pointer
        text-caption text-dark-700
        hover:text-dark-900 transition-colors
        group
      "
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="
          w-4 h-4 rounded-sm border border-light-400
          text-dark-900 bg-light-100
          checked:bg-dark-900 checked:border-dark-900
          focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900
          cursor-pointer transition-colors
        "
      />
      <span className="group-hover:text-dark-900 select-none">{label}</span>
    </label>
  );
}

interface FiltersProps {

  totalCount?: number;
}

export default function Filters({ totalCount }: FiltersProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rawParams = Object.fromEntries(searchParams.entries());
  const parsed    = parseSearchParams(rawParams);

  const pushQuery = useCallback(
    (next: ParsedQuery) => {
      const qs = buildQueryString(next);
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname]
  );

  const toggle = useCallback(
    (key: keyof ProductFilters, value: string) => {
      pushQuery(toggleFilterValue(parsed, key, value));
    },
    [parsed, pushQuery]
  );

  const handlePriceRange = useCallback(
    (min: number, max: number) => {

      const isActive =
        parsed.priceMin === min &&
        (max === Infinity ? parsed.priceMax === undefined : parsed.priceMax === max);

      if (isActive) {
        pushQuery(setPriceRange(parsed, undefined, undefined));
      } else {
        pushQuery(setPriceRange(parsed, min, max === Infinity ? undefined : max));
      }
    },
    [parsed, pushQuery]
  );

  const handleClearAll = useCallback(() => {
    pushQuery(clearAllFilters(parsed));
  }, [parsed, pushQuery]);

  const activeFilters = hasActiveFilters(parsed);

  const filterContent = (
    <div>
      {}
      <div className="flex items-center justify-between pb-4 border-b border-light-300">
        <h2 className="text-body-medium font-medium text-dark-900">Filters</h2>
        {activeFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="
              text-footnote text-dark-700 underline underline-offset-2
              hover:text-dark-900 transition-colors cursor-pointer
              focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900
            "
          >
            Clear all
          </button>
        )}
      </div>

      {}
      <FilterGroup title="Gender">
        {GENDER_OPTIONS.map((opt) => (
          <CheckboxItem
            key={opt.slug}
            id={`gender-${opt.slug}`}
            label={opt.label}
            checked={parsed.gender.includes(opt.slug)}
            onChange={() => toggle("gender", opt.slug)}
          />
        ))}
      </FilterGroup>

      {}
      <FilterGroup title="Size">
        <div className="grid grid-cols-2 gap-2">
          {SIZE_OPTIONS.map((opt) => {
            const active = parsed.size.includes(opt.slug);
            return (
              <button
                key={opt.slug}
                type="button"
                onClick={() => toggle("size", opt.slug)}
                aria-pressed={active}
                className={`
                  py-1.5 text-footnote border rounded-sm transition-colors cursor-pointer
                  focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900
                  ${active
                    ? "bg-dark-900 text-light-100 border-dark-900"
                    : "bg-light-100 text-dark-700 border-light-400 hover:border-dark-500"
                  }
                `}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {}
      <FilterGroup title="Color">
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => {
            const active = parsed.color.includes(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => toggle("color", c.slug)}
                aria-pressed={active}
                aria-label={c.name}
                title={c.name}
                className={`
                  w-7 h-7 rounded-full border-2 transition-all duration-150 cursor-pointer
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-1
                  ${active
                    ? "border-dark-900 scale-110 shadow-sm"
                    : "border-transparent hover:scale-105"
                  }
                `}
                style={{ backgroundColor: c.hexCode }}
              />
            );
          })}
        </div>
        {}
        {parsed.color.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {parsed.color.map((slug) => {
              const col = COLOR_OPTIONS.find((c) => c.slug === slug);
              return col ? (
                <span
                  key={slug}
                  className="text-footnote text-dark-700"
                >
                  {col.name}
                </span>
              ) : null;
            })}
          </div>
        )}
      </FilterGroup>

      {}
      <FilterGroup title="Shop By Price">
        {PRICE_RANGES.map((range) => {
          const isActive =
            parsed.priceMin === range.min &&
            (range.max === Infinity
              ? parsed.priceMax === undefined
              : parsed.priceMax === range.max);

          return (
            <CheckboxItem
              key={range.label}
              id={`price-${range.label}`}
              label={range.label}
              checked={isActive}
              onChange={() => handlePriceRange(range.min, range.max)}
            />
          );
        })}
      </FilterGroup>
    </div>
  );

  return (
    <>
      {}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open filters"
        aria-expanded={drawerOpen}
        className="
          lg:hidden
          inline-flex items-center gap-2
          px-3 py-1.5
          border border-light-400
          rounded-sm
          text-caption text-dark-900
          hover:border-dark-500 transition-colors cursor-pointer
          focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900
        "
      >
        <SlidersHorizontal size={14} aria-hidden="true" />
        Filters
        {activeFilters && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-dark-900 text-light-100 text-[9px] font-bold">
            {parsed.gender.length +
              parsed.color.length +
              parsed.size.length +
              (parsed.priceMin !== undefined || parsed.priceMax !== undefined
                ? 1
                : 0)}
          </span>
        )}
      </button>

      {}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          aria-modal="true"
          role="dialog"
          aria-label="Product filters"
        >
          {}
          <div
            className="absolute inset-0 bg-dark-900/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {}
          <div
            className="
              absolute left-0 top-0 h-full w-80 max-w-[85vw]
              bg-light-100 shadow-xl
              overflow-y-auto
              animate-in slide-in-from-left duration-300
            "
          >
            {}
            <div className="sticky top-0 bg-light-100 flex items-center justify-between px-5 py-4 border-b border-light-300 z-10">
              <span className="text-body-medium font-medium text-dark-900">
                Filters
                {totalCount !== undefined && (
                  <span className="ml-1.5 text-dark-500 font-normal">
                    ({totalCount} results)
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="
                  p-1.5 rounded-sm text-dark-700
                  hover:text-dark-900 hover:bg-light-200 transition-colors cursor-pointer
                  focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900
                "
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {}
            <div className="px-5 pb-6 pt-2">
              {filterContent}

              {}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="
                  mt-4 w-full py-3 rounded-sm
                  bg-dark-900 text-light-100
                  text-caption font-medium
                  hover:bg-black transition-colors cursor-pointer
                  focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900
                "
              >
                View {totalCount ?? ""} Results
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      <aside
        aria-label="Product filters"
        className="
          hidden lg:block
          w-56 flex-shrink-0
          sticky top-20 self-start
          max-h-[calc(100vh-6rem)] overflow-y-auto
        "
      >
        {filterContent}
      </aside>
    </>
  );
}