import type { ActivityType, GoalStatus, GoalType, GoalListType, GoalListVisibility } from '$lib/types';

export const CHECKED_ICON = '✓';

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

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

export function formatGoalStatsSummary(
  spotTodoCount: number,
  moveTodoCount: number,
  doneMoveCount: number,
): string {
  return `${spotTodoCount} Spot ${pluralize(spotTodoCount, 'Todo')} · ${moveTodoCount} Move ${pluralize(moveTodoCount, 'Todo')} · ${doneMoveCount} ${pluralize(doneMoveCount, 'Move')} Done`;
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
  };
  return map[type] ?? '•';
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Shortens a URL for display. Removes the protocol prefix and,
 * if the result is longer than `maxLen`, shows the beginning and
 * end parts separated by an ellipsis.
 */
export function shortenUrl(url: string, maxLen = 55): string {
  let display: string;
  try {
    const parsed = new URL(url);
    // Drop protocol, strip leading www.
    display = parsed.hostname.replace(/^www\./, '') + parsed.pathname + parsed.search + parsed.hash;
  } catch {
    display = url;
  }
  if (display.length <= maxLen) return display;
  const suffixLen = Math.floor((maxLen - 1) / 2);
  const prefixLen = maxLen - 1 - suffixLen;
  return `${display.slice(0, prefixLen)}…${display.slice(-suffixLen)}`;
}
