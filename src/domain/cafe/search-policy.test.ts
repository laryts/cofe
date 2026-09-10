import { describe, expect, it } from "vitest";

import { hasActiveFilters, shouldGeocodeFallback } from "./search-policy";

/** A case that would fall back, so each test can negate exactly one condition. */
const eligible = {
  query: "Berlin",
  hasOrigin: false,
  filters: undefined,
  directResultCount: 0,
} as const;

describe("shouldGeocodeFallback", () => {
  it("falls back when our own data has nothing for a plain text query", () => {
    expect(shouldGeocodeFallback(eligible)).toBe(true);
  });

  it("does not fall back when our own data already answered", () => {
    // The local search is free and authoritative for places we cover.
    expect(shouldGeocodeFallback({ ...eligible, directResultCount: 2 })).toBe(false);
  });

  it("does not fall back without a query", () => {
    expect(shouldGeocodeFallback({ ...eligible, query: undefined })).toBe(false);
    expect(shouldGeocodeFallback({ ...eligible, query: "" })).toBe(false);
  });

  it("does not fall back when the caller already supplied coordinates", () => {
    // Resolving a place name here would move the user somewhere they did not ask for.
    expect(shouldGeocodeFallback({ ...eligible, hasOrigin: true })).toBe(false);
  });

  it("does not fall back when filters are active", () => {
    // The regression this rule exists for: an empty filtered result means the
    // filters excluded everything, not that we lack data for the place. Falling
    // back here made co-fe claim "no cafés in Pinheiros" about a neighbourhood
    // it holds several cafés for.
    expect(shouldGeocodeFallback({ ...eligible, filters: { quiet: true } })).toBe(false);
    expect(shouldGeocodeFallback({ ...eligible, filters: { wifi: true, calls: true } })).toBe(
      false,
    );
  });

  it("ignores filters that are present but switched off", () => {
    // A URL can carry `?quiet=false`; that is not an active filter.
    expect(shouldGeocodeFallback({ ...eligible, filters: { quiet: false } })).toBe(true);
    expect(shouldGeocodeFallback({ ...eligible, filters: {} })).toBe(true);
  });

  it("requires every condition, not just most of them", () => {
    expect(
      shouldGeocodeFallback({
        query: "Berlin",
        hasOrigin: true,
        filters: { wifi: true },
        directResultCount: 5,
      }),
    ).toBe(false);
  });
});

describe("hasActiveFilters", () => {
  it.each([
    [undefined, false],
    [{}, false],
    [{ quiet: false }, false],
    [{ quiet: true }, true],
    [{ quiet: false, wifi: true }, true],
  ])("treats %j as %s", (filters, expected) => {
    expect(hasActiveFilters(filters)).toBe(expected);
  });
});
