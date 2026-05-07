import { env } from '$env/dynamic/private';
import type { Spot, Tag } from '$lib/types';

const DEFAULT_API_BASE = 'https://parkour.spot/api/v1';

export type SpotSearchParams = {
  q?: string;
  minLat?: string;
  maxLat?: string;
  minLng?: string;
  maxLng?: string;
  limit?: string;
};

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const asNumber = Number(String(value ?? ''));
  return Number.isFinite(asNumber) ? asNumber : null;
}

function pickCoordinatePair(raw: any): { lat: number; lng: number } | null {
  const directLat =
    toNumber(raw?.lat) ??
    toNumber(raw?.latitude) ??
    toNumber(raw?.location?.lat) ??
    toNumber(raw?.location?.latitude) ??
    toNumber(raw?.coordinates?.lat) ??
    toNumber(raw?.coordinates?.latitude) ??
    toNumber(raw?.location?.coordinates?.lat) ??
    toNumber(raw?.location?.coordinates?.latitude) ??
    toNumber(raw?.geometry?.location?.lat) ??
    toNumber(raw?.geometry?.location?.latitude);
  const directLng =
    toNumber(raw?.lng) ??
    toNumber(raw?.lon) ??
    toNumber(raw?.longitude) ??
    toNumber(raw?.location?.lng) ??
    toNumber(raw?.location?.longitude) ??
    toNumber(raw?.coordinates?.lng) ??
    toNumber(raw?.coordinates?.lon) ??
    toNumber(raw?.coordinates?.longitude) ??
    toNumber(raw?.location?.coordinates?.lng) ??
    toNumber(raw?.location?.coordinates?.lon) ??
    toNumber(raw?.location?.coordinates?.longitude) ??
    toNumber(raw?.geometry?.location?.lng) ??
    toNumber(raw?.geometry?.location?.lon) ??
    toNumber(raw?.geometry?.location?.longitude);

  if (directLat !== null && directLng !== null) {
    return { lat: directLat, lng: directLng };
  }

  const geoJsonCoords =
    (Array.isArray(raw?.geometry?.coordinates) && raw.geometry.coordinates) ||
    (Array.isArray(raw?.location?.coordinates) && raw.location.coordinates) ||
    (Array.isArray(raw?.coordinates) && raw.coordinates) ||
    null;

  if (geoJsonCoords && geoJsonCoords.length >= 2) {
    const lng = toNumber(geoJsonCoords[0]);
    const lat = toNumber(geoJsonCoords[1]);
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
  }

  return null;
}

function getApiBase(): string {
  return asTrimmedString(env.PARKOUR_SPOT_API_URL) ?? DEFAULT_API_BASE;
}

function requireApiKey(): string {
  const key = asTrimmedString(env.PARKOUR_SPOT_API_KEY);
  if (!key) throw new Error('Missing PARKOUR_SPOT_API_KEY');
  return key;
}

export function isParkourSpotConfigured(): boolean {
  return Boolean(asTrimmedString(env.PARKOUR_SPOT_API_KEY));
}

/**
 * Validates the Bearer token sent by parkour.spot when it calls back into
 * this app's API endpoints (e.g. webhook / data routes).
 */
export function validateParkourSpotInboundToken(authHeader: string | null): boolean {
  const expected = asTrimmedString(env.PARKOUR_SPOT_BEARER_TOKEN);
  if (!expected) return false;
  if (!authHeader?.startsWith('Bearer ')) return false;
  return authHeader.slice(7) === expected;
}

async function parkourSpotFetch(path: string, init?: RequestInit): Promise<Response> {
  const key = requireApiKey();
  const url = path.startsWith('http') ? path : `${getApiBase()}${path.startsWith('/') ? '' : '/'}${path}`;

  return fetch(url, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${key}`
    }
  });
}

function normalizeTags(raw: any): Tag[] {
  const source =
    (Array.isArray(raw?.tags) && raw.tags) ||
    (Array.isArray(raw?.categories) && raw.categories) ||
    (Array.isArray(raw?.tagNames) && raw.tagNames) ||
    [];

  const out: Tag[] = [];
  const seen = new Set<string>();

  for (const entry of source) {
    const name =
      asTrimmedString(typeof entry === 'string' ? entry : entry?.name) ??
      asTrimmedString(typeof entry === 'string' ? entry : entry?.label);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: `tag-${key.replace(/\s+/g, '-')}`,
      name,
      category: asTrimmedString(typeof entry === 'object' ? entry?.category : null) ?? undefined
    });
  }

  return out;
}

function normalizeSpot(raw: any, index: number): Spot | null {
  const externalId =
    asTrimmedString(raw?.id) ??
    asTrimmedString(raw?.spotId) ??
    asTrimmedString(raw?.spot_id) ??
    asTrimmedString(raw?.externalId);
  if (!externalId) return null;

  const name =
    asTrimmedString(raw?.name) ??
    asTrimmedString(raw?.title) ??
    asTrimmedString(raw?.displayName) ??
    externalId;

  const coordinates = pickCoordinatePair(raw);

  const createdAt =
    asTrimmedString(raw?.createdAt) ??
    asTrimmedString(raw?.created_at) ??
    new Date().toISOString();

  return {
    id: `ps-${externalId}`,
    externalId,
    name,
    description:
      asTrimmedString(raw?.description) ??
      asTrimmedString(raw?.summary) ??
      asTrimmedString(raw?.notes) ??
      undefined,
    city:
      asTrimmedString(raw?.city) ??
      asTrimmedString(raw?.location?.city) ??
      asTrimmedString(raw?.address?.city) ??
      undefined,
    country:
      asTrimmedString(raw?.country) ??
      asTrimmedString(raw?.countryName) ??
      asTrimmedString(raw?.country_name) ??
      asTrimmedString(raw?.countryCode) ??
      asTrimmedString(raw?.country_code) ??
      asTrimmedString(raw?.address?.country) ??
      undefined,
    coordinates: coordinates ?? undefined,
    tags: normalizeTags(raw),
    imageUrl:
      asTrimmedString(Array.isArray(raw?.imageUrls) ? raw.imageUrls[0] : null) ??
      asTrimmedString(raw?.imageUrl) ??
      asTrimmedString(raw?.image_url) ??
      asTrimmedString(raw?.image) ??
      asTrimmedString(raw?.thumbnail) ??
      undefined,
    createdAt: createdAt || new Date(Date.now() + index).toISOString()
  };
}

function extractSpotArray(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  const obj = data as Record<string, unknown>;
  const candidates = [obj.spots, obj.results, obj.items, obj.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

export async function searchSpots(params: SpotSearchParams = {}): Promise<Spot[]> {
  const url = new URL(`${getApiBase()}/spots`);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const trimmed = String(value).trim();
    if (!trimmed) continue;
    url.searchParams.set(key, trimmed);
  }

  const res = await parkourSpotFetch(url.toString());
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data as any)?.error ||
      (data as any)?.message ||
      `parkour.spot request failed (${res.status})`;
    throw new Error(message);
  }

  return extractSpotArray(data)
    .map((raw, index) => normalizeSpot(raw, index))
    .filter((spot): spot is Spot => spot !== null);
}

