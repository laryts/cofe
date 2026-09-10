import type { Metadata } from "next";

import { ExploreView } from "@/components/cafe/explore-view";
import { messages } from "@/lib/i18n";
import { parseCafeSearchParams, searchCafes } from "@/server/services/cafe-service";

export const metadata: Metadata = {
  title: messages.explore.title,
  description:
    "Browse cafés on a map and filter by Wi-Fi, power outlets, noise, seating and long-stay tolerance.",
  // The explore view is a personalised, query-driven tool. Café pages are the
  // SEO surface; this one has nothing stable for a crawler to index.
  robots: { index: false, follow: true },
};

export default async function ExplorePage(props: PageProps<"/explore">) {
  const searchParams = await props.searchParams;
  const input = parseCafeSearchParams(searchParams);
  const { cafes, resolvedPlace } = await searchCafes({ ...input, limit: 100 });

  const hasDemoData = cafes.some((cafe) => cafe.source === "seed");

  return <ExploreView cafes={cafes} hasDemoData={hasDemoData} resolvedPlace={resolvedPlace} />;
}
