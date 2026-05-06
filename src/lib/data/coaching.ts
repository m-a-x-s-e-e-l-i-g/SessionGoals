import { runDataAction } from './api';

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

export async function enrollStudentToPublicList(
  teacherId: string,
  studentId: string,
  listId: string,
): Promise<EnrollStudentResult> {
  return runDataAction<EnrollStudentResult>('enrollStudentToPublicList', {
    teacherId,
    studentId,
    listId,
  });
}
