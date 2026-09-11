import { z } from "zod";

import { MAX_RATING, MIN_RATING } from "../scoring/weights";

/**
 * What a person may submit.
 *
 * Defined in the domain rather than beside the route handler, so the web form,
 * the HTTP API and a future mobile client all validate against one definition.
 * Nothing here trusts the client: the caller cannot set status, source, or any
 * moderation field — those are decided server-side.
 */

const rating = z
  .number()
  .int()
  .min(MIN_RATING)
  .max(MAX_RATING)
  .nullish()
  .transform((value) => value ?? null);

/**
 * A dimension may be left blank. Blanks are handled properly by the scoring
 * model and do not count against a café, so an honest gap beats a guess.
 */
export const workRatingsSchema = z.object({
  wifi: rating,
  outlets: rating,
  seating: rating,
  longStay: rating,
  noise: rating,
});

const tristate = z
  .union([z.boolean(), z.null(), z.literal("unknown")])
  .nullish()
  .transform((value) => (typeof value === "boolean" ? value : null));

export const amenitiesSchema = z.object({
  allowsCalls: tristate,
  hasAirConditioning: tristate,
  hasRestroom: tristate,
});

const comment = z
  .string()
  .trim()
  .max(600, "Keep it under 600 characters.")
  .optional()
  .transform((value) => (value ? value : null));

const contributorHandle = z
  .string()
  .trim()
  .max(60)
  .optional()
  .transform((value) => (value ? value : null));

/**
 * Anti-spam honeypot.
 *
 * A field hidden from people but visible to naive bots. Anything non-empty is a
 * bot. Cheap, invisible to real users, and it does not punish anyone for having
 * JavaScript disabled the way a challenge would.
 *
 * Note it validates as an ordinary optional string rather than rejecting a
 * non-empty value here. A schema error would return 400 naming this field,
 * which tells a bot exactly which input tripped it. The route checks the value
 * instead and answers as though the submission succeeded, so a bot learns
 * nothing and stops retrying.
 */
export const honeypotSchema = z.string().max(300).optional();

export const visitedAtSchema = z
  .string()
  .trim()
  .max(40)
  .optional()
  .transform((value) => (value ? value : null));

export const newCafeSubmissionSchema = z.object({
  name: z.string().trim().min(2, "A name is required.").max(120),
  address: z.string().trim().max(200).optional().default(""),
  neighborhood: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().min(1, "A city is required.").max(120),
  countryCode: z
    .string()
    .trim()
    .length(2, "Use a two-letter country code.")
    .transform((value) => value.toUpperCase()),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  website: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((value) => (value ? value : null)),
  description: z.string().trim().max(400).optional(),
  openingHours: z.string().trim().max(200).optional(),

  ratings: workRatingsSchema,
  amenities: amenitiesSchema,
  comment,
  contributorHandle,
  visitedAt: visitedAtSchema,

  website_url: honeypotSchema,
});

export type NewCafeSubmission = z.infer<typeof newCafeSubmissionSchema>;

export const newReportSubmissionSchema = z.object({
  ratings: workRatingsSchema,
  amenities: amenitiesSchema,
  comment,
  contributorHandle,
  visitedAt: visitedAtSchema,

  website_url: honeypotSchema,
});

export type NewReportSubmission = z.infer<typeof newReportSubmissionSchema>;

/**
 * A submission with no observation in it is not worth a moderator's time.
 * At least one rating, or a written note, must be present.
 */
export function hasSubstance(input: {
  ratings: z.infer<typeof workRatingsSchema>;
  comment: string | null;
}): boolean {
  const anyRating = Object.values(input.ratings).some((value) => value !== null);
  return anyRating || Boolean(input.comment);
}
