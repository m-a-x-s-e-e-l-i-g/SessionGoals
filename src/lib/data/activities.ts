import type { Activity } from '../types';
import { runDataAction } from './api';
import { getAppState, getCurrentUserIdFromState, updateAppState } from './state';

function compareActivitiesDesc(left: Activity, right: Activity): number {
  if (left.date !== right.date) {
    return right.date.localeCompare(left.date);
  }

  return right.createdAt.localeCompare(left.createdAt);
}

function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort(compareActivitiesDesc);
}

export function getActivities(): Activity[] {
  return sortActivities(getAppState().activities);
}

export function getActivitiesByUserId(userId: string): Activity[] {
  return sortActivities(getAppState().activities.filter((activity) => activity.userId === userId));
}

export function getActivitiesByDateRange(startDate: string, endDate: string): Activity[] {
  return sortActivities(
    getAppState().activities.filter((activity) => activity.date >= startDate && activity.date <= endDate),
  );
}

export function getActivitiesByUserAndDateRange(userId: string, startDate: string, endDate: string): Activity[] {
  return sortActivities(
    getAppState().activities.filter(
      (activity) => activity.userId === userId && activity.date >= startDate && activity.date <= endDate,
    ),
  );
}

export function getActivityForDate(date: string, userId?: string): Activity | undefined {
  const effectiveUserId = userId ?? getCurrentUserIdFromState();
  return getAppState().activities.find((activity) => activity.date === date && activity.userId === effectiveUserId);
}

export async function addActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> {
  if (!activity.userId) {
    throw new Error('A session must belong to a user.');
  }

  if (!activity.date) {
    throw new Error('Choose a session date before logging.');
  }

  const today = new Date().toISOString().split('T')[0];
  if (activity.date > today) {
    throw new Error('You cannot log a session in the future.');
  }

  if (
    activity.duration !== undefined
    && (!Number.isFinite(activity.duration) || activity.duration < 5 || activity.duration > 480)
  ) {
    throw new Error('Duration must be between 5 and 480 minutes.');
  }

  const nextActivity = await runDataAction<Activity>('addActivity', { activity });
  updateAppState((state) => ({
    ...state,
    activities: [nextActivity, ...state.activities],
  }));

  return nextActivity;
}

export function getRecentActivities(count: number = 7, userId?: string): Activity[] {
  const effectiveUserId = userId ?? getCurrentUserIdFromState();
  const filtered = effectiveUserId
    ? getAppState().activities.filter((activity) => activity.userId === effectiveUserId)
    : getAppState().activities;
  return sortActivities(filtered).slice(0, count);
}

export function getActivityStats(days: number = 7, userId?: string) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);
  const start = startDate.toISOString().split('T')[0];

  const activities = userId
    ? getActivitiesByUserAndDateRange(userId, start, today.toISOString().split('T')[0])
    : getActivitiesByDateRange(start, today.toISOString().split('T')[0]);

  const totalDays = activities.length;
  const totalDuration = activities.reduce((sum, activity) => sum + (activity.duration ?? 0), 0);

  return {
    activeDays: totalDays,
    totalDuration,
    averageDuration: totalDays > 0 ? Math.round(totalDuration / totalDays) : 0,
    streak: calculateCurrentStreak(userId),
  };
}

function calculateCurrentStreak(userId?: string): number {
  const effectiveUserId = userId ?? getCurrentUserIdFromState();
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    if (getActivityForDate(dateStr, effectiveUserId ?? undefined)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
