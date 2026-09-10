import { describe, expect, it } from "vitest";

import {
  computeWorkFriendlyScore,
  confidenceFor,
  normalizeRating,
  scoreBand,
  shrunkDimensionScore,
  type DimensionRatings,
} from "./score";
import { DIMENSION_WEIGHTS, SCORED_DIMENSIONS } from "./weights";

const perfect: DimensionRatings = { wifi: 5, outlets: 5, seating: 5, longStay: 5, noise: 5 };
const awful: DimensionRatings = { wifi: 1, outlets: 1, seating: 1, longStay: 1, noise: 1 };
const neutral: DimensionRatings = { wifi: 3, outlets: 3, seating: 3, longStay: 3, noise: 3 };

describe("weights", () => {
  it("sum to exactly 100, so contributions are readable as percentages", () => {
    const total = SCORED_DIMENSIONS.reduce((sum, d) => sum + DIMENSION_WEIGHTS[d], 0);
    expect(total).toBe(100);
  });
});

describe("normalizeRating", () => {
  it("maps the 1-5 scale onto 0-100", () => {
    expect(normalizeRating(1)).toBe(0);
    expect(normalizeRating(3)).toBe(50);
    expect(normalizeRating(5)).toBe(100);
  });
});

describe("shrunkDimensionScore", () => {
  it("returns null when nobody has rated the dimension", () => {
    expect(shrunkDimensionScore([])).toBeNull();
  });

  it("pulls a single enthusiastic rating well below its face value", () => {
    // (100 + 3*50) / (1 + 3) = 62.5, not 100.
    expect(shrunkDimensionScore([5])).toBe(62.5);
  });

  it("pulls a single terrible rating up towards neutral", () => {
    // (0 + 3*50) / 4 = 37.5, not 0.
    expect(shrunkDimensionScore([1])).toBe(37.5);
  });

  it("converges towards the raw mean as evidence accumulates", () => {
    const ten = shrunkDimensionScore(Array.from({ length: 10 }, () => 5));
    const hundred = shrunkDimensionScore(Array.from({ length: 100 }, () => 5));

    expect(ten).toBeCloseTo(88.5, 1);
    expect(hundred).toBeGreaterThan(97);
    expect(hundred).toBeLessThan(100);
  });

  it("leaves a neutral rating exactly at the prior", () => {
    expect(shrunkDimensionScore([3])).toBe(50);
  });
});

describe("confidenceFor", () => {
  it.each([
    [0, "none"],
    [1, "none"],
    [2, "low"],
    [4, "low"],
    [5, "medium"],
    [14, "medium"],
    [15, "high"],
    [200, "high"],
  ])("maps %i reports to %s", (count, expected) => {
    expect(confidenceFor(count)).toBe(expected);
  });
});

