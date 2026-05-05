import { getListById } from './lists';
import { startTrackingList, getProgressForList } from './listProgress';
import { getUserById, getStudentsForTeacher, isTeacher } from './users';

export type EnrollStudentResult =
  | { ok: true; alreadyEnrolled: boolean }
  | {
      ok: false;
      reason:
        | 'teacher_not_found'
        | 'not_teacher'
        | 'list_not_found'
        | 'list_not_public'
        | 'student_not_found'
        | 'student_not_assigned';
    };

export function enrollStudentToPublicList(
  teacherId: string,
  studentId: string,
  listId: string
): EnrollStudentResult {
  const teacher = getUserById(teacherId);
  if (!teacher) return { ok: false, reason: 'teacher_not_found' };
  if (!isTeacher(teacher)) return { ok: false, reason: 'not_teacher' };

  const list = getListById(listId);
  if (!list) return { ok: false, reason: 'list_not_found' };
  if (list.visibility !== 'public') return { ok: false, reason: 'list_not_public' };

  const student = getUserById(studentId);
  if (!student) return { ok: false, reason: 'student_not_found' };

  const isAssignedStudent = getStudentsForTeacher(teacherId).some((s) => s.id === studentId);
  if (!isAssignedStudent) return { ok: false, reason: 'student_not_assigned' };

  const existing = getProgressForList(listId, studentId);
  if (existing) return { ok: true, alreadyEnrolled: true };

  startTrackingList(list, studentId);
  return { ok: true, alreadyEnrolled: false };
}
