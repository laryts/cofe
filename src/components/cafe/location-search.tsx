"use client";

import { LoaderCircle, MapPin, Search } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { messages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LocationSearchProps {
  defaultValue?: string;
  size?: "md" | "lg";
  className?: string;
  onSearch: (query: string) => void;
  onUseMyLocation?: (center: { latitude: number; longitude: number }) => void;
}

type LocationState = "idle" | "locating" | "denied";

/**
 * The primary way in: type a place, or hand over your coordinates.
 *
 * Geolocation is requested only on an explicit click. A permission prompt fired
 * on page load is the fastest way to get it denied permanently, and a denial is
 * sticky — so the button is the safer default and the search field always works.
 */
export function LocationSearch({
  defaultValue = "",
  size = "md",
  className,
  onSearch,
  onUseMyLocation,
}: LocationSearchProps) {
  const [value, setValue] = useState(defaultValue);
  const [locationState, setLocationState] = useState<LocationState>("idle");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSearch(value.trim());
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation || !onUseMyLocation) {
      setLocationState("denied");
      return;
    }

    setLocationState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState("idle");
        onUseMyLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => setLocationState("denied"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="text-subtle-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
          />
          <Input
            type="search"
            name="q"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={messages.home.searchPlaceholder}
            aria-label={messages.home.searchLabel}
            className={cn("pl-11", size === "lg" && "h-14 text-base")}
            enterKeyHint="search"
          />
        </div>

        <Button type="submit" size={size === "lg" ? "lg" : "md"} className="sm:w-auto">
          {messages.home.cta}
        </Button>
      </form>

      {onUseMyLocation && (
        <div className="flex flex-col items-center gap-1">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleUseMyLocation}
            disabled={locationState === "locating"}
            className="text-muted-foreground hover:text-accent h-11 no-underline"
          >
            {locationState === "locating" ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <MapPin aria-hidden="true" />
            )}
            {locationState === "locating" ? messages.explore.locating : messages.home.useLocation}
          </Button>

          {locationState === "denied" && (
            <p role="status" className="text-score-low text-sm">
              {messages.explore.locationDenied}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
