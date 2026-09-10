import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/public-env";
import { getAllCafeSlugs } from "@/server/services/cafe-service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cafes = await getAllCafeSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/score`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contribute`, changeFrequency: "monthly", priority: 0.5 },
  ];

  return [
    ...staticRoutes,
    ...cafes.map((cafe) => ({
      url: `${SITE_URL}/cafes/${cafe.slug}`,
      lastModified: cafe.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
