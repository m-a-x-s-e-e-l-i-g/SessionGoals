export const CURRENT_USER_ID = 'user-me';

const userNames: Record<string, string> = {
  'user-me': 'You',
  'user-lena': 'Lena Hartmann',
  'user-milo': 'Milo K.',
};

export function getUserDisplayName(userId?: string): string {
  if (!userId) return 'Unknown';
  return userNames[userId] ?? userId;
}
