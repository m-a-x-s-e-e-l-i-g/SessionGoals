import type { Goal, CreateGoalInput, UpdateGoalInput } from '$lib/types';
import { runDataAction } from './api';
import { getAppState, getCurrentUserIdFromState, updateAppState } from './state';

export function getGoals(): Goal[] {
  return getAppState().goals;
}

export function getGoalsByUser(userId?: string, options?: { includeListOnly?: boolean }): Goal[] {
  const effectiveUserId = userId ?? getCurrentUserIdFromState();
  if (!effectiveUserId) return [];
  const includeListOnly = options?.includeListOnly === true;
  return getAppState().goals.filter(
    (goal) => goal.userId === effectiveUserId && (includeListOnly || !goal.isListOnly),
  );
}

export function getMyGoals(options?: { includeListOnly?: boolean }): Goal[] {
  return getGoalsByUser(undefined, options);
}

export function getGoalById(id: string): Goal | undefined {
  return getAppState().goals.find((goal) => goal.id === id);
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const goal = await runDataAction<Goal>('createGoal', { input });
  updateAppState((state) => ({
    ...state,
    goals: state.goals.some((entry) => entry.id === goal.id)
      ? state.goals.map((entry) => (entry.id === goal.id ? goal : entry))
      : [goal, ...state.goals],
  }));
  return goal;
}

export async function updateGoalStatus(id: string, status: Goal['status']): Promise<Goal | undefined> {
  const goal = await runDataAction<Goal>('updateGoalStatus', { id, status });
  updateAppState((state) => ({
    ...state,
    goals: state.goals.map((entry) => (entry.id === id ? goal : entry)),
    lists: state.lists.map((list) => ({
      ...list,
      items: list.items.map((item) => (item.goalId === id ? { ...item, goal } : item)),
    })),
  }));
  return goal;
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
  const goal = await runDataAction<Goal>('updateGoal', { id, input });
  updateAppState((state) => ({
    ...state,
    goals: state.goals.map((entry) => (entry.id === id ? goal : entry)),
    lists: state.lists.map((list) => ({
      ...list,
      items: list.items.map((item) => (item.goalId === id ? { ...item, goal } : item)),
    })),
  }));
  return goal;
}

export async function deleteGoal(id: string): Promise<void> {
  await runDataAction<{ id: string }>('deleteGoal', { id });
  updateAppState((state) => ({
    ...state,
    goals: state.goals.filter((goal) => goal.id !== id),
    lists: state.lists.map((list) => ({
      ...list,
      items: list.items.filter((item) => item.goalId !== id),
    })),
    progress: state.progress.map((entry) => ({
      ...entry,
      items: entry.items.filter((item) => item.goalId !== id),
    })),
    activities: state.activities.filter((activity) => activity.linkedGoalId !== id),
  }));
}

export async function commitToLibrary(goalId: string): Promise<Goal> {
  const { libraryEntry, trackingCopy } = await runDataAction<{ libraryEntry: Goal; trackingCopy: Goal | null }>(
    'commitToLibrary',
    { goalId },
  );
  updateAppState((state) => {
    // Replace the original goal row with its promoted library-entry form (same ID, no duplication)
    let goals = state.goals.map((entry) => (entry.id === libraryEntry.id ? libraryEntry : entry));
    // Add the original owner's tracking copy if it was returned and is not already in state
    if (trackingCopy && !goals.some((entry) => entry.id === trackingCopy.id)) {
      goals = [trackingCopy, ...goals];
    }
    return { ...state, goals };
  });
  return libraryEntry;
}

export async function updateLibraryMove(id: string, input: import('$lib/types').UpdateGoalInput): Promise<Goal> {
  const goal = await runDataAction<Goal>('updateLibraryMove', { id, input });
  updateAppState((state) => ({
    ...state,
    goals: state.goals.map((entry) => (entry.id === id ? goal : entry)),
  }));
  return goal;
}

export async function deleteLibraryMove(id: string): Promise<void> {
  await runDataAction<{ id: string }>('deleteLibraryMove', { id });
  updateAppState((state) => ({
    ...state,
    goals: state.goals.filter((goal) => goal.id !== id),
  }));
}
