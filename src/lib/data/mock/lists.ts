import type { GoalList } from '$lib/types';
import { mockGoals } from './goals';

export const mockLists: GoalList[] = [
  {
    id: 'list-1',
    name: 'Summer Session Goals',
    description: 'Moves and challenges to land before autumn.',
    type: 'training_plan',
    items: [
      { listId: 'list-1', goalId: 'goal-1', position: 1, goal: mockGoals[0] },
      { listId: 'list-1', goalId: 'goal-4', position: 2, goal: mockGoals[3] },
      { listId: 'list-1', goalId: 'goal-5', position: 3, goal: mockGoals[4] },
    ],
    createdAt: '2024-04-01T10:00:00Z',
    updatedAt: '2024-04-15T10:00:00Z',
  },
  {
    id: 'list-2',
    name: 'Amsterdam Jam Prep',
    description: 'Challenge list for the Amsterdam summer jam.',
    type: 'competition',
    items: [
      { listId: 'list-2', goalId: 'goal-1', position: 1, goal: mockGoals[0] },
      { listId: 'list-2', goalId: 'goal-4', position: 2, goal: mockGoals[3] },
    ],
    createdAt: '2024-04-10T10:00:00Z',
    updatedAt: '2024-04-10T10:00:00Z',
  },
  {
    id: 'list-3',
    name: 'Spot Wishlist',
    description: 'Spots and lines I want to visit.',
    type: 'wishlist',
    items: [
      { listId: 'list-3', goalId: 'goal-2', position: 1, goal: mockGoals[1] },
    ],
    createdAt: '2024-04-12T10:00:00Z',
    updatedAt: '2024-04-12T10:00:00Z',
  },
];
