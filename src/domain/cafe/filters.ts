/**
 * Filters visitors can apply.
 *
 * Two distinct kinds, kept apart on purpose:
 *   - amenity filters answer "does the place have X" (boolean facts)
 *   - quality filters answer "is X good enough" (a threshold on a dimension)
 *
 * Both narrow the result set. Neither changes any cafe's score.
 */
export const CAFE_FILTER_KEYS = [
  "wifi",
  "outlets",
  "quiet",
  "laptopTables",
  "longStay",
  "calls",
  "airConditioning",
  "restroom",
] as const;

export type CafeFilterKey = (typeof CAFE_FILTER_KEYS)[number];

export type CafeFilters = Partial<Record<CafeFilterKey, boolean>>;

export interface CafeFilterDefinition {
  readonly key: CafeFilterKey;
  readonly label: string;
  /** Shown as help text; explains exactly what applying the filter does. */
  readonly description: string;
  readonly icon: "wifi" | "plug" | "volume" | "laptop" | "clock" | "phone" | "snowflake" | "door";
}

/**
 * The threshold a scored dimension must clear to satisfy its filter.
 *
 * 60 on the 0-100 scale is roughly "consistently rated 4 or better once there is
 * real evidence behind it". Set deliberately above the 50 neutral prior so that
 * an unrated cafe can never satisfy a quality filter by default.
 */
export const QUALITY_FILTER_THRESHOLD = 60;

export const CAFE_FILTERS: readonly CafeFilterDefinition[] = [
  {
    key: "wifi",
    label: "Reliable Wi-Fi",
    description: "Rated as dependable enough to actually work on.",
    icon: "wifi",
  },
  {
    key: "outlets",
    label: "Power outlets",
    description: "Sockets are reachable from a seat, not just theoretically present.",
    icon: "plug",
  },
  {
    key: "quiet",
    label: "Quiet enough to focus",
    description: "Calm at a typical busy moment, not just first thing in the morning.",
    icon: "volume",
  },
  {
    key: "laptopTables",
    label: "Laptop-friendly tables",
    description: "Tables and chairs that suit a laptop for more than twenty minutes.",
    icon: "laptop",
  },
  {
    key: "longStay",
    label: "Fine to stay for hours",
    description: "Staying a few hours is welcomed rather than merely tolerated.",
    icon: "clock",
  },
  {
    key: "calls",
    label: "Calls allowed",
    description: "Taking a video or phone call here is acceptable.",
    icon: "phone",
  },
  {
    key: "airConditioning",
    label: "Air conditioning",
    description: "Reported to have air conditioning.",
    icon: "snowflake",
  },
  {
    key: "restroom",
    label: "Restroom",
    description: "Has a restroom for customers.",
    icon: "door",
  },
];

const FILTER_BY_KEY = new Map(CAFE_FILTERS.map((filter) => [filter.key, filter]));

export function getFilterDefinition(key: CafeFilterKey): CafeFilterDefinition {
  const definition = FILTER_BY_KEY.get(key);
  if (!definition) throw new Error(`Unknown cafe filter: ${key}`);
  return definition;
}

export function isCafeFilterKey(value: string): value is CafeFilterKey {
  return FILTER_BY_KEY.has(value as CafeFilterKey);
}

/** Only the filters that are switched on, in a stable order. */
export function activeFilterKeys(filters: CafeFilters): CafeFilterKey[] {
  return CAFE_FILTER_KEYS.filter((key) => filters[key] === true);
}

export function countActiveFilters(filters: CafeFilters): number {
  return activeFilterKeys(filters).length;
}

/** Guard against a nonsensical minimum score arriving from a query string. */
export function clampMinScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
