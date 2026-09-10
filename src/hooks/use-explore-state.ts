"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { CAFE_FILTER_KEYS, type CafeFilterKey, type CafeFilters } from "@/domain/cafe";

/**
 * Explore state, stored in the URL.
 *
 * Filters, query and map centre all live in the query string rather than in
 * component state. That makes every view shareable and the back button correct,
 * which in a map product is the single cheapest high-value detail available —
 * "send me that list of quiet cafés in Pinheiros" just works.
 */
export interface ExploreState {
  readonly query: string;
  readonly filters: CafeFilters;
  readonly center: { latitude: number; longitude: number } | null;
  readonly radiusKm: number | null;
}

export function useExploreState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo<ExploreState>(() => {
    const filters: CafeFilters = {};
    for (const key of CAFE_FILTER_KEYS) {
      if (searchParams.get(key) === "true") filters[key] = true;
    }

    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const hasCenter = Number.isFinite(lat) && Number.isFinite(lng) && searchParams.has("lat");
    const radius = Number(searchParams.get("radius"));

    return {
      query: searchParams.get("q") ?? "",
      filters,
      center: hasCenter ? { latitude: lat, longitude: lng } : null,
      radiusKm: Number.isFinite(radius) && radius > 0 ? radius : null,
    };
  }, [searchParams]);

  const commit = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const queryString = params.toString();
      // `scroll: false` keeps the list from jumping to the top when a filter
      // changes — the user is usually looking at a row partway down.
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const toggleFilter = useCallback(
    (key: CafeFilterKey) => {
      commit((params) => {
        if (params.get(key) === "true") params.delete(key);
        else params.set(key, "true");
      });
    },
    [commit],
  );

  const clearFilters = useCallback(() => {
    commit((params) => {
      for (const key of CAFE_FILTER_KEYS) params.delete(key);
    });
  }, [commit]);

  const setLocation = useCallback(
    (center: { latitude: number; longitude: number } | null, label?: string) => {
      commit((params) => {
        if (center) {
          params.set("lat", center.latitude.toFixed(5));
          params.set("lng", center.longitude.toFixed(5));
          if (!params.has("radius")) params.set("radius", "5");
        } else {
          params.delete("lat");
          params.delete("lng");
          params.delete("radius");
        }

        if (label !== undefined) {
          if (label) params.set("q", label);
          else params.delete("q");
        }
      });
    },
    [commit],
  );

  const setQuery = useCallback(
    (query: string) => {
      commit((params) => {
        if (query) params.set("q", query);
        else params.delete("q");
        // A text search replaces any coordinate origin: searching "Lisbon"
        // while centred on São Paulo should not silently return nothing.
        params.delete("lat");
        params.delete("lng");
        params.delete("radius");
      });
    },
    [commit],
  );

  return { state, toggleFilter, clearFilters, setLocation, setQuery };
}
