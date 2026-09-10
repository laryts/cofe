"use client";

import { List, MapIcon } from "lucide-react";
import { useRef, useState } from "react";

import { CafeList } from "@/components/cafe/cafe-list";
import { FilterControls } from "@/components/cafe/filter-controls";
import { LocationSearch } from "@/components/cafe/location-search";
import { MapPanel } from "@/components/map/map-panel";
import { useExploreState } from "@/hooks/use-explore-state";
import type { CafeSummary } from "@/domain/cafe";
import { messages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ExploreViewProps {
  cafes: readonly CafeSummary[];
  hasDemoData: boolean;
  /** Set when the search matched nothing here but resolved to a real place. */
  resolvedPlace: { name: string; latitude: number; longitude: number } | null;
}

type MobilePane = "list" | "map";

/**
 * The explore experience: map and list, kept in sync.
 *
 * Results are fetched on the server and passed in; this component owns only
 * interaction state. Filtering navigates (via the URL), which re-runs the
 * server query — so there is no second copy of the filtering logic in the
 * client, and no client-side data fetching layer to maintain.
 *
 * On mobile the two panes become a toggle rather than a split, because a
 * half-height map above a half-height list is useless at both jobs.
 */
export function ExploreView({ cafes, hasDemoData, resolvedPlace }: ExploreViewProps) {
  const { state, toggleFilter, clearFilters, setLocation, setQuery } = useExploreState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<MobilePane>("list");
  const listRef = useRef<HTMLDivElement>(null);

  const hasFilters = Object.values(state.filters).some(Boolean);

  /**
   * Clicking a marker should show you which café it is, not just tint it.
   * On desktop that means scrolling the list row into view; on mobile, where
   * only one pane is visible, it means switching to the list.
   */
  function handleMapSelect(id: string | null) {
    setSelectedId(id);
    if (!id) return;

    setMobilePane("list");
    // Defer to let the pane switch commit before we measure the row.
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector(`[data-cafe-id="${id}"]`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  // Centre on the search origin when there is one, otherwise on the first
  // result, so the map is never showing an empty ocean.
  const center =
    state.center ??
    (resolvedPlace
      ? { latitude: resolvedPlace.latitude, longitude: resolvedPlace.longitude }
      : cafes[0]
        ? { latitude: cafes[0].coordinates.latitude, longitude: cafes[0].coordinates.longitude }
        : null);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <div className="border-border bg-background border-b px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
          {/*
            The visual hierarchy here is carried by the search field, and a large
            page title would eat the vertical space the mobile layout works hard
            to reclaim. The heading outline still needs a root, though — without
            an h1 the filter heading below is an orphan and screen reader users
            get no page title at all. It names the current search when there is
            one, so it is genuinely informative rather than decorative.
          */}
          <h1 className="sr-only">
            {state.query ? messages.explore.titleFor(state.query) : messages.explore.title}
          </h1>

          <LocationSearch
            defaultValue={state.query}
            onSearch={setQuery}
            onUseMyLocation={(coords) => setLocation(coords, "")}
            className="items-stretch"
          />
          <FilterControls
            filters={state.filters}
            onToggle={toggleFilter}
            onClear={clearFilters}
            resultCount={cafes.length}
          />
        </div>
      </div>

      {hasDemoData && <DemoBanner />}

      {/* Mobile pane switch. Hidden from assistive tech: the list is always
          present in the DOM for screen readers, so this is a visual affordance. */}
      <div className="border-border flex border-b lg:hidden" role="tablist" aria-label="View">
        {(["list", "map"] as const).map((pane) => (
          <button
            key={pane}
            type="button"
            role="tab"
            aria-selected={mobilePane === pane}
            onClick={() => setMobilePane(pane)}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 text-sm font-medium transition-colors",
              mobilePane === pane
                ? "border-accent text-foreground border-b-2"
                : "text-muted-foreground",
            )}
          >
            {pane === "list" ? (
              <List aria-hidden="true" className="size-4" />
            ) : (
              <MapIcon aria-hidden="true" className="size-4" />
            )}
            {pane === "list" ? messages.explore.showList : messages.explore.showMap}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(360px,420px)_1fr]">
        <div
          ref={listRef}
          className={cn(
            "bg-background min-h-0 flex-1 overflow-y-auto lg:block",
            mobilePane === "map" && "hidden",
          )}
        >
          <CafeList
            cafes={cafes}
            hasFilters={hasFilters}
            emptyPlaceName={resolvedPlace?.name ?? null}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onSelect={setSelectedId}
            onClearFilters={clearFilters}
          />
        </div>

        <div
          className={cn(
            "bg-surface-sunken min-h-0 flex-1 lg:block",
            mobilePane === "list" && "hidden",
          )}
        >
          <MapPanel
            cafes={cafes}
            center={center}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={handleMapSelect}
            onHover={setHoveredId}
            onSearchArea={(coords) => setLocation(coords, "")}
          />
        </div>
      </div>
    </div>
  );
}

function DemoBanner() {
  return (
    <p className="bg-accent-soft text-accent border-border border-b px-4 py-2 text-center text-sm sm:px-6">
      <strong className="font-semibold">{messages.demo.bannerTitle}.</strong>{" "}
      <span className="text-foreground/80">{messages.demo.bannerBody}</span>
    </p>
  );
}
