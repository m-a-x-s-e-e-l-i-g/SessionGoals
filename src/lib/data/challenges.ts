// Challenges data service.
// Challenges are compound, multi-spot / multi-goal objectives.
// Currently backed by the in-memory mock store.
// Replace the implementation with Supabase queries when ready.

import type { Challenge, CreateChallengeInput } from '$lib/types';
import { mockChallenges, mockTags } from './mock';

// In-memory store (resets on page reload — replace with Supabase persistence)
let store: Challenge[] = [...mockChallenges];

export function getChallenges(): Challenge[] {
  return store;
}

export function getChallengeById(id: string): Challenge | undefined {
  return store.find((c) => c.id === id);
}

export function createChallenge(input: CreateChallengeInput): Challenge {
  const now = new Date().toISOString();
  const tags = input.tagIds ? mockTags.filter((t) => input.tagIds!.includes(t.id)) : [];
  const challenge: Challenge = {
    id: `challenge-${Date.now()}`,
    title: input.title,
    description: input.description,
    status: input.status,
    difficulty: input.difficulty,
    spotIds: input.spotIds ?? [],
    goalIds: input.goalIds ?? [],
    tags,
    links: [],
    createdAt: now,
    updatedAt: now,
  };
  store = [challenge, ...store];
  return challenge;
}

export function updateChallenge(id: string, patch: Partial<Pick<Challenge, 'title' | 'description' | 'status' | 'difficulty' | 'spotIds' | 'goalIds'>>): Challenge | undefined {
  const idx = store.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  const updated: Challenge = { ...store[idx], ...patch, updatedAt: new Date().toISOString() };
  store = store.map((c) => (c.id === id ? updated : c));
  return updated;
}

export function addSpotToChallenge(challengeId: string, spotId: string): Challenge | undefined {
  const challenge = store.find((c) => c.id === challengeId);
  if (!challenge) return undefined;
  if (challenge.spotIds.includes(spotId)) return challenge;
  return updateChallenge(challengeId, { spotIds: [...challenge.spotIds, spotId] });
}

export function addGoalToChallenge(challengeId: string, goalId: string): Challenge | undefined {
  const challenge = store.find((c) => c.id === challengeId);
  if (!challenge) return undefined;
  if (challenge.goalIds.includes(goalId)) return challenge;
  return updateChallenge(challengeId, { goalIds: [...challenge.goalIds, goalId] });
}
