import type { Goal, CreateGoalInput } from '$lib/types';
import { runDataAction } from './api';
import { getAppState, getCurrentUserIdFromState, updateAppState } from './state';

export function getGoals(): Goal[] {
  return getAppState().goals;
}

export function getGoalsByUser(userId?: string): Goal[] {
  const effectiveUserId = userId ?? getCurrentUserIdFromState();
  if (!effectiveUserId) return [];
  return getAppState().goals.filter((goal) => goal.userId === effectiveUserId);
}

export function getMyGoals(): Goal[] {
  return getGoalsByUser();
}

export function getGoalById(id: string): Goal | undefined {
  return getAppState().goals.find((goal) => goal.id === id);
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const goal = await runDataAction<Goal>('createGoal', { input });
  updateAppState((state) => ({
    ...state,
    goals: [goal, ...state.goals],
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
