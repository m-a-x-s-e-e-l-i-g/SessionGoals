import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// ─── Server-side in-memory image cache ───────────────────────────────────────

interface CacheEntry {
  buffer: ArrayBuffer;
  contentType: string;
  cachedAt: number;
}

const IMAGE_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 500;

function getCached(url: string): CacheEntry | null {
  const entry = IMAGE_CACHE.get(url);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    IMAGE_CACHE.delete(url);
    return null;
  }
  return entry;
}

function setCached(url: string, entry: CacheEntry): void {
  // Evict oldest entries when the cache is full
  if (IMAGE_CACHE.size >= MAX_CACHE_ENTRIES) {
    const oldest = [...IMAGE_CACHE.entries()].sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    for (const [key] of oldest.slice(0, Math.ceil(MAX_CACHE_ENTRIES * 0.1))) {
      IMAGE_CACHE.delete(key);
    }
  }
  IMAGE_CACHE.set(url, entry);
}

// ─── Allowed domains ─────────────────────────────────────────────────────────

const ALLOWED_DOMAINS = [
  'parkour.spot',
  'cdn.parkour.spot',
  'images.parkour.spot',
  'media.giphy.com',
  'media0.giphy.com',
  'media1.giphy.com',
  'media2.giphy.com',
  'media3.giphy.com',
  'media4.giphy.com',
  'i.giphy.com',
];

function isAllowedDomain(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

export const GET: RequestHandler = async ({ url, request }) => {
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let imageUrlObj: URL;
  try {
    imageUrlObj = new URL(imageUrl);
  } catch {
    return json({ error: 'Invalid image URL' }, { status: 400 });
  }

  if (!isAllowedDomain(imageUrlObj.hostname)) {
    return json({ error: 'Image URL not from allowed domain' }, { status: 403 });
  }

  // Derive a stable ETag from the URL — content is fully determined by the URL
  const etag = `"${Buffer.from(imageUrl).toString('base64url').slice(0, 40)}"`;
  const cacheControl = 'public, max-age=604800, immutable'; // 7 days, never revalidate

  // Honour conditional GET — return 304 if client already has a fresh copy
  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, {
      status: 304,
      headers: { 'cache-control': cacheControl, 'etag': etag },
    });
  }

  // Serve from server-side memory cache if available
  const cached = getCached(imageUrl);
  if (cached) {
    return new Response(cached.buffer, {
      status: 200,
      headers: {
        'content-type': cached.contentType,
        'cache-control': cacheControl,
        'etag': etag,
        'x-cache': 'HIT',
      },
    });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'SessionGoals/1.0' },
    });

    if (!response.ok) {
      return json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return json({ error: 'URL did not return an image' }, { status: 400 });
    }

    const buffer = await response.arrayBuffer();
    setCached(imageUrl, { buffer, contentType, cachedAt: Date.now() });

    return new Response(buffer, {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': cacheControl,
        'etag': etag,
        'x-cache': 'MISS',
      },
    });
  } catch (err: any) {
    console.error('Image proxy error:', err);
    return json({ error: 'Failed to fetch image' }, { status: 500 });
  }
};
