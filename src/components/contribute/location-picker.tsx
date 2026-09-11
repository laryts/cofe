"use client";

import { MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import { LoaderCircle, MapPin } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Coordinates } from "@/domain/geo";
import { MAP_STYLE_URL } from "@/lib/public-env";

import "maplibre-gl/dist/maplibre-gl.css";

interface LocationPickerProps {
  value: Coordinates | null;
  onChange: (value: Coordinates) => void;
}

/** Somewhere sensible to start when we have nothing at all to go on. */
const FALLBACK_CENTER: Coordinates = { latitude: -23.5505, longitude: -46.6333 };

/**
 * Drag a pin to place a café.
 *
 * Asking for latitude and longitude in two number fields would be accurate and
 * unusable. This is the Waze-style interaction: a draggable pin, plus the
 * option to jump to the device's location. The numbers are still shown, because
 * a contributor who does have exact coordinates should be able to confirm them.
 */
export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [locating, setLocating] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);

  const handleChange = useEffectEvent((next: Coordinates) => onChange(next));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const start = value ?? FALLBACK_CENTER;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [start.longitude, start.latitude],
      zoom: value ? 16 : 12,
      attributionControl: false,
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    const marker = new Marker({ draggable: true, color: "#b4532a" })
      .setLngLat([start.longitude, start.latitude])
      .addTo(map);

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLngLat();
      handleChange({ latitude: lat, longitude: lng });
    });

    // Tapping the map is faster than dragging on a phone.
    map.on("click", (event) => {
      marker.setLngLat(event.lngLat);
      handleChange({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
    });

    map.on("error", (event) => {
      const status = (event.error as { status?: number } | undefined)?.status;
      if (typeof status === "number" && status >= 400) setTilesFailed(true);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time setup; the map owns its own state afterwards
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        markerRef.current?.setLngLat([next.longitude, next.latitude]);
        mapRef.current?.easeTo({ center: [next.longitude, next.latitude], zoom: 16 });
        onChange(next);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="border-border relative h-72 overflow-hidden rounded-lg border">
        <div ref={containerRef} className="h-full w-full" aria-hidden="true" />

        {tilesFailed && (
          <p className="bg-surface/95 text-muted-foreground absolute inset-x-0 top-0 px-3 py-2 text-xs">
            Map tiles unavailable — you can still place the pin, or type coordinates below.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-subtle-foreground text-xs" aria-live="polite">
          {value ? (
            <span className="numeric">
              Pin at {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
            </span>
          ) : (
            "Tap the map or drag the pin to mark the café."
          )}
        </p>

        <Button type="button" variant="secondary" size="sm" onClick={useMyLocation}>
          {locating ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <MapPin aria-hidden="true" />
          )}
          Use my location
        </Button>
      </div>

      <p className="text-subtle-foreground text-[0.6875rem]">
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-foreground underline underline-offset-2"
        >
          © OpenStreetMap contributors
        </a>
      </p>
    </div>
  );
}
