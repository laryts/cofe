import { describe, expect, it } from "vitest";

import { formatUrlForDisplay, safeExternalUrl } from "./urls";

describe("safeExternalUrl", () => {
  it.each([
    ["https://example.com", "https://example.com/"],
    ["http://example.com/cafe", "http://example.com/cafe"],
    ["https://example.com/a?b=c", "https://example.com/a?b=c"],
  ])("allows %s", (input, expected) => {
    expect(safeExternalUrl(input)).toBe(expected);
  });

  it.each([
    ["javascript:alert(1)"],
    ["data:text/html,<script>alert(1)</script>"],
    ["vbscript:msgbox(1)"],
    ["file:///etc/passwd"],
  ])("rejects %s", (input) => {
    expect(safeExternalUrl(input)).toBeNull();
  });

  it.each([[null], [undefined], [""], ["not a url"], ["example.com"]])(
    "returns null for %s rather than guessing a protocol",
    (input) => {
      expect(safeExternalUrl(input)).toBeNull();
    },
  );
});

describe("formatUrlForDisplay", () => {
  it.each([
    ["https://example.com/", "example.com"],
    ["https://www.example.com/cafe", "www.example.com/cafe"],
    ["http://example.com/a?b=c", "example.com/a?b=c"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatUrlForDisplay(input)).toBe(expected);
  });
});
