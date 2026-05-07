import type { Activity, Challenge, Goal, GoalList, ListProgress, Spot, UserProfile } from '$lib/types';

export interface AppStateSnapshot {
  currentUserId: string | null;
  users: UserProfile[];
  spots: Spot[];
  goals: Goal[];
  lists: GoalList[];
  progress: ListProgress[];
  activities: Activity[];
  challenges: Challenge[];
}

export function createEmptyAppState(currentUserId: string | null = null): AppStateSnapshot {
  return {
    currentUserId,
    users: [],
    spots: [],
    goals: [],
    lists: [],
    progress: [],
    activities: [],
    challenges: [],
  };
}
