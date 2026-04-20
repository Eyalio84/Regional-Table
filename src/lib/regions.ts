/**
 * regions.ts — slug adapter + region metadata helper.
 *
 * URL slugs (kebab-case) ↔ backend region_ids (snake_case).
 * The adapter is the single source of truth for this mapping.
 * Components and pages should call toBackendId() rather than
 * performing their own string replacements.
 */

export type RegionSlug =
  | 'neapolitan'
  | 'lyonnais'
  | 'cajun-creole'
  | 'nyc-street-food'
  | 'washoku';

export type BackendRegionId =
  | 'neapolitan'
  | 'lyonnais'
  | 'cajun_creole'
  | 'nyc_street_food'
  | 'washoku';

const SLUG_TO_ID: Record<RegionSlug, BackendRegionId> = {
  'neapolitan':     'neapolitan',
  'lyonnais':       'lyonnais',
  'cajun-creole':   'cajun_creole',
  'nyc-street-food': 'nyc_street_food',
  'washoku':        'washoku',
};

const ID_TO_SLUG: Record<BackendRegionId, RegionSlug> = {
  'neapolitan':    'neapolitan',
  'lyonnais':      'lyonnais',
  'cajun_creole':  'cajun-creole',
  'nyc_street_food': 'nyc-street-food',
  'washoku':       'washoku',
};

/** Translate a URL slug to the backend region_id. */
export function toBackendId(slug: RegionSlug): BackendRegionId {
  return SLUG_TO_ID[slug];
}

/** Translate a backend region_id back to the URL slug. */
export function toUrlSlug(id: BackendRegionId): RegionSlug {
  return ID_TO_SLUG[id];
}

/** All region slugs in display order. */
export const ALL_REGIONS: RegionSlug[] = [
  'neapolitan',
  'lyonnais',
  'cajun-creole',
  'nyc-street-food',
  'washoku',
];

const COORDINATES: Record<RegionSlug, { lat: number; lon: number }> = {
  'neapolitan':      { lat: 40.84, lon: 14.25 },  // Naples
  'lyonnais':        { lat: 45.76, lon: 4.83 },   // Lyon
  'cajun-creole':    { lat: 29.95, lon: -90.07 }, // New Orleans
  'nyc-street-food': { lat: 40.71, lon: -74.01 }, // New York City
  'washoku':         { lat: 35.68, lon: 139.69 }, // Tokyo
};

/** Returns the lat/lon used in CoordinateStrip for a given region slug. */
export function regionCoordinates(slug: RegionSlug): { lat: number; lon: number } {
  return COORDINATES[slug];
}
