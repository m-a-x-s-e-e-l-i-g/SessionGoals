import { getAppState } from './state';

export const CURRENT_USER_ID = '';

export function getUserDisplayName(userId?: string): string {
  if (!userId) return 'Unknown';
  const user = getAppState().users.find((entry) => entry.id === userId);
  return user?.displayName ?? userId;
}
