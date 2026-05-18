// ─── Goal types ──────────────────────────────────────────────────────────────

/**
 * move        — a specific technique or movement skill (kong, precision, wall-run…)
 *               May optionally be pinned to a spot where you want to practice it.
 * spot        — a goal tied to one specific spot: a run, a line, a sequence to do there.
 *
 * Challenges (multi-spot, multi-goal objectives) are a separate entity — see Challenge below.
 */
export type GoalType = 'move' | 'spot';

export type GoalStatus = 'want_to_try' | 'done';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  role: 'athlete' | 'teacher' | 'athlete_teacher';
  teacherId?: string;
  coachingNeeds?: string[];
  bio?: string;
  city?: string;
  country?: string;
  isPublic: boolean;
  isAdmin: boolean;
  joinedAt: string;
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
  sourceGoalId?: string;
  isLibraryEntry: boolean;
  isListOnly?: boolean;
  type: GoalType;
  title: string;
  description?: string;
  status: GoalStatus;
  spotId?: string;
  imageUrl?: string;
  sourceUrl?: string;
  links: GoalLink[];
  createdAt: string;
  updatedAt: string;
}

// ─── Goal list types ──────────────────────────────────────────────────────────

export type GoalListType = 'training_plan' | 'competition' | 'wishlist' | 'general';
export type GoalListVisibility = 'public' | 'private';

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
  visibility: GoalListVisibility;
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
  imageUrl?: string;
  createdAt: string;
}

// ─── Form helper types ────────────────────────────────────────────────────────

export interface CreateGoalInput {
  type: GoalType;
  sourceGoalId?: string;
  title: string;
  description?: string;
  status: GoalStatus;
  listOnly?: boolean;
  spotId?: string;
  imageUrl?: string;
  sourceUrl?: string;
}

export interface UpdateGoalInput {
  type: GoalType;
  title: string;
  description?: string;
  status: GoalStatus;
  spotId?: string;
  imageUrl?: string;
  sourceUrl?: string;
}

export interface CreateGoalListInput {
  name: string;
  description?: string;
  type: GoalListType;
  visibility?: GoalListVisibility;
}

export interface UpdateGoalListInput {
  name: string;
  description?: string;
  type: GoalListType;
  visibility: GoalListVisibility;
}

export interface ListProgressItem {
  goalId: string;
  done: boolean;
  completedAt?: string;
}

export interface ListProgress {
  id: string;
  userId: string;
  sourceListId: string;
  items: ListProgressItem[];
  startedAt: string;
  updatedAt: string;
}

// ─── Challenge types ──────────────────────────────────────────────────────────
//
// A Challenge is a compound, multi-spot / multi-goal objective.
// Examples: "land 10 different vaults in one session across 3 spots",
//           "complete the city-centre link-up run".
// It references goals (atomic moves / spot-runs) and spots by ID,
// so the same goal or spot can belong to multiple challenges.

export interface Challenge {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  status: GoalStatus;
  spotIds: string[];   // spots involved in the challenge
  goalIds: string[];   // component goals / moves that make up the challenge
  links: GoalLink[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateChallengeInput {
  title: string;
  description?: string;
  status: GoalStatus;
  spotIds?: string[];
  goalIds?: string[];
}

// ─── Activity types ──────────────────────────────────────────────────────────

export const ACTIVITY_TYPES = [
  'parkour',
  'running',
  'gym',
  'bouldering',
  'calisthenics',
  'mobility',
  'other',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export function isActivityType(value: string | undefined): value is ActivityType {
  return !!value && ACTIVITY_TYPES.includes(value as ActivityType);
}

export function normalizeActivityType(value: string | undefined): ActivityType {
  return isActivityType(value) ? value : 'parkour';
}

export interface Activity {
  id: string;
  userId: string;
  date: string; // ISO date (YYYY-MM-DD)
  activityType: ActivityType;
  duration?: number; // minutes
  notes?: string;
  linkedGoalId?: string;
  createdAt: string;
}
