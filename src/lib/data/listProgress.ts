import type { GoalList, ListProgress } from '$lib/types';
import { CURRENT_USER_ID } from './session';

let store: ListProgress[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

export function getProgressForList(sourceListId: string, userId: string = CURRENT_USER_ID): ListProgress | undefined {
  return store.find((p) => p.sourceListId === sourceListId && p.userId === userId);
}

export function isTrackingList(sourceListId: string, userId: string = CURRENT_USER_ID): boolean {
  return !!getProgressForList(sourceListId, userId);
}

export function startTrackingList(list: GoalList, userId: string = CURRENT_USER_ID): ListProgress {
  const existing = getProgressForList(list.id, userId);
  if (existing) return existing;

  const timestamp = nowIso();
  const progress: ListProgress = {
    id: `progress-${Date.now()}`,
    userId,
    sourceListId: list.id,
    items: list.items.map((item) => ({ goalId: item.goalId, done: false })),
    startedAt: timestamp,
    updatedAt: timestamp,
  };

  store = [progress, ...store];
  return progress;
}

export function toggleListItemProgress(sourceListId: string, goalId: string, userId: string = CURRENT_USER_ID): ListProgress | undefined {
  const progress = getProgressForList(sourceListId, userId);
  if (!progress) return undefined;

  const updatedItems = progress.items.map((item) => {
    if (item.goalId !== goalId) return item;
    const done = !item.done;
    return {
      ...item,
      done,
      completedAt: done ? nowIso() : undefined,
    };
  });

  const updated: ListProgress = {
    ...progress,
    items: updatedItems,
    updatedAt: nowIso(),
  };

  store = store.map((p) => (p.id === updated.id ? updated : p));
  return updated;
}

export function getProgressStats(sourceListId: string, userId: string = CURRENT_USER_ID): { done: number; total: number } {
  const progress = getProgressForList(sourceListId, userId);
  if (!progress) return { done: 0, total: 0 };
  const done = progress.items.filter((item) => item.done).length;
  return { done, total: progress.items.length };
}

export function getTrackedProgress(userId: string = CURRENT_USER_ID): ListProgress[] {
  return store.filter((p) => p.userId === userId);
}
