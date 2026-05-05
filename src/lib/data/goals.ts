// Goals data service.
// Currently backed by the in-memory mock store.
// Replace the implementation with Supabase queries when ready.

import type { Goal, CreateGoalInput } from '$lib/types';
import { mockGoals } from './mock';
import { mockTags } from './mock';

// In-memory store (resets on page reload — replace with Supabase persistence)
let store: Goal[] = [...mockGoals];

export function getGoals(): Goal[] {
  return store;
}

export function getGoalById(id: string): Goal | undefined {
  return store.find((g) => g.id === id);
}

export function createGoal(input: CreateGoalInput): Goal {
  const now = new Date().toISOString();
  const tags = mockTags.filter((t) => input.tagIds.includes(t.id));
  const goal: Goal = {
    id: `goal-${Date.now()}`,
    type: input.type,
    title: input.title,
    description: input.description,
    status: input.status,
    difficulty: input.difficulty,
    spotId: input.spotId,
    sourceUrl: input.sourceUrl,
    tags,
    links: [],
    createdAt: now,
    updatedAt: now,
  };
  store = [goal, ...store];
  return goal;
}

export function updateGoalStatus(id: string, status: Goal['status']): Goal | undefined {
  store = store.map((g) => (g.id === id ? { ...g, status, updatedAt: new Date().toISOString() } : g));
  return store.find((g) => g.id === id);
}

export function deleteGoal(id: string): void {
  store = store.filter((g) => g.id !== id);
}
