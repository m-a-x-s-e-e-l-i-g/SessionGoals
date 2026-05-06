import type { Activity } from '../types';
import { CURRENT_USER_ID } from './session';

function compareActivitiesDesc(left: Activity, right: Activity): number {
  if (left.date !== right.date) {
    return right.date.localeCompare(left.date);
  }

  return right.createdAt.localeCompare(left.createdAt);
}

function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort(compareActivitiesDesc);
}

// Generate mock activity for the past 52 weeks
function generateMockActivities(): Activity[] {
  const activities: Activity[] = [];
  const today = new Date();
  const userIds = [CURRENT_USER_ID, 'user-lena', 'user-milo']; // Generate for current user and students

  // Generate 52 weeks of data for each user
  userIds.forEach((userId) => {
    for (let i = 0; i < 364; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Roughly 60% chance of activity on any given day
      if (Math.random() < 0.6) {
        activities.push({
          id: `activity-${userId}-${dateStr}`,
          userId,
          date: dateStr,
          duration: Math.floor(Math.random() * 120) + 15, // 15-135 minutes
          notes: Math.random() > 0.7 ? `Session notes for ${dateStr}` : undefined,
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  return activities;
}

const mockActivities = generateMockActivities();

export function getActivities(): Activity[] {
  return sortActivities(mockActivities);
}

export function getActivitiesByUserId(userId: string): Activity[] {
  return sortActivities(mockActivities.filter((a) => a.userId === userId));
}

export function getActivitiesByDateRange(startDate: string, endDate: string): Activity[] {
  return sortActivities(mockActivities.filter((a) => a.date >= startDate && a.date <= endDate));
}

export function getActivitiesByUserAndDateRange(userId: string, startDate: string, endDate: string): Activity[] {
  return sortActivities(
    mockActivities.filter((a) => a.userId === userId && a.date >= startDate && a.date <= endDate),
  );
}

export function getActivityForDate(date: string, userId?: string): Activity | undefined {
  return mockActivities.find((a) => a.date === date && (!userId || a.userId === userId));
}

export function addActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Activity {
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

  if (activity.duration !== undefined && (!Number.isFinite(activity.duration) || activity.duration < 5 || activity.duration > 480)) {
    throw new Error('Duration must be between 5 and 480 minutes.');
  }

  const newActivity: Activity = {
    ...activity,
    id: `activity-${activity.userId}-${activity.date}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  mockActivities.unshift(newActivity);
  return newActivity;
}

export function getRecentActivities(count: number = 7, userId?: string): Activity[] {
  const filtered = userId ? mockActivities.filter((a) => a.userId === userId) : mockActivities;
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
  const totalDuration = activities.reduce((sum, a) => sum + (a.duration ?? 0), 0);

  return {
    activeDays: totalDays,
    totalDuration,
    averageDuration: totalDays > 0 ? Math.round(totalDuration / totalDays) : 0,
    streak: calculateCurrentStreak(userId),
  };
}

function calculateCurrentStreak(userId?: string): number {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    if (getActivityForDate(dateStr, userId)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
