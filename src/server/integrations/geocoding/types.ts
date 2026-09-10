export interface GeocodeResult {
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  /** Coarse type from the provider ("suburb", "city", ...). Display only. */
  readonly type: string | null;
}

export interface GeocodingProvider {
  search(query: string, signal?: AbortSignal): Promise<GeocodeResult[]>;
}
