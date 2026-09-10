"use client";

import { SlidersHorizontal, X } from "lucide-react";

import { FILTER_ICONS } from "@/components/cafe/amenity-icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  CAFE_FILTERS,
  countActiveFilters,
  type CafeFilterKey,
  type CafeFilters,
} from "@/domain/cafe";
import { messages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface FilterControlsProps {
  filters: CafeFilters;
  onToggle: (key: CafeFilterKey) => void;
  onClear: () => void;
  resultCount: number;
}

/**
 * Work-condition filters.
 *
 * Two presentations of the same state. On desktop the chips sit inline, where
 * the horizontal space is free. On a phone that same row costs roughly 300px of
 * vertical space and pushes every result below the fold — so there it collapses
 * to a single button opening a sheet, and the first thing under the search field
 * is a café rather than a control panel.
 */
export function FilterControls({ filters, onToggle, onClear, resultCount }: FilterControlsProps) {
  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex flex-col gap-3">
      {/* Mobile: one button, plus the result count. */}
      <div className="flex items-center justify-between gap-3 sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="sm">
              <SlidersHorizontal aria-hidden="true" />
              {messages.explore.filters}
              {activeCount > 0 && (
                <span className="bg-accent text-accent-foreground numeric ml-1 flex size-5 items-center justify-center rounded-full text-xs">
                  {activeCount}
                </span>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent title={messages.explore.filters}>
            <FilterChips filters={filters} onToggle={onToggle} className="flex-col items-stretch" />

            {activeCount > 0 && (
              <Button variant="ghost" onClick={onClear} className="mt-4 w-full">
                <X aria-hidden="true" />
                {messages.explore.clearFilters}
              </Button>
            )}
          </SheetContent>
        </Sheet>

        <ResultCount count={resultCount} />
      </div>

      {/* Desktop: chips inline. */}
      <div className="hidden flex-col gap-3 sm:flex">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {messages.explore.filters}
            {activeCount > 0 && (
              <span className="text-accent ml-2 normal-case">
                {messages.explore.filtersApplied(activeCount)}
              </span>
            )}
          </h2>

          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear} className="-mr-2 h-9 px-2 text-xs">
              <X aria-hidden="true" />
              {messages.explore.clearFilters}
            </Button>
          )}
        </div>

        <FilterChips filters={filters} onToggle={onToggle} />
        <ResultCount count={resultCount} />
      </div>
    </div>
  );
}

function FilterChips({
  filters,
  onToggle,
  className,
}: {
  filters: CafeFilters;
  onToggle: (key: CafeFilterKey) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {CAFE_FILTERS.map((filter) => {
        const Icon = FILTER_ICONS[filter.icon];
        const isActive = filters[filter.key] === true;

        return (
          <button
            key={filter.key}
            type="button"
            aria-pressed={isActive}
            title={filter.description}
            onClick={() => onToggle(filter.key)}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors",
              isActive
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border-strong bg-surface text-muted-foreground hover:border-accent/50 hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Result count as a live region — without it, a screen reader user toggling a
 * filter gets no feedback that anything changed at all.
 */
function ResultCount({ count }: { count: number }) {
  return (
    <p aria-live="polite" className="text-muted-foreground numeric text-sm">
      {messages.explore.resultsCount(count)}
    </p>
  );
}
