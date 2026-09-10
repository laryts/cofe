/**
 * Geographic primitives.
 *
 * Deliberately dependency-free. The MVP resolves proximity with a bounding-box
 * prefilter plus haversine ordering rather than PostGIS — see docs/PLAN.md §9
 * for the rationale and the documented upgrade path. Everything that knows how
 * distance is computed lives here and in the cafe repository; nothing above
 * those two modules should care.
 */

export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

/** [minLongitude, minLatitude, maxLongitude, maxLatitude] — GeoJSON ordering. */
export interface BoundingBox {
  readonly minLongitude: number;
  readonly minLatitude: number;
  readonly maxLongitude: number;
  readonly maxLatitude: number;
}

export const EARTH_RADIUS_KM = 6371;

const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -MAX_LATITUDE && value <= MAX_LATITUDE;
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -MAX_LONGITUDE && value <= MAX_LONGITUDE;
}

export function isValidCoordinates(value: Coordinates): boolean {
  return isValidLatitude(value.latitude) && isValidLongitude(value.longitude);
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Great-circle distance in kilometres.
 *
 * Haversine treats the Earth as a sphere, which is wrong by up to ~0.5%. At the
 * scale this product cares about — "is this cafe 400m or 2km away" — that error
 * is far smaller than the user's own uncertainty about where they are standing.
 */
export function haversineDistanceKm(from: Coordinates, to: Coordinates): number {
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 + Math.sin(deltaLon / 2) ** 2 * Math.cos(fromLat) * Math.cos(toLat);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * A box that fully contains the circle of `radiusKm` around `center`.
 *
 * This is the indexable prefilter: Postgres narrows to the box using a plain
 * btree index on (latitude, longitude), and haversine then orders the survivors.
 * The box over-selects at the corners, which is fine — the exact distance filter
 * runs afterwards.
 */
export function boundingBoxAround(center: Coordinates, radiusKm: number): BoundingBox {
  const latitudeDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);

  // Longitude degrees shrink towards the poles. Guard against the cosine
  // collapsing to zero at extreme latitudes, which would produce an infinite box.
  const cosLatitude = Math.cos(toRadians(center.latitude));
  const longitudeDelta =
    Math.abs(cosLatitude) < 1e-6 ? MAX_LONGITUDE : latitudeDelta / Math.abs(cosLatitude);

  return {
    minLatitude: Math.max(-MAX_LATITUDE, center.latitude - latitudeDelta),
    maxLatitude: Math.min(MAX_LATITUDE, center.latitude + latitudeDelta),
    minLongitude: Math.max(-MAX_LONGITUDE, center.longitude - longitudeDelta),
    maxLongitude: Math.min(MAX_LONGITUDE, center.longitude + longitudeDelta),
  };
}

/** Centre point of a bounding box. */
export function boundingBoxCenter(box: BoundingBox): Coordinates {
  return {
    latitude: (box.minLatitude + box.maxLatitude) / 2,
    longitude: (box.minLongitude + box.maxLongitude) / 2,
  };
}

/** Human-readable distance: metres below 1km, one decimal below 10km. */
export function formatDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
