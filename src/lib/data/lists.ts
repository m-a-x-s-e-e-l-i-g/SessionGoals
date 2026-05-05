// Goal lists data service.
// Currently backed by the in-memory mock store.

import type { GoalList, CreateGoalListInput, Goal } from '$lib/types';
import { mockLists } from './mock';
import { CURRENT_USER_ID } from './session';

let store: GoalList[] = [...mockLists];

export function getLists(): GoalList[] {
  return store;
}

export function getListsByUser(userId: string = CURRENT_USER_ID): GoalList[] {
  return store.filter((l) => l.userId === userId);
}

export function getMyLists(): GoalList[] {
  return getListsByUser(CURRENT_USER_ID);
}

export function getPublicLists(): GoalList[] {
  return store.filter((l) => l.visibility === 'public');
}

export function getExplorableLists(userId: string = CURRENT_USER_ID): GoalList[] {
  return store.filter((l) => l.visibility === 'public' && l.userId !== userId);
}

export function getListById(id: string): GoalList | undefined {
  return store.find((l) => l.id === id);
}

export function createList(input: CreateGoalListInput): GoalList {
  const now = new Date().toISOString();
  const list: GoalList = {
    id: `list-${Date.now()}`,
    userId: CURRENT_USER_ID,
    name: input.name,
    description: input.description,
    type: input.type,
    visibility: input.visibility ?? 'private',
    items: [],
    createdAt: now,
    updatedAt: now,
  };
  store = [list, ...store];
  return list;
}

export function addGoalToList(listId: string, goal: Goal): GoalList | undefined {
  store = store.map((l) => {
    if (l.id !== listId) return l;
    const alreadyIn = l.items.some((item) => item.goalId === goal.id);
    if (alreadyIn) return l;
    const position = l.items.length + 1;
    return {
      ...l,
      items: [...l.items, { listId, goalId: goal.id, position, goal }],
      updatedAt: new Date().toISOString(),
    };
  });
  return store.find((l) => l.id === listId);
}

export function deleteList(id: string): void {
  store = store.filter((l) => l.id !== id);
}
