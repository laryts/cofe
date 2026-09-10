/**
 * Safe handling of contributor-supplied URLs.
 *
 * Café websites come from the community. Today that means a maintainer reviews
 * every one through an issue template, but the schema accepts any string and V1
 * opens direct submission — so the render boundary should not assume the value
 * is a benign http(s) URL. `javascript:` and `data:` hrefs are the obvious
 * hazard; a malformed string that breaks the display is the boring one.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** Returns the URL only if it is safe to put in an href, otherwise null. */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.toString() : null;
  } catch {
    // Not a URL at all. Rather than guess at a protocol and risk turning
    // "javascript:..." into something clickable, treat it as absent.
    return null;
  }
}

/** Host and path, for display. Strips the protocol and any trailing slash. */
export function formatUrlForDisplay(value: string): string {
  try {
    const url = new URL(value);
    const path = url.pathname === "/" ? "" : url.pathname;
    return `${url.host}${path}${url.search}`;
  } catch {
    return value;
  }
}