describe("computeWorkFriendlyScore", () => {
  it("publishes no score at all when there are no reports", () => {
    const result = computeWorkFriendlyScore([]);

    expect(result.total).toBeNull();
    expect(result.confidence).toBe("none");
    expect(result.reportCount).toBe(0);
  });

  it("withholds the score below the minimum report threshold", () => {
    // A confident-looking number from one opinion is the failure mode this guards.
    const result = computeWorkFriendlyScore([perfect]);

    expect(result.total).toBeNull();
    expect(result.confidence).toBe("none");
    expect(result.breakdown.every((entry) => entry.contribution === 0)).toBe(true);
  });

  it("publishes a score once the threshold is met", () => {
    const result = computeWorkFriendlyScore([perfect, perfect]);

    expect(result.total).not.toBeNull();
    expect(result.confidence).toBe("low");
  });

  it("keeps even unanimous praise short of 100", () => {
    const result = computeWorkFriendlyScore(Array.from({ length: 20 }, () => perfect));

    expect(result.total).toBeGreaterThan(90);
    expect(result.total).toBeLessThan(100);
  });

  it("keeps even unanimous criticism above 0", () => {
    const result = computeWorkFriendlyScore(Array.from({ length: 20 }, () => awful));

    expect(result.total).toBeLessThan(10);
    expect(result.total).toBeGreaterThan(0);
  });

  it("lands on the prior when every rating is neutral", () => {
    const result = computeWorkFriendlyScore([neutral, neutral, neutral]);

    expect(result.total).toBe(50);
  });

  it("renormalises weights so unrated dimensions are not a penalty", () => {
    const wifiOnly: DimensionRatings = { wifi: 5 };
    const result = computeWorkFriendlyScore([wifiOnly, wifiOnly, wifiOnly, wifiOnly]);

    // Wi-Fi is the only dimension with data, so it carries the whole score
    // rather than the cafe being marked down for the four unknown dimensions.
    expect(result.total).toBeCloseTo(shrunkDimensionScore([5, 5, 5, 5]) ?? 0, 1);

    const noiseEntry = result.breakdown.find((entry) => entry.dimension === "noise");
    expect(noiseEntry?.score).toBeNull();
    expect(noiseEntry?.ratingCount).toBe(0);
  });

  it("produces a breakdown whose contributions sum to the headline number", () => {
    const mixed: DimensionRatings[] = [
      { wifi: 5, outlets: 4, seating: 3, longStay: 5, noise: 2 },
      { wifi: 4, outlets: 5, seating: 4, longStay: 4, noise: 3 },
      { wifi: 5, outlets: 3, seating: 4, longStay: 5, noise: 2 },
    ];

    const result = computeWorkFriendlyScore(mixed);
    const summed = result.breakdown.reduce((sum, entry) => sum + entry.contribution, 0);

    // This is the explainability guarantee: a reader can add the column up.
    expect(summed).toBeCloseTo(result.total ?? 0, 0);
  });

  it("counts ratings per dimension independently of report count", () => {
    const result = computeWorkFriendlyScore([{ wifi: 5, outlets: 4 }, { wifi: 4 }, { noise: 2 }]);

    const byDimension = Object.fromEntries(
      result.breakdown.map((entry) => [entry.dimension, entry.ratingCount]),
    );

    expect(byDimension).toMatchObject({ wifi: 2, outlets: 1, noise: 1, seating: 0, longStay: 0 });
    expect(result.reportCount).toBe(3);
  });

  it("ignores out-of-range and missing ratings rather than trusting them", () => {
    const result = computeWorkFriendlyScore([
      { wifi: 9, outlets: 0, seating: null, longStay: undefined, noise: 4 },
      { noise: 4 },
    ]);

    const byDimension = Object.fromEntries(
      result.breakdown.map((entry) => [entry.dimension, entry.ratingCount]),
    );

    expect(byDimension).toMatchObject({ wifi: 0, outlets: 0, seating: 0, longStay: 0, noise: 2 });
  });

  it("ranks a better cafe above a worse one", () => {
    const good = computeWorkFriendlyScore(Array.from({ length: 6 }, () => perfect));
    const bad = computeWorkFriendlyScore(Array.from({ length: 6 }, () => awful));

    expect(good.total ?? 0).toBeGreaterThan(bad.total ?? 0);
  });

  it("does not let a single rave review outrank a well-evidenced good cafe", () => {
    const rave = computeWorkFriendlyScore([perfect, perfect]);
    const established = computeWorkFriendlyScore(
      Array.from({ length: 25 }, () => ({
        wifi: 4,
        outlets: 4,
        seating: 4,
        longStay: 4,
        noise: 4,
      })),
    );

    expect(established.total ?? 0).toBeGreaterThan(rave.total ?? 0);
    expect(established.confidence).toBe("high");
    expect(rave.confidence).toBe("low");
  });
});

describe("scoreBand", () => {
  it.each([
    [null, "unknown"],
    [95, "high"],
    [70, "high"],
    [69.9, "mid"],
    [45, "mid"],
    [44.9, "low"],
    [0, "low"],
  ])("maps %s to %s", (total, expected) => {
    expect(scoreBand(total)).toBe(expected);
  });
});
