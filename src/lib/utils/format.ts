import type { ActivityType, GoalStatus, GoalType, GoalListType, GoalListVisibility } from '$lib/types';

export function formatStatus(status: GoalStatus): string {
  const map: Record<GoalStatus, string> = {
    want_to_try: 'Unchecked',
    done: 'Done',
  };
  return map[status] ?? status;
}

export function formatGoalType(type: GoalType): string {
  const map: Record<GoalType, string> = {
    move: 'Move',
    spot: 'Spot',
    inspiration: 'Inspiration',
  };
  return map[type] ?? type;
}

export function formatListType(type: GoalListType): string {
  const map: Record<GoalListType, string> = {
    training_plan: 'Training Plan',
    competition: 'Competition',
    wishlist: 'Wishlist',
    general: 'General',
  };
  return map[type] ?? type;
}

export function formatListVisibility(visibility: GoalListVisibility): string {
  const map: Record<GoalListVisibility, string> = {
    public: 'Public',
    private: 'Private',
  };
  return map[visibility] ?? visibility;
}

export function formatActivityType(activityType: ActivityType): string {
  const map: Record<ActivityType, string> = {
    parkour: 'Parkour',
    running: 'Running',
    gym: 'Gym',
    bouldering: 'Bouldering',
    calisthenics: 'Calisthenics',
    mobility: 'Mobility',
    other: 'Other training',
  };
  return map[activityType] ?? activityType;
}

export function statusColor(status: GoalStatus): string {
  const map: Record<GoalStatus, string> = {
    want_to_try: 'status-open',
    done: 'status-done',
  };
  return map[status] ?? '';
}

export function typeIcon(type: GoalType): string {
  const map: Record<GoalType, string> = {
    move: '🤸',
    spot: '📍',
    inspiration: '💡',
  };
  return map[type] ?? '•';
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
