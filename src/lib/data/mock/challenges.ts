import type { Challenge } from '$lib/types';

export const mockChallenges: Challenge[] = [
  {
    id: 'challenge-1',
    title: '10 different vaults in one session',
    description:
      'Land speed vault, kong, dash, lazy, reverse, safety, thief, turn, palm, and crane — all in a single session. Any spot is valid.',
    status: 'want_to_try',
    difficulty: 4,
    spotIds: ['spot-1', 'spot-2'],
    goalIds: ['goal-1'],
    tags: [
      { id: 'tag-2', name: 'vault' },
      { id: 'tag-12', name: 'competition' },
    ],
    links: [],
    createdAt: '2024-04-12T10:00:00Z',
    updatedAt: '2024-04-12T10:00:00Z',
  },
  {
    id: 'challenge-2',
    title: 'City-centre link-up run',
    description:
      'Connect City Plaza Steps and Harbor Rail Garden in one continuous movement session — no stopping between spots.',
    status: 'idea',
    difficulty: 5,
    spotIds: ['spot-1', 'spot-2'],
    goalIds: ['goal-2', 'goal-4'],
    tags: [
      { id: 'tag-8', name: 'flow' },
      { id: 'tag-9', name: 'speed' },
      { id: 'tag-15', name: 'urban' },
    ],
    links: [],
    createdAt: '2024-04-20T10:00:00Z',
    updatedAt: '2024-04-20T10:00:00Z',
  },
];
