import type { GoalList, CreateGoalListInput, UpdateGoalListInput, Goal } from '$lib/types';
import { runDataAction } from './api';
import { getAppState, getCurrentUserIdFromState, updateAppState } from './state';

export function getLists(): GoalList[] {
  return getAppState().lists;
}

export function getListsByUser(userId?: string): GoalList[] {
  const effectiveUserId = userId ?? getCurrentUserIdFromState();
  if (!effectiveUserId) return [];
  return getAppState().lists.filter((list) => list.userId === effectiveUserId);
}

export function getMyLists(): GoalList[] {
  return getListsByUser();
}

export function getPublicLists(): GoalList[] {
  return getAppState().lists.filter((list) => list.visibility === 'public');
}

export function getExplorableLists(userId?: string): GoalList[] {
  const currentUserId = userId ?? getCurrentUserIdFromState();
  return getPublicLists().filter((list) => list.userId !== currentUserId);
}

export function getListById(id: string): GoalList | undefined {
  return getAppState().lists.find((list) => list.id === id);
}

export async function createList(input: CreateGoalListInput): Promise<GoalList> {
  const list = await runDataAction<GoalList>('createList', { input });
  updateAppState((state) => ({
    ...state,
    lists: [list, ...state.lists],
  }));
  return list;
}

export async function addGoalToList(listId: string, goal: Goal): Promise<GoalList | undefined> {
  const list = await runDataAction<GoalList>('addGoalToList', { listId, goalId: goal.id });
  updateAppState((state) => ({
    ...state,
    lists: state.lists.map((entry) => (entry.id === list.id ? list : entry)),
  }));
  return list;
}

export async function removeGoalFromList(listId: string, goalId: string): Promise<GoalList | undefined> {
  const list = await runDataAction<GoalList>('removeGoalFromList', { listId, goalId });
  updateAppState((state) => ({
    ...state,
    lists: state.lists.map((entry) => (entry.id === list.id ? list : entry)),
  }));
  return list;
}

export async function updateList(id: string, input: UpdateGoalListInput): Promise<GoalList> {
  const list = await runDataAction<GoalList>('updateList', { id, ...input });
  updateAppState((state) => ({
    ...state,
    lists: state.lists.map((entry) => (entry.id === list.id ? list : entry)),
  }));
  return list;
}

export async function deleteList(id: string): Promise<void> {
  await runDataAction<{ id: string }>('deleteList', { id });
  updateAppState((state) => ({
    ...state,
    lists: state.lists.filter((list) => list.id !== id),
    progress: state.progress.filter((entry) => entry.sourceListId !== id),
  }));
}
