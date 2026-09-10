"use client";

// MapLibre 6 exports named symbols only; there is no default export.
import { AttributionControl, MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import { useEffect, useEffectEvent, useRef } from "react";

import type { CafeSummary } from "@/domain/cafe";
import { scoreBand } from "@/domain/scoring";
import { MAP_ATTRIBUTION, MAP_STYLE_URL } from "@/lib/public-env";

import "maplibre-gl/dist/maplibre-gl.css";

interface CafeMapProps {
  cafes: readonly CafeSummary[];
  center: { latitude: number; longitude: number } | null;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onMoveEnd?: (center: { latitude: number; longitude: number }) => void;
  /** Notifies the parent when the basemap cannot be loaded. */
  onTileError?: (failed: boolean) => void;
}

const BAND_COLORS: Record<string, string> = {
  high: "var(--score-high)",
  mid: "var(--score-mid)",
  low: "var(--score-low)",
  unknown: "var(--score-unknown)",
};

/**
 * MapLibre map.
 *
 * Client-only and dynamically imported by its parent: the library is a couple
 * of hundred KB and must never block first paint.
 *
 * Markers are plain DOM elements rather than a GeoJSON layer. At MVP scale
 * (tens of cafés in a viewport) that is simpler, keeps the markers stylable with
 * our own tokens, and makes them focusable — which is what lets keyboard users
 * reach them at all. A GeoJSON source with clustering is the right answer once
 * there are thousands, and is noted in the roadmap.
 *
 * The map is never the only way to read the data: the list beside it is a peer,
 * not a fallback. A canvas is fundamentally inaccessible to screen readers.
 */
export function CafeMap({
  cafes,
  center,
  selectedId,
  hoveredId,
  onSelect,
  onMoveEnd,
  onTileError,
}: CafeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());

  /*
   * The callbacks are non-reactive: a new function identity from the parent must
   * not tear down and rebuild the map, or the user's pan and zoom would reset on
   * every keystroke. useEffectEvent (React 19.2) is exactly this case — it always
   * sees the latest props without becoming a dependency.
   */
  const handleMoveEnd = useEffectEvent((next: { latitude: number; longitude: number }) => {
    onMoveEnd?.(next);
  });
  const handleSelect = useEffectEvent((id: string) => {
    onSelect(id);
  });
  const handleTileError = useEffectEvent((failed: boolean) => {
    onTileError?.(failed);
  });

  // Initialise once. Deliberately no dependencies: re-creating the map on every
  // prop change would reset the user's pan and zoom on each keystroke.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: center ? [center.longitude, center.latitude] : [-46.65, -23.56],
      zoom: 13,
      attributionControl: false,
    });

    map.addControl(
      new AttributionControl({ compact: false, customAttribution: MAP_ATTRIBUTION }),
      "bottom-right",
    );
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.on("moveend", () => {
      const next = map.getCenter();
      handleMoveEnd({ latitude: next.lat, longitude: next.lng });
    });

    /*
     * Basemap failure is a real production case — an expired key, a provider
     * outage, an offline user. Without this the map degrades into a blank void
     * with floating markers and no explanation, which reads as a broken page.
     * We surface it instead, and the list beside the map stays fully usable.
     */
    map.on("error", (event) => {
      const message = event.error?.message ?? "";
      if (/style|sprite|glyph|tile|source/i.test(message)) {
        handleTileError(true);
      }
    });

    map.on("styledata", () => handleTileError(false));

    mapRef.current = map;
    const markers = markersRef.current;

    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time setup; see comment above
  }, []);

  // Sync markers to the current result set.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = markersRef.current;
    const seen = new Set<string>();

    for (const cafe of cafes) {
      seen.add(cafe.id);

      if (!markers.has(cafe.id)) {
        const element = createMarkerElement(cafe, () => handleSelect(cafe.id));
        const marker = new Marker({ element })
          .setLngLat([cafe.coordinates.longitude, cafe.coordinates.latitude])
          .addTo(map);
        markers.set(cafe.id, marker);
      }
    }

    for (const [id, marker] of markers) {
      if (!seen.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    }
  }, [cafes]);

  // Reflect selection/hover onto the markers.
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const element = marker.getElement();
      const isActive = id === selectedId || id === hoveredId;
      element.dataset.active = String(isActive);
      element.style.zIndex = isActive ? "2" : "1";
    }
  }, [selectedId, hoveredId]);

  // Recentre when the search origin changes.
  useEffect(() => {
    if (!mapRef.current || !center) return;
    mapRef.current.easeTo({ center: [center.longitude, center.latitude], duration: 600 });
  }, [center]);

  return <div ref={containerRef} className="h-full w-full" aria-hidden="true" />;
}

function createMarkerElement(cafe: CafeSummary, onClick: () => void): HTMLElement {
  const band = scoreBand(cafe.profile.workFriendlyScore);
  const score = cafe.profile.workFriendlyScore;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "cofe-marker";
  button.textContent = score === null ? "—" : String(Math.round(score));
  button.setAttribute(
    "aria-label",
    score === null
      ? `${cafe.name}, not enough data for a score`
      : `${cafe.name}, Work Friendly Score ${Math.round(score)}`,
  );
  button.style.setProperty("--marker-color", BAND_COLORS[band] ?? BAND_COLORS.unknown ?? "");
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });

  return button;
}
