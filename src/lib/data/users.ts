import type { UserProfile } from '$lib/types';
import { getGoalsByUser } from './goals';
import { getTrackedProgress } from './listProgress';
import { runDataAction } from './api';
import { getAppState, getCurrentUserIdFromState, updateAppState } from './state';

export function getUsers(): UserProfile[] {
  return getAppState().users;
}

export function getPublicUsers(): UserProfile[] {
  return getAppState().users.filter((user) => user.isPublic);
}

export function getUserById(userId: string): UserProfile | undefined {
  return getAppState().users.find((user) => user.id === userId);
}

export function getCurrentUserProfile(): UserProfile | undefined {
  const currentUserId = getCurrentUserIdFromState();
  return currentUserId ? getUserById(currentUserId) : undefined;
}

export function isTeacher(user?: UserProfile): boolean {
  if (!user) return false;
  return user.role === 'teacher' || user.role === 'athlete_teacher';
}

export function getTeacherForStudent(studentId: string): UserProfile | undefined {
  const student = getUserById(studentId);
  if (!student?.teacherId) return undefined;
  return getUserById(student.teacherId);
}

export function getStudentsForTeacher(teacherId: string): UserProfile[] {
  return getAppState().users.filter((user) => user.teacherId === teacherId);
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'city' | 'country' | 'isPublic' | 'role'>>,
): Promise<UserProfile | undefined> {
  const profile = await runDataAction<UserProfile>('updateUserProfile', { userId, updates });
  updateAppState((state) => ({
    ...state,
    users: state.users.map((entry) => (entry.id === userId ? profile : entry)),
  }));
  return profile;
}

export function getStudentTrackingSummary(studentId: string): {
  goalsDone: number;
  goalsTotal: number;
  trackedDone: number;
  trackedTotal: number;
  needs: string[];
} {
  const goals = getGoalsByUser(studentId);
  const goalsDone = goals.filter((goal) => goal.status === 'landed' || goal.status === 'done').length;

  const tracked = getTrackedProgress(studentId);
  const trackedTotal = tracked.reduce((acc, progress) => acc + progress.items.length, 0);
  const trackedDone = tracked.reduce((acc, progress) => acc + progress.items.filter((item) => item.done).length, 0);

  const student = getUserById(studentId);
  return {
    goalsDone,
    goalsTotal: goals.length,
    trackedDone,
    trackedTotal,
    needs: student?.coachingNeeds ?? [],
  };
}

export function searchPeople(query: string): UserProfile[] {
  const currentUserId = getCurrentUserIdFromState();
  const currentUser = currentUserId ? getUserById(currentUserId) : undefined;
  const teacherId = currentUser?.teacherId;

  const visible = getUsers().filter((user) => {
    if (user.isPublic) return true;
    if (currentUserId && user.id === currentUserId) return true;
    if (currentUserId && user.teacherId === currentUserId) return true;
    if (teacherId && user.id === teacherId) return true;
    return false;
  });

  const q = query.trim().toLowerCase();
  if (!q) return visible;

  return visible.filter((user) => {
    return (
      user.displayName.toLowerCase().includes(q)
      || user.username.toLowerCase().includes(q)
      || user.role.toLowerCase().includes(q)
      || (user.city ?? '').toLowerCase().includes(q)
      || (user.country ?? '').toLowerCase().includes(q)
    );
  });
}
