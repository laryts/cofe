"use client";

import { CafeListItem } from "@/components/cafe/cafe-list-item";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CafeSummary } from "@/domain/cafe";
import { messages } from "@/lib/i18n";

interface CafeListProps {
  cafes: readonly CafeSummary[];
  isLoading?: boolean;
  hasFilters?: boolean;
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onClearFilters?: () => void;
}

export function CafeList({
  cafes,
  isLoading,
  hasFilters,
  selectedId,
  onHover,
  onSelect,
  onClearFilters,
}: CafeListProps) {
  if (isLoading) return <CafeListSkeleton />;

  if (cafes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-foreground text-lg">
          {hasFilters ? messages.explore.noResults : messages.explore.emptyArea}
        </p>
        <p className="text-muted-foreground max-w-xs text-sm">
          {hasFilters ? messages.explore.noResultsHint : messages.explore.emptyAreaHint}
        </p>
        {hasFilters && onClearFilters && (
          <Button variant="secondary" size="sm" onClick={onClearFilters} className="mt-2">
            {messages.explore.clearFilters}
          </Button>
        )}
      </div>
    );
  }

  return (
    <ul aria-label={messages.explore.listLabel} className="border-border border-t">
      {cafes.map((cafe) => (
        <CafeListItem
          key={cafe.id}
          cafe={cafe}
          isSelected={cafe.id === selectedId}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

/** Skeleton rows sized to match real ones, so the layout does not jump on load. */
export function CafeListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="border-border border-t" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <li key={index} className="border-border flex items-start gap-3 border-b px-4 py-4">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </li>
      ))}
    </ul>
  );
}
