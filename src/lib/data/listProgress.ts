import type { GoalList, ListProgress } from '$lib/types';
import { runDataAction } from './api';
import { getAppState, getCurrentUserIdFromState, updateAppState } from './state';

export function getProgressForList(sourceListId: string, userId?: string): ListProgress | undefined {
  const effectiveUserId = userId ?? getCurrentUserIdFromState();
  if (!effectiveUserId) return undefined;
  return getAppState().progress.find(
    (entry) => entry.sourceListId === sourceListId && entry.userId === effectiveUserId,
  );
}

export function isTrackingList(sourceListId: string, userId?: string): boolean {
  return !!getProgressForList(sourceListId, userId);
}

export async function startTrackingList(list: GoalList, userId?: string): Promise<ListProgress> {
  const effectiveUserId = userId ?? getCurrentUserIdFromState();
  if (!effectiveUserId) {
    throw new Error('Sign in to track lists.');
  }

  const existing = getProgressForList(list.id, effectiveUserId);
  if (existing) return existing;

  const progress = await runDataAction<ListProgress>('startTrackingList', {
    sourceListId: list.id,
    userId: effectiveUserId,
  });

  updateAppState((state) => ({
    ...state,
    progress: [progress, ...state.progress],
  }));

  return progress;
}

export async function toggleListItemProgress(
  sourceListId: string,
  goalId: string,
  userId?: string,
): Promise<ListProgress | undefined> {
  const effectiveUserId = userId ?? getCurrentUserIdFromState();
  if (!effectiveUserId) {
    throw new Error('Sign in to update progress.');
  }

  const progress = await runDataAction<ListProgress>('toggleListItemProgress', {
    sourceListId,
    goalId,
    userId: effectiveUserId,
  });

  updateAppState((state) => ({
    ...state,
    progress: state.progress.map((entry) => (entry.id === progress.id ? progress : entry)),
  }));

  return progress;
}

export function getProgressStats(sourceListId: string, userId?: string): { done: number; total: number } {
  const progress = getProgressForList(sourceListId, userId);
  if (!progress) return { done: 0, total: 0 };
  const done = progress.items.filter((item) => item.done).length;
  return { done, total: progress.items.length };
}

export function getTrackedProgress(userId?: string): ListProgress[] {
  const effectiveUserId = userId ?? getCurrentUserIdFromState();
  if (!effectiveUserId) return [];
  return getAppState().progress.filter((entry) => entry.userId === effectiveUserId);
}

export async function stopTrackingList(sourceListId: string, userId?: string): Promise<void> {
  const effectiveUserId = userId ?? getCurrentUserIdFromState();
  if (!effectiveUserId) throw new Error('Sign in to unfollow lists.');

  await runDataAction<{ removed: boolean }>('stopTrackingList', {
    sourceListId,
    userId: effectiveUserId,
  });

  updateAppState((state) => ({
    ...state,
    progress: state.progress.filter(
      (entry) => !(entry.sourceListId === sourceListId && entry.userId === effectiveUserId)
    ),
  }));
}
