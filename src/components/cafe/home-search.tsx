"use client";

import { useRouter } from "next/navigation";

import { LocationSearch } from "@/components/cafe/location-search";

/**
 * Homepage search. Navigates to /explore with the query already applied, so the
 * user lands on results rather than an empty map they have to search again.
 */
export function HomeSearch({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <LocationSearch
      size="lg"
      className={className}
      onSearch={(query) => {
        router.push(query ? `/explore?q=${encodeURIComponent(query)}` : "/explore");
      }}
      onUseMyLocation={(coords) => {
        router.push(`/explore?lat=${coords.latitude.toFixed(5)}&lng=${coords.longitude.toFixed(5)}&radius=5`);
      }}
    />
  );
}
