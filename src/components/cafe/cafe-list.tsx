"use client";

import Link from "next/link";

import { CafeListItem } from "@/components/cafe/cafe-list-item";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CafeSummary } from "@/domain/cafe";
import { messages } from "@/lib/i18n";

interface CafeListProps {
  cafes: readonly CafeSummary[];
  isLoading?: boolean;
  hasFilters?: boolean;
  /** Name of a place the query resolved to, when we hold no data for it. */
  emptyPlaceName?: string | null;
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
  emptyPlaceName,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
  onClearFilters,
}: CafeListProps) {
  if (isLoading) return <CafeListSkeleton />;

  if (cafes.length === 0) {
    return (
      <EmptyState
        hasFilters={hasFilters}
        placeName={emptyPlaceName}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <ul aria-label={messages.explore.listLabel} className="border-border border-t">
      {cafes.map((cafe) => (
        <CafeListItem
          key={cafe.id}
          cafe={cafe}
          isSelected={cafe.id === selectedId}
          isHovered={cafe.id === hoveredId}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

/**
 * Three distinct empty states, because they mean three different things:
 * filters excluded everything, we found the place but hold no data for it, or
 * there is simply nothing here. Collapsing them into one generic message would
 * make our own coverage gap look like the user's mistake.
 */
function EmptyState({
  hasFilters,
  placeName,
  onClearFilters,
}: {
  hasFilters?: boolean;
  placeName?: string | null;
  onClearFilters?: () => void;
}) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-foreground text-lg">{messages.explore.noResults}</p>
        <p className="text-muted-foreground max-w-xs text-sm">{messages.explore.noResultsHint}</p>
        {onClearFilters && (
          <Button variant="secondary" size="sm" onClick={onClearFilters} className="mt-2">
            {messages.explore.clearFilters}
          </Button>
        )}
      </div>
    );
  }

  if (placeName) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="font-display text-foreground text-lg text-balance">
          {messages.explore.noCafesHere(placeName)}
        </p>
        <p className="text-muted-foreground max-w-xs text-sm text-balance">
          {messages.explore.noCafesHereHint}
        </p>
        <Button asChild size="sm" className="mt-2">
          <Link href="/contribute">{messages.explore.addFirstCafe}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="font-display text-foreground text-lg">{messages.explore.emptyArea}</p>
      <p className="text-muted-foreground max-w-xs text-sm text-balance">
        {messages.explore.emptyAreaHint}
      </p>
    </div>
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
