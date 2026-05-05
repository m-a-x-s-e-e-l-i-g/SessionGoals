// Spots data service.
// In the future this will proxy parkour.spot API queries.
// See src/lib/server/parkourspot.ts for the server-side adapter.

import type { Spot } from '$lib/types';
import { mockSpots } from './mock';

let store: Spot[] = [...mockSpots];

export function getSpots(): Spot[] {
  return store;
}

export function getSpotById(id: string): Spot | undefined {
  return store.find((s) => s.id === id);
}

export function upsertSpot(spot: Spot): Spot {
  const existingIndex = store.findIndex(
    (entry) => entry.id === spot.id || (!!entry.externalId && entry.externalId === spot.externalId)
  );

  if (existingIndex >= 0) {
    const existing = store[existingIndex];
    const next = { ...existing, ...spot };
    store = store.map((entry, index) => (index === existingIndex ? next : entry));
    return next;
  }

  store = [spot, ...store];
  return spot;
}

export function getSuggestedSpotsForGoal(goalTagNames: string[]): Spot[] {
  // Simple tag-matching recommendation.
  // TODO: Replace with parkour.spot API search + scoring.
  return store.filter((spot) =>
    spot.tags.some((tag) => goalTagNames.includes(tag.name))
  );
}
