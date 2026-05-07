import type { Goal } from '$lib/types';

const DIRECT_IMAGE_EXTENSIONS = /\.(gif|png|jpe?g|webp)$/i;
const SAFE_GIPHY_ID = /^[a-zA-Z0-9]+$/;

function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function getDirectImageUrl(url: URL): string | null {
  if (DIRECT_IMAGE_EXTENSIONS.test(url.pathname)) {
    return url.toString();
  }

  return null;
}

function getGiphyGifUrl(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (!host.includes('giphy.com')) return null;

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  if (segments[0] === 'media' && segments[1] && SAFE_GIPHY_ID.test(segments[1])) {
    return `https://media.giphy.com/media/${segments[1]}/giphy.gif`;
  }

  const last = segments[segments.length - 1];
  const id = last.split('-').pop();
  if (!id || !SAFE_GIPHY_ID.test(id)) return null;

  return `https://media.giphy.com/media/${id}/giphy.gif`;
}

function toPreviewImageUrl(rawUrl: string): string | null {
  const parsed = parseUrl(rawUrl);
  if (!parsed) return null;

  return getDirectImageUrl(parsed) ?? getGiphyGifUrl(parsed);
}

export function getMovePreviewImageUrl(goal: Pick<Goal, 'type' | 'sourceUrl' | 'links'>): string | null {
  if (goal.type !== 'move') return null;

  const candidates = [
    goal.sourceUrl,
    ...goal.links.map((link) => link.url),
  ].filter((value): value is string => !!value && value.trim().length > 0);

  for (const candidate of candidates) {
    const preview = toPreviewImageUrl(candidate);
    if (preview) return preview;
  }

  return null;
}