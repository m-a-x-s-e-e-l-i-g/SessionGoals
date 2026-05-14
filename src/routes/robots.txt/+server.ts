import type { RequestHandler } from './$types';
import { getCanonicalOrigin } from '$lib/server/urls';

export const GET: RequestHandler = async ({ url }) => {
  const origin = getCanonicalOrigin(url);
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /auth/',
    'Disallow: /activity',
    'Disallow: /goals/new',
    'Disallow: /goals/*/edit',
    'Disallow: /lists/new',
    'Disallow: /lists/following',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
};