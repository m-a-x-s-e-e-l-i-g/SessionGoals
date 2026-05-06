import type { Spot } from '$lib/types';
import { runDataAction } from './api';
import { getAppState, updateAppState } from './state';

export function getSpots(): Spot[] {
  return getAppState().spots;
}

export function getSpotById(id: string): Spot | undefined {
  return getAppState().spots.find((spot) => spot.id === id);
}

export async function upsertSpot(spot: Spot): Promise<Spot> {
  const nextSpot = await runDataAction<Spot>('upsertSpot', { spot });
  updateAppState((state) => {
    const existingIndex = state.spots.findIndex(
      (entry) => entry.id === nextSpot.id || (!!entry.externalId && entry.externalId === nextSpot.externalId),
    );

    if (existingIndex >= 0) {
      return {
        ...state,
        spots: state.spots.map((entry, index) => (index === existingIndex ? nextSpot : entry)),
      };
    }

    return {
      ...state,
      spots: [nextSpot, ...state.spots],
    };
  });

  return nextSpot;
}

export function getSuggestedSpotsForGoal(goalTagNames: string[]): Spot[] {
  return getAppState().spots.filter((spot) => spot.tags.some((tag) => goalTagNames.includes(tag.name)));
}
