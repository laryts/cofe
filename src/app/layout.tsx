import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { messages } from "@/lib/i18n";
import { SITE_URL } from "@/lib/public-env";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${messages.brand.name} — ${messages.brand.tagline}`,
    template: `%s · ${messages.brand.name}`,
  },
  description:
    "An open, community-maintained map of cafés that are genuinely good to work from: Wi-Fi, power outlets, quiet, comfortable tables and long stays.",
  applicationName: messages.brand.name,
  keywords: [
    "cafes to work from",
    "laptop friendly cafe",
    "remote work",
    "coworking",
    "wifi cafe",
    "study spots",
  ],
  openGraph: {
    type: "website",
    siteName: messages.brand.name,
    title: `${messages.brand.name} — ${messages.brand.tagline}`,
    description:
      "Find cafés with reliable Wi-Fi, power outlets, quiet corners and tables that fit a laptop.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${messages.brand.name} — ${messages.brand.tagline}`,
    description: "Find cafés with reliable Wi-Fi, power, quiet and space to work.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#232019" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="bg-accent text-accent-foreground focus:ring-ring sr-only rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
        >
          {messages.nav.skipToContent}
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
