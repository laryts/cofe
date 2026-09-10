"use client";

import { MapPinOff } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { CafeSummary } from "@/domain/cafe";

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
  center: { latitude: number; longitude: number } | null;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onMoveEnd?: (center: { latitude: number; longitude: number }) => void;
}

export function MapPanel(props: MapPanelProps) {
  const [tilesFailed, setTilesFailed] = useState(false);

  return (
    <div className="relative h-full w-full">
      <CafeMap {...props} onTileError={setTilesFailed} />

      {tilesFailed && <TileErrorOverlay />}
    </div>
  );
}

/**
 * Shown when the basemap will not load.
 *
 * Deliberately does not hide the markers: their relative positions still carry
 * useful information, and the list beside the map is unaffected. The message
 * explains what is missing rather than leaving the user staring at a void.
 */
function TileErrorOverlay() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-4">
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
