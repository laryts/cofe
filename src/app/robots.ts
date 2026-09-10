import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/public-env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/explore"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
