import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Only allow proxying URLs from parkour.spot domain or similar trusted CDNs
  const allowedDomains = [
    'parkour.spot',
    'cdn.parkour.spot',
    'images.parkour.spot',
    // Add other CDN domains as needed
  ];

  try {
    const imageUrlObj = new URL(imageUrl);
    const isAllowed = allowedDomains.some(domain => 
      imageUrlObj.hostname === domain || imageUrlObj.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return json({ error: 'Image URL not from allowed domain' }, { status: 403 });
    }
  } catch {
    return json({ error: 'Invalid image URL' }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'SessionGoals/1.0'
      }
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

    return new Response(buffer, {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=86400', // Cache for 24 hours
        'access-control-allow-origin': '*'
      }
    });
  } catch (err: any) {
    console.error('Image proxy error:', err);
    return json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
};
