import type { Activity, Challenge, Goal, GoalList, ListProgress, Spot, Tag, UserProfile } from '$lib/types';

export interface AppStateSnapshot {
  currentUserId: string | null;
  users: UserProfile[];
  tags: Tag[];
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
    tags: [],
    spots: [],
    goals: [],
    lists: [],
    progress: [],
    activities: [],
    challenges: [],
  };
}
