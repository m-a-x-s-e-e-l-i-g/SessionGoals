// Goal lists data service.
// Currently backed by the in-memory mock store.

import type { GoalList, CreateGoalListInput } from '$lib/types';
import { mockLists } from './mock';

let store: GoalList[] = [...mockLists];

export function getLists(): GoalList[] {
  return store;
}

export function getListById(id: string): GoalList | undefined {
  return store.find((l) => l.id === id);
}

export function createList(input: CreateGoalListInput): GoalList {
  const now = new Date().toISOString();
  const list: GoalList = {
    id: `list-${Date.now()}`,
    name: input.name,
    description: input.description,
    type: input.type,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
  store = [list, ...store];
  return list;
}

export function deleteList(id: string): void {
  store = store.filter((l) => l.id !== id);
}
