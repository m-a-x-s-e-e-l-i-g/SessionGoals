// Spots data service.
// In the future this will proxy parkour.spot API queries.
// See src/lib/server/parkourspot.ts for the server-side adapter.

import type { Spot } from '$lib/types';
import { mockSpots } from './mock';

export function getSpots(): Spot[] {
  return mockSpots;
}

export function getSpotById(id: string): Spot | undefined {
  return mockSpots.find((s) => s.id === id);
}

export function getSuggestedSpotsForGoal(goalTagNames: string[]): Spot[] {
  // Simple tag-matching recommendation.
  // TODO: Replace with parkour.spot API search + scoring.
  return mockSpots.filter((spot) =>
    spot.tags.some((tag) => goalTagNames.includes(tag.name))
  );
}
