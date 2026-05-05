import type { UserProfile } from '$lib/types';
import { mockUsers } from './mock';
import { CURRENT_USER_ID } from './session';
import { getGoalsByUser } from './goals';
import { getTrackedProgress } from './listProgress';

let store: UserProfile[] = [...mockUsers];

export function getUsers(): UserProfile[] {
  return store;
}

export function getPublicUsers(): UserProfile[] {
  return store.filter((u) => u.isPublic);
}

export function getUserById(userId: string): UserProfile | undefined {
  return store.find((u) => u.id === userId);
}

export function getCurrentUserProfile(): UserProfile | undefined {
  return getUserById(CURRENT_USER_ID);
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
  return store.filter((u) => u.teacherId === teacherId);
}

export function getStudentTrackingSummary(studentId: string): {
  goalsDone: number;
  goalsTotal: number;
  trackedDone: number;
  trackedTotal: number;
  needs: string[];
} {
  const goals = getGoalsByUser(studentId);
  const goalsDone = goals.filter((g) => g.status === 'landed' || g.status === 'done').length;

  const tracked = getTrackedProgress(studentId);
  const trackedTotal = tracked.reduce((acc, p) => acc + p.items.length, 0);
  const trackedDone = tracked.reduce((acc, p) => acc + p.items.filter((i) => i.done).length, 0);

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
  const q = query.trim().toLowerCase();
  if (!q) return getPublicUsers();

  return getPublicUsers().filter((u) => {
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.city ?? '').toLowerCase().includes(q) ||
      (u.country ?? '').toLowerCase().includes(q)
    );
  });
}
