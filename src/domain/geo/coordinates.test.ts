import { describe, expect, it } from "vitest";

import {
  boundingBoxAround,
  boundingBoxCenter,
  formatDistance,
  haversineDistanceKm,
  isValidCoordinates,
  type Coordinates,
} from "./coordinates";

const saoPaulo: Coordinates = { latitude: -23.5505, longitude: -46.6333 };
const rioDeJaneiro: Coordinates = { latitude: -22.9068, longitude: -43.1729 };
const lisbon: Coordinates = { latitude: 38.7223, longitude: -9.1393 };

describe("haversineDistanceKm", () => {
  it("is zero for a point to itself", () => {
    expect(haversineDistanceKm(saoPaulo, saoPaulo)).toBe(0);
  });

  it("matches known distances within haversine's spherical error", () => {
    // São Paulo to Rio is about 360km; Lisbon is about 7,900km from São Paulo.
    expect(haversineDistanceKm(saoPaulo, rioDeJaneiro)).toBeGreaterThan(350);
    expect(haversineDistanceKm(saoPaulo, rioDeJaneiro)).toBeLessThan(370);
    expect(haversineDistanceKm(saoPaulo, lisbon)).toBeGreaterThan(7700);
    expect(haversineDistanceKm(saoPaulo, lisbon)).toBeLessThan(8100);
  });

  it("is symmetric", () => {
    expect(haversineDistanceKm(saoPaulo, lisbon)).toBeCloseTo(
      haversineDistanceKm(lisbon, saoPaulo),
      9,
    );
  });

  it("handles antipodal points without NaN from floating point drift", () => {
    const north: Coordinates = { latitude: 90, longitude: 0 };
    const south: Coordinates = { latitude: -90, longitude: 0 };
    const distance = haversineDistanceKm(north, south);

    expect(Number.isNaN(distance)).toBe(false);
    expect(distance).toBeCloseTo(Math.PI * 6371, 0);
  });

  it("crosses the antimeridian correctly", () => {
    const west: Coordinates = { latitude: 0, longitude: 179.9 };
    const east: Coordinates = { latitude: 0, longitude: -179.9 };

    // Roughly 22km apart the short way, not most of the way around the planet.
    expect(haversineDistanceKm(west, east)).toBeLessThan(30);
  });
});

describe("boundingBoxAround", () => {
  it("fully contains the requested radius", () => {
    const radiusKm = 5;
    const box = boundingBoxAround(saoPaulo, radiusKm);

    // Every corner must be at least the radius away, or the box would clip
    // cafes that are genuinely within range.
    const corners: Coordinates[] = [
      { latitude: box.minLatitude, longitude: box.minLongitude },
      { latitude: box.minLatitude, longitude: box.maxLongitude },
      { latitude: box.maxLatitude, longitude: box.minLongitude },
      { latitude: box.maxLatitude, longitude: box.maxLongitude },
    ];

    for (const corner of corners) {
      expect(haversineDistanceKm(saoPaulo, corner)).toBeGreaterThanOrEqual(radiusKm);
    }
  });

  it("contains points inside the radius and is centred on the origin", () => {
    const box = boundingBoxAround(saoPaulo, 10);
    const centre = boundingBoxCenter(box);

    expect(centre.latitude).toBeCloseTo(saoPaulo.latitude, 6);
    expect(centre.longitude).toBeCloseTo(saoPaulo.longitude, 6);
    expect(box.minLatitude).toBeLessThan(saoPaulo.latitude);
    expect(box.maxLatitude).toBeGreaterThan(saoPaulo.latitude);
  });

  it("widens longitude at high latitude, where degrees are shorter", () => {
    const equator = boundingBoxAround({ latitude: 0, longitude: 0 }, 10);
    const arctic = boundingBoxAround({ latitude: 70, longitude: 0 }, 10);

    const width = (b: typeof equator) => b.maxLongitude - b.minLongitude;
    expect(width(arctic)).toBeGreaterThan(width(equator));
  });

  it("does not blow up at the pole, where the cosine collapses to zero", () => {
    const box = boundingBoxAround({ latitude: 90, longitude: 0 }, 10);

    expect(Number.isFinite(box.minLongitude)).toBe(true);
    expect(Number.isFinite(box.maxLongitude)).toBe(true);
    expect(box.maxLatitude).toBeLessThanOrEqual(90);
  });

  it("clamps to valid coordinate ranges", () => {
    const box = boundingBoxAround({ latitude: 89, longitude: 179 }, 500);

    expect(box.maxLatitude).toBeLessThanOrEqual(90);
    expect(box.minLatitude).toBeGreaterThanOrEqual(-90);
    expect(box.maxLongitude).toBeLessThanOrEqual(180);
    expect(box.minLongitude).toBeGreaterThanOrEqual(-180);
  });
});

describe("isValidCoordinates", () => {
  it.each([
    [{ latitude: 0, longitude: 0 }, true],
    [{ latitude: -23.5505, longitude: -46.6333 }, true],
    [{ latitude: 90, longitude: 180 }, true],
    [{ latitude: 91, longitude: 0 }, false],
    [{ latitude: 0, longitude: 181 }, false],
    [{ latitude: Number.NaN, longitude: 0 }, false],
    [{ latitude: 0, longitude: Infinity }, false],
  ])("validates %j as %s", (coords, expected) => {
    expect(isValidCoordinates(coords)).toBe(expected);
  });
});

describe("formatDistance", () => {
  it.each([
    [0.4, "400 m"],
    [0.999, "999 m"],
    [1, "1.0 km"],
    [2.34, "2.3 km"],
    [9.99, "10.0 km"],
    [12.4, "12 km"],
  ])("formats %f km as %s", (km, expected) => {
    expect(formatDistance(km)).toBe(expected);
  });

  it("returns an empty string rather than nonsense for invalid input", () => {
    expect(formatDistance(Number.NaN)).toBe("");
    expect(formatDistance(-1)).toBe("");
  });
});
