import type { GoalStatus, GoalType, GoalListType, GoalListVisibility } from '$lib/types';

export function formatStatus(status: GoalStatus): string {
  const map: Record<GoalStatus, string> = {
    idea: 'Idea',
    want_to_try: 'Want to try',
    training: 'Training',
    landed: 'Landed ✓',
    done: 'Done',
    archived: 'Archived',
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

export function statusColor(status: GoalStatus): string {
  const map: Record<GoalStatus, string> = {
    idea: 'status-idea',
    want_to_try: 'status-want',
    training: 'status-training',
    landed: 'status-landed',
    done: 'status-done',
    archived: 'status-archived',
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
