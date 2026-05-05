import type { PageServerLoad } from './$types';
import { isParkourSpotConfigured, searchSpots } from '$lib/server/parkourspot';

export const load: PageServerLoad = async ({ url }) => {
  const q = url.searchParams.get('q')?.trim() ?? '';

  if (!isParkourSpotConfigured()) {
    return { spots: [], error: 'missing_api_key' as const, query: q };
  }

  if (!q) {
    return { spots: [], error: null, query: q };
  }

  try {
    const spots = await searchSpots({ q, limit: '40' });
    return { spots, error: null, query: q };
  } catch (err: any) {
    return { spots: [], error: 'api_error' as const, query: q };
  }
};
