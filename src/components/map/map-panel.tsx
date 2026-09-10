"use client";

import { MapPinOff, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CafeSummary } from "@/domain/cafe";
import { haversineDistanceKm, type Coordinates } from "@/domain/geo";
import { messages } from "@/lib/i18n";

/**
 * Dynamic boundary for the map.
 *
 * MapLibre touches `window` at import time, so it cannot be server-rendered,
 * and it is large enough that it must not sit in the initial bundle.
 */
const CafeMap = dynamic(() => import("./cafe-map").then((mod) => mod.CafeMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

interface MapPanelProps {
  cafes: readonly CafeSummary[];
  center: Coordinates | null;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover?: (id: string | null) => void;
  /** Re-runs the search around a new centre. */
  onSearchArea?: (center: Coordinates) => void;
}

/**
 * How far the user must pan before "search this area" appears.
 *
 * A threshold rather than any movement at all: a button that flickers in on
 * every nudge of the map is noise, and re-querying on every pan would be worse.
 */
const PAN_THRESHOLD_KM = 1.5;

export function MapPanel({ onSearchArea, ...props }: MapPanelProps) {
  const [tilesFailed, setTilesFailed] = useState(false);
  const [panned, setPanned] = useState<{ from: Coordinates | null; to: Coordinates } | null>(null);
  const { center } = props;

  /*
   * Whether to offer "search this area" is derived, not synchronised.
   *
   * We record which centre the pan was measured against, and only show the
   * button while that is still the current centre. A completed search moves the
   * centre, which retires the offer automatically — no effect resetting state,
   * and no window where a stale button points at the previous area.
   */
  const pannedTo = panned && sameLocation(panned.from, center) ? panned.to : null;

  // Distance is measured from the last searched point rather than the last
  // frame, so a slow drag across the threshold still counts as one pan.
  // `center` is the current render's value here: CafeMap routes the callback
  // through useEffectEvent, which always sees the latest props.
  function handleMoveEnd(next: Coordinates) {
    const moved = center ? haversineDistanceKm(center, next) : 0;
    setPanned(moved >= PAN_THRESHOLD_KM ? { from: center, to: next } : null);
  }

  return (
    <div className="relative h-full w-full">
      <CafeMap
        {...props}
        onMoveEnd={onSearchArea ? handleMoveEnd : undefined}
        onTileError={setTilesFailed}
      />

      {/* Sits below the search-area button so the two never overlap. */}
      {tilesFailed && <TileErrorOverlay offset={pannedTo ? "low" : "top"} />}

      {onSearchArea && pannedTo && (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center p-4">
          <Button
            size="sm"
            className="shadow-lg"
            onClick={() => {
              onSearchArea(pannedTo);
              setPanned(null);
            }}
          >
            <Search aria-hidden="true" />
            {messages.explore.searchThisArea}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Compare by value: `center` is rebuilt on every parent render, so `===` never holds. */
function sameLocation(a: Coordinates | null, b: Coordinates | null): boolean {
  if (a === null || b === null) return a === b;
  return a.latitude === b.latitude && a.longitude === b.longitude;
}

/**
 * Shown when the basemap will not load.
 *
 * Deliberately does not hide the markers: their relative positions still carry
 * useful information, and the list beside the map is unaffected. The message
 * explains what is missing rather than leaving the user staring at a void.
 */
function TileErrorOverlay({ offset = "top" }: { offset?: "top" | "low" }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-10 flex justify-center p-4 ${
        offset === "low" ? "top-14" : "top-0"
      }`}
    >
      <p className="border-border bg-surface/95 text-muted-foreground flex max-w-sm items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm shadow-sm backdrop-blur-sm">
        <MapPinOff aria-hidden="true" className="text-score-mid mt-0.5 size-4 shrink-0" />
        <span>
          <strong className="text-foreground font-medium">Map tiles unavailable.</strong> Café
          positions are still shown, and the list is unaffected.
        </span>
      </p>
    </div>
  );
}
