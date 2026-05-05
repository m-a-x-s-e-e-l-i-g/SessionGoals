// ─── Goal types ──────────────────────────────────────────────────────────────

export type GoalType = 'move' | 'spot' | 'challenge' | 'inspiration';

export type GoalStatus =
  | 'idea'
  | 'want_to_try'
  | 'training'
  | 'landed'
  | 'done'
  | 'archived';

export interface Tag {
  id: string;
  name: string;
  category?: string;
}

export interface GoalLink {
  id: string;
  goalId: string;
  url: string;
  platform?: string;
  title?: string;
}

export interface Goal {
  id: string;
  userId?: string;
  type: GoalType;
  title: string;
  description?: string;
  status: GoalStatus;
  difficulty?: number; // 1–5
  spotId?: string;
  sourceUrl?: string;
  tags: Tag[];
  links: GoalLink[];
  createdAt: string;
  updatedAt: string;
}

// ─── Goal list types ──────────────────────────────────────────────────────────

export type GoalListType = 'training_plan' | 'competition' | 'wishlist' | 'general';

export interface GoalListItem {
  listId: string;
  goalId: string;
  position: number;
  goal?: Goal;
}

export interface GoalList {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  type: GoalListType;
  items: GoalListItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Spot types ───────────────────────────────────────────────────────────────

export interface SpotCoordinates {
  lat: number;
  lng: number;
}

export interface Spot {
  id: string;
  externalId?: string; // parkour.spot API id
  name: string;
  description?: string;
  city?: string;
  country?: string;
  coordinates?: SpotCoordinates;
  tags: Tag[];
  imageUrl?: string;
  createdAt: string;
}

// ─── Form helper types ────────────────────────────────────────────────────────

export interface CreateGoalInput {
  type: GoalType;
  title: string;
  description?: string;
  status: GoalStatus;
  difficulty?: number;
  spotId?: string;
  sourceUrl?: string;
  tagIds: string[];
}

export interface CreateGoalListInput {
  name: string;
  description?: string;
  type: GoalListType;
}
