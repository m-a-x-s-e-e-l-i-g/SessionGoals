import type { Spot } from '$lib/types';

export const mockSpots: Spot[] = [
  {
    id: 'spot-1',
    externalId: 'pk-spot-001',
    name: 'City Plaza Steps',
    description: 'Central plaza with wide steps, ledges, and gap opportunities.',
    city: 'Berlin',
    country: 'Germany',
    coordinates: { lat: 52.520008, lng: 13.404954 },
    tags: [
      { id: 'tag-1', name: 'precision' },
      { id: 'tag-4', name: 'gap' },
      { id: 'tag-15', name: 'urban' },
    ],
    imageUrl: undefined,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'spot-2',
    externalId: 'pk-spot-002',
    name: 'Harbor Rail Garden',
    description: 'Industrial waterfront with rails, walls, and textured surfaces.',
    city: 'Hamburg',
    country: 'Germany',
    coordinates: { lat: 53.550341, lng: 10.000654 },
    tags: [
      { id: 'tag-6', name: 'rail' },
      { id: 'tag-2', name: 'vault' },
      { id: 'tag-8', name: 'flow' },
    ],
    imageUrl: undefined,
    createdAt: '2024-02-20T10:00:00Z',
  },
  {
    id: 'spot-3',
    externalId: 'pk-spot-003',
    name: 'University Courtyard',
    description: 'Open courtyard with low walls, benches, and climb-up opportunities.',
    city: 'Munich',
    country: 'Germany',
    coordinates: { lat: 48.137154, lng: 11.576124 },
    tags: [
      { id: 'tag-5', name: 'wall' },
      { id: 'tag-7', name: 'climb' },
      { id: 'tag-13', name: 'beginner' },
    ],
    imageUrl: undefined,
    createdAt: '2024-03-05T10:00:00Z',
  },
];
