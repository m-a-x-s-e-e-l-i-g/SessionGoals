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

export type Activity = {
  id: string;
  userId: string;
  date: string; // ISO date (YYYY-MM-DD)
  activityType: ActivityType;
  duration?: number; // minutes
  notes?: string;
  linkedGoalId?: string;
  createdAt: string;
};
