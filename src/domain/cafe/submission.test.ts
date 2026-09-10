import { describe, expect, it } from "vitest";

import { hasSubstance, newCafeSubmissionSchema, newReportSubmissionSchema } from "./submission";

const validCafe = {
  name: "Estúdio Bica",
  city: "São Paulo",
  countryCode: "br",
  latitude: -23.5892,
  longitude: -46.6354,
  ratings: { wifi: 5, outlets: 4, seating: null, longStay: null, noise: null },
  amenities: { allowsCalls: true, hasAirConditioning: null, hasRestroom: null },
};

describe("newCafeSubmissionSchema", () => {
  it("accepts a minimal honest submission", () => {
    const result = newCafeSubmissionSchema.safeParse(validCafe);
    expect(result.success).toBe(true);
  });

  it("normalises the country code, so 'br' and 'BR' are the same country", () => {
    const result = newCafeSubmissionSchema.parse(validCafe);
    expect(result.countryCode).toBe("BR");
  });

  it.each([
    ["a name that is too short", { name: "x" }],
    ["no city", { city: "" }],
    ["a latitude off the planet", { latitude: 200 }],
    ["a longitude off the planet", { longitude: -200 }],
    ["a three-letter country code", { countryCode: "BRA" }],
  ])("rejects %s", (_label, override) => {
    const result = newCafeSubmissionSchema.safeParse({ ...validCafe, ...override });
    expect(result.success).toBe(false);
  });

  it("rejects a rating outside the 1-5 scale rather than clamping it", () => {
    const result = newCafeSubmissionSchema.safeParse({
      ...validCafe,
      ratings: { ...validCafe.ratings, wifi: 9 },
    });
    expect(result.success).toBe(false);
  });

  it("treats a missing rating as null rather than as zero", () => {
    const result = newCafeSubmissionSchema.parse({
      ...validCafe,
      ratings: { wifi: 4, outlets: undefined, seating: null, longStay: null, noise: null },
    });

    expect(result.ratings.outlets).toBeNull();
    expect(result.ratings.wifi).toBe(4);
  });

  it("keeps amenities tri-state: unknown never collapses to false", () => {
    const result = newCafeSubmissionSchema.parse({
      ...validCafe,
      amenities: { allowsCalls: null, hasAirConditioning: false, hasRestroom: true },
    });

    expect(result.amenities.allowsCalls).toBeNull();
    expect(result.amenities.hasAirConditioning).toBe(false);
    expect(result.amenities.hasRestroom).toBe(true);
  });

  it("accepts the honeypot as an ordinary field so a bot gets no validation hint", () => {
    // The route rejects a filled honeypot silently. If the schema rejected it,
    // the 400 would name the field and tell a bot exactly what tripped it.
    const result = newCafeSubmissionSchema.safeParse({
      ...validCafe,
      website_url: "http://spam.example",
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.website_url).toBe("http://spam.example");
  });

  it("blanks empty optional strings instead of storing empty values", () => {
    const result = newCafeSubmissionSchema.parse({ ...validCafe, website: "", comment: "" });
    expect(result.website).toBeNull();
    expect(result.comment).toBeNull();
  });

  it("does not let a submitter set moderation state", () => {
    const result = newCafeSubmissionSchema.parse({
      ...validCafe,
      status: "published",
      source: "seed",
    } as Record<string, unknown>);

    expect(result).not.toHaveProperty("status");
    expect(result).not.toHaveProperty("source");
  });
});

describe("newReportSubmissionSchema", () => {
  it("accepts ratings without any café identity — that comes from the URL", () => {
    const result = newReportSubmissionSchema.safeParse({
      ratings: { wifi: 3, outlets: null, seating: null, longStay: null, noise: 2 },
      amenities: { allowsCalls: null, hasAirConditioning: null, hasRestroom: null },
      comment: "Noisy after midday.",
    });

    expect(result.success).toBe(true);
  });
});

describe("hasSubstance", () => {
  const noRatings = { wifi: null, outlets: null, seating: null, longStay: null, noise: null };

  it("rejects a submission with neither a rating nor a note", () => {
    // Nothing for a moderator to act on, and nothing useful to a reader.
    expect(hasSubstance({ ratings: noRatings, comment: null })).toBe(false);
  });

  it("accepts a single rating", () => {
    expect(hasSubstance({ ratings: { ...noRatings, wifi: 4 }, comment: null })).toBe(true);
  });

  it("accepts a note with no ratings at all", () => {
    // "They took the sofas out" is worth knowing even without a score attached.
    expect(hasSubstance({ ratings: noRatings, comment: "They took the sofas out." })).toBe(true);
  });
});
