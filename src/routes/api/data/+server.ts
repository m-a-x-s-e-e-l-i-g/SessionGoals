import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type {
  Activity,
  ActivityType,
  Challenge,
  CreateChallengeInput,
  CreateGoalInput,
  UpdateGoalInput,
  CreateGoalListInput,
  Goal,
  GoalStatus,
  GoalType,
  GoalList,
  ListProgress,
  Spot,
  UserProfile,
} from '$lib/types';
import type { EnrollStudentResult } from '$lib/data/coaching';
import { normalizeActivityType } from '$lib/types';
import { loadAppStateForRequest } from '$lib/server/appState';

interface ActionBody {
  action: string;
  payload?: Record<string, unknown>;
}

function badRequest(message: string) {
  return json({ ok: false, error: message }, { status: 400 });
}

function unauthorized(message: string = 'Authentication required.') {
  return json({ ok: false, error: message }, { status: 401 });
}

function forbidden(message: string = 'Forbidden.') {
  return json({ ok: false, error: message }, { status: 403 });
}

async function ensureCurrentUserProfile(locals: App.Locals): Promise<void> {
  if (!locals.supabase || !locals.user) return;

  const userId = locals.user.id;
  const fallbackName = (locals.user.email ?? userId).split('@')[0];
  const profile = {
    id: userId,
    username: fallbackName,
    display_name: locals.user.user_metadata?.full_name ?? fallbackName,
  };

  await locals.supabase.from('users').upsert(profile, { onConflict: 'id' });
}

async function snapshotFor(locals: App.Locals, userId: string | null) {
  return loadAppStateForRequest(locals.supabase, userId);
}

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.supabase) {
    return json({ ok: false, error: 'Supabase is not configured.' }, { status: 500 });
  }

  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return badRequest('Invalid JSON payload.');
  }

  const action = body.action;
  const payload = body.payload ?? {};

  try {
    if (action === 'createGoal') {
      if (!locals.user) return unauthorized();
      await ensureCurrentUserProfile(locals);

      const input = payload.input as CreateGoalInput | undefined;
      if (!input?.type) return badRequest('Goal type is required.');

      const sourceGoalId = input.sourceGoalId?.trim() || null;
      let sourceGoalRow: {
        id: string;
        user_id: string;
        type: GoalType;
        title: string;
        description: string | null;
        difficulty: number | null;
        spot_id: string | null;
        image_url: string | null;
        source_url: string | null;
      } | null = null;

      if (sourceGoalId) {
        const { data: sourceGoal, error: sourceGoalError } = await locals.supabase
          .from('goals')
          .select('id, user_id, type, title, description, difficulty, spot_id, image_url, source_url')
          .eq('id', sourceGoalId)
          .maybeSingle();

        if (sourceGoalError) throw new Error(sourceGoalError.message);
        if (!sourceGoal) {
          return badRequest('Source goal not found.');
        }

        if (sourceGoal.user_id === locals.user.id) {
          return badRequest('You already own this goal.');
        }

        sourceGoalRow = {
          id: sourceGoal.id,
          user_id: sourceGoal.user_id,
          type: sourceGoal.type as GoalType,
          title: sourceGoal.title,
          description: sourceGoal.description,
          difficulty: sourceGoal.difficulty,
          spot_id: sourceGoal.spot_id,
          image_url: sourceGoal.image_url,
          source_url: sourceGoal.source_url,
        };

        const { data: existingAdoptedGoal, error: existingAdoptedGoalError } = await locals.supabase
          .from('goals')
          .select('id')
          .eq('user_id', locals.user.id)
          .eq('source_goal_id', sourceGoalId)
          .maybeSingle();

        if (existingAdoptedGoalError) throw new Error(existingAdoptedGoalError.message);

        if (existingAdoptedGoal?.id) {
          const snapshot = await snapshotFor(locals, locals.user.id);
          const existingGoal = snapshot.goals.find((entry) => entry.id === existingAdoptedGoal.id);
          if (!existingGoal) throw new Error('Goal exists but failed to load it.');
          return json({ ok: true, data: existingGoal });
        }
      }

      const normalizedTitle = input.title?.trim() || (input.type === 'spot' ? 'Spot visit' : 'Untitled goal');

      const { data: goalRow, error: goalError } = await locals.supabase
        .from('goals')
        .insert({
          user_id: locals.user.id,
          source_goal_id: sourceGoalId,
          type: sourceGoalRow?.type ?? input.type,
          title: sourceGoalRow?.title ?? normalizedTitle,
          description: sourceGoalRow?.description ?? input.description ?? null,
          status: input.status,
          difficulty: sourceGoalRow?.difficulty ?? input.difficulty ?? null,
          spot_id: sourceGoalRow?.spot_id ?? input.spotId ?? null,
          image_url: sourceGoalRow?.image_url ?? input.imageUrl ?? null,
          source_url: sourceGoalRow?.source_url ?? input.sourceUrl ?? null,
        })
        .select('*')
        .single();

      if (goalError || !goalRow) throw new Error(goalError?.message ?? 'Failed to create goal.');

      const snapshot = await snapshotFor(locals, locals.user.id);
      const goal = snapshot.goals.find((entry) => entry.id === goalRow.id);
      if (!goal) throw new Error('Goal created but failed to load it.');
      return json({ ok: true, data: goal });
    }

    if (action === 'updateGoalStatus') {
      if (!locals.user) return unauthorized();
      const id = payload.id as string | undefined;
      const status = payload.status as GoalStatus | undefined;
      if (!id || !status) return badRequest('Goal id and status are required.');

      const { error } = await locals.supabase
        .from('goals')
        .update({ status })
        .eq('id', id)
        .eq('user_id', locals.user.id);

      if (error) throw new Error(error.message);

      const snapshot = await snapshotFor(locals, locals.user.id);
      const goal = snapshot.goals.find((entry) => entry.id === id);
      if (!goal) return json({ ok: false, error: 'Goal not found.' }, { status: 404 });
      return json({ ok: true, data: goal });
    }

    if (action === 'updateGoal') {
      if (!locals.user) return unauthorized();

      const id = payload.id as string | undefined;
      const input = payload.input as UpdateGoalInput | undefined;

      if (!id || !input?.type) return badRequest('Goal id and input are required.');

      const { data: existingGoal, error: existingGoalError } = await locals.supabase
        .from('goals')
        .select('id, source_goal_id')
        .eq('id', id)
        .eq('user_id', locals.user.id)
        .maybeSingle();

      if (existingGoalError) throw new Error(existingGoalError.message);
      if (!existingGoal) return json({ ok: false, error: 'Goal not found.' }, { status: 404 });
      if (existingGoal.source_goal_id) {
        return forbidden('Adopted goals are read-only. You can still track check status.');
      }

      const normalizedTitle = input.title?.trim() || (input.type === 'spot' ? 'Spot visit' : 'Untitled goal');

      const { data: updatedGoal, error: updateError } = await locals.supabase
        .from('goals')
        .update({
          type: input.type,
          title: normalizedTitle,
          description: input.description ?? null,
          status: input.status,
          difficulty: input.difficulty ?? null,
          spot_id: input.spotId ?? null,
          image_url: input.imageUrl ?? null,
          source_url: input.sourceUrl ?? null,
        })
        .eq('id', id)
        .eq('user_id', locals.user.id)
        .select('id')
        .maybeSingle();

      if (updateError) throw new Error(updateError.message);
      if (!updatedGoal) return json({ ok: false, error: 'Goal not found.' }, { status: 404 });

      const snapshot = await snapshotFor(locals, locals.user.id);
      const goal = snapshot.goals.find((entry) => entry.id === id);
      if (!goal) return json({ ok: false, error: 'Goal not found.' }, { status: 404 });
      return json({ ok: true, data: goal });
    }

    if (action === 'deleteGoal') {
      if (!locals.user) return unauthorized();
      const id = payload.id as string | undefined;
      if (!id) return badRequest('Goal id is required.');

      const { error } = await locals.supabase.from('goals').delete().eq('id', id).eq('user_id', locals.user.id);
      if (error) throw new Error(error.message);
      return json({ ok: true, data: { id } });
    }

    if (action === 'createList') {
      if (!locals.user) return unauthorized();
      await ensureCurrentUserProfile(locals);

      const input = payload.input as CreateGoalListInput | undefined;
      if (!input?.name?.trim()) return badRequest('List name is required.');

      const { data: listRow, error } = await locals.supabase
        .from('goal_lists')
        .insert({
          user_id: locals.user.id,
          name: input.name.trim(),
          description: input.description ?? null,
          type: input.type,
          visibility: input.visibility ?? 'private',
        })
        .select('*')
        .single();

      if (error || !listRow) throw new Error(error?.message ?? 'Failed to create list.');

      const snapshot = await snapshotFor(locals, locals.user.id);
      const list = snapshot.lists.find((entry) => entry.id === listRow.id);
      if (!list) throw new Error('List created but failed to load it.');
      return json({ ok: true, data: list });
    }

    if (action === 'addGoalToList') {
      if (!locals.user) return unauthorized();
      const listId = payload.listId as string | undefined;
      const goalId = payload.goalId as string | undefined;
      if (!listId || !goalId) return badRequest('listId and goalId are required.');

      const { data: ownedList } = await locals.supabase
        .from('goal_lists')
        .select('id')
        .eq('id', listId)
        .eq('user_id', locals.user.id)
        .maybeSingle();

      if (!ownedList) return forbidden('Only the list owner can modify list items.');

      const { data: maxRow, error: maxError } = await locals.supabase
        .from('goal_list_items')
        .select('position')
        .eq('list_id', listId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxError) throw new Error(maxError.message);
      const nextPosition = (maxRow?.position ?? 0) + 1;

      const { error } = await locals.supabase.from('goal_list_items').insert({
        list_id: listId,
        goal_id: goalId,
        position: nextPosition,
      });

      if (error) throw new Error(error.message);

      const snapshot = await snapshotFor(locals, locals.user.id);
      const list = snapshot.lists.find((entry) => entry.id === listId);
      if (!list) return json({ ok: false, error: 'List not found.' }, { status: 404 });
      return json({ ok: true, data: list });
    }

    if (action === 'updateList') {
      if (!locals.user) return unauthorized();
      const id = payload.id as string | undefined;
      if (!id) return badRequest('List id is required.');

      const name = (payload.name as string | undefined)?.trim();
      if (!name) return badRequest('List name is required.');

      const { error } = await locals.supabase
        .from('goal_lists')
        .update({
          name,
          description: (payload.description as string | undefined)?.trim() || null,
          type: payload.type as string,
          visibility: payload.visibility as string,
        })
        .eq('id', id)
        .eq('user_id', locals.user.id);

      if (error) throw new Error(error.message);

      const snapshot = await snapshotFor(locals, locals.user.id);
      const list = snapshot.lists.find((entry) => entry.id === id);
      if (!list) return json({ ok: false, error: 'List not found.' }, { status: 404 });
      return json({ ok: true, data: list });
    }

    if (action === 'deleteList') {
      if (!locals.user) return unauthorized();
      const id = payload.id as string | undefined;
      if (!id) return badRequest('List id is required.');

      const { error } = await locals.supabase.from('goal_lists').delete().eq('id', id).eq('user_id', locals.user.id);
      if (error) throw new Error(error.message);
      return json({ ok: true, data: { id } });
    }

    if (action === 'startTrackingList') {
      if (!locals.user) return unauthorized();
      const sourceListId = payload.sourceListId as string | undefined;
      const userId = payload.userId as string | undefined;
      if (!sourceListId || !userId) return badRequest('sourceListId and userId are required.');
      if (userId !== locals.user.id) return forbidden();

      const { data: list } = await locals.supabase
        .from('goal_lists')
        .select('id, visibility, user_id')
        .eq('id', sourceListId)
        .maybeSingle();

      if (!list) return json({ ok: false, error: 'List not found.' }, { status: 404 });
      if (list.visibility !== 'public' && list.user_id !== locals.user.id) {
        return forbidden('You can only track your own or public lists.');
      }

      const { data: existing } = await locals.supabase
        .from('list_progress')
        .select('id')
        .eq('source_list_id', sourceListId)
        .eq('user_id', userId)
        .maybeSingle();

      let progressId = existing?.id;

      if (!progressId) {
        const { data: createdProgress, error: createError } = await locals.supabase
          .from('list_progress')
          .insert({ source_list_id: sourceListId, user_id: userId })
          .select('id')
          .single();

        if (createError || !createdProgress) throw new Error(createError?.message ?? 'Failed to start tracking list.');
        progressId = createdProgress.id;

        const { data: items, error: itemsError } = await locals.supabase
          .from('goal_list_items')
          .select('goal_id')
          .eq('list_id', sourceListId);

        if (itemsError) throw new Error(itemsError.message);

        if ((items ?? []).length > 0) {
          const inserts = (items ?? []).map((item) => ({ progress_id: progressId, goal_id: item.goal_id, done: false }));
          const { error: insertProgressItemsError } = await locals.supabase
            .from('list_progress_items')
            .insert(inserts);
          if (insertProgressItemsError) throw new Error(insertProgressItemsError.message);
        }
      }

      const snapshot = await snapshotFor(locals, locals.user.id);
      const progress = snapshot.progress.find((entry) => entry.id === progressId);
      if (!progress) throw new Error('Tracking started but progress could not be loaded.');
      return json({ ok: true, data: progress });
    }

    if (action === 'toggleListItemProgress') {
      if (!locals.user) return unauthorized();
      const sourceListId = payload.sourceListId as string | undefined;
      const goalId = payload.goalId as string | undefined;
      const userId = payload.userId as string | undefined;
      if (!sourceListId || !goalId || !userId) {
        return badRequest('sourceListId, goalId, and userId are required.');
      }
      if (userId !== locals.user.id) return forbidden();

      const { data: progress } = await locals.supabase
        .from('list_progress')
        .select('id')
        .eq('source_list_id', sourceListId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!progress) return json({ ok: false, error: 'Progress not found.' }, { status: 404 });

      const { data: progressItem } = await locals.supabase
        .from('list_progress_items')
        .select('id, done')
        .eq('progress_id', progress.id)
        .eq('goal_id', goalId)
        .maybeSingle();

      if (!progressItem) return json({ ok: false, error: 'Progress item not found.' }, { status: 404 });

      const nextDone = !progressItem.done;
      const { error: updateItemError } = await locals.supabase
        .from('list_progress_items')
        .update({
          done: nextDone,
          completed_at: nextDone ? new Date().toISOString() : null,
        })
        .eq('id', progressItem.id);

      if (updateItemError) throw new Error(updateItemError.message);

      const { error: touchError } = await locals.supabase
        .from('list_progress')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', progress.id);

      if (touchError) throw new Error(touchError.message);

      const snapshot = await snapshotFor(locals, locals.user.id);
      const updated = snapshot.progress.find((entry) => entry.id === progress.id);
      if (!updated) throw new Error('Progress updated but failed to reload.');
      return json({ ok: true, data: updated });
    }

    if (action === 'enrollStudentToPublicList') {
      if (!locals.user) return unauthorized();
      const teacherId = payload.teacherId as string | undefined;
      const studentId = payload.studentId as string | undefined;
      const listId = payload.listId as string | undefined;
      if (!teacherId || !studentId || !listId) return badRequest('teacherId, studentId, and listId are required.');
      if (teacherId !== locals.user.id) return forbidden();

      const snapshot = await snapshotFor(locals, locals.user.id);
      const teacher = snapshot.users.find((entry) => entry.id === teacherId);
      if (!teacher) return json({ ok: true, data: { ok: false, reason: 'teacher_not_found' } satisfies EnrollStudentResult });
      if (!(teacher.role === 'teacher' || teacher.role === 'athlete_teacher')) {
        return json({ ok: true, data: { ok: false, reason: 'not_teacher' } satisfies EnrollStudentResult });
      }

      const list = snapshot.lists.find((entry) => entry.id === listId);
      if (!list) return json({ ok: true, data: { ok: false, reason: 'list_not_found' } satisfies EnrollStudentResult });
      if (list.visibility !== 'public') {
        return json({ ok: true, data: { ok: false, reason: 'list_not_public' } satisfies EnrollStudentResult });
      }

      const student = snapshot.users.find((entry) => entry.id === studentId);
      if (!student) return json({ ok: true, data: { ok: false, reason: 'student_not_found' } satisfies EnrollStudentResult });
      if (student.teacherId !== teacherId) {
        return json({ ok: true, data: { ok: false, reason: 'student_not_assigned' } satisfies EnrollStudentResult });
      }

      const existing = snapshot.progress.find(
        (entry) => entry.userId === studentId && entry.sourceListId === listId,
      );

      if (existing) {
        return json({ ok: true, data: { ok: true, alreadyEnrolled: true } satisfies EnrollStudentResult });
      }

      const { data: createdProgress, error: createError } = await locals.supabase
        .from('list_progress')
        .insert({ source_list_id: listId, user_id: studentId })
        .select('id')
        .single();

      if (createError || !createdProgress) throw new Error(createError?.message ?? 'Failed to enroll student.');

      if (list.items.length > 0) {
        const inserts = list.items.map((item) => ({
          progress_id: createdProgress.id,
          goal_id: item.goalId,
          done: false,
        }));
        const { error: insertError } = await locals.supabase.from('list_progress_items').insert(inserts);
        if (insertError) throw new Error(insertError.message);
      }

      return json({ ok: true, data: { ok: true, alreadyEnrolled: false } satisfies EnrollStudentResult });
    }

    if (action === 'addActivity') {
      if (!locals.user) return unauthorized();
      const activity = payload.activity as Omit<Activity, 'id' | 'createdAt'> & {
        userId?: string;
        date?: string;
        activityType?: ActivityType;
        duration?: number;
        notes?: string;
        linkedGoalId?: string;
      };

      if (!activity?.date) return badRequest('Activity date is required.');
      if (activity.userId !== locals.user.id) return forbidden();

      const { data: row, error } = await locals.supabase
        .from('activities')
        .insert({
          user_id: locals.user.id,
          date: activity.date,
          activity_type: normalizeActivityType(activity.activityType),
          duration: activity.duration ?? null,
          notes: activity.notes ?? null,
          linked_goal_id: activity.linkedGoalId ?? null,
        })
        .select('*')
        .single();

      if (error || !row) throw new Error(error?.message ?? 'Failed to add activity.');

      const snapshot = await snapshotFor(locals, locals.user.id);
      const created = snapshot.activities.find((entry) => entry.id === row.id);
      if (!created) throw new Error('Activity created but failed to load it.');
      return json({ ok: true, data: created });
    }

    if (action === 'deleteActivity') {
      if (!locals.user) return unauthorized();
      const id = payload.id as string | undefined;
      if (!id) return badRequest('Activity id is required.');

      const { error } = await locals.supabase
        .from('activities')
        .delete()
        .eq('id', id)
        .eq('user_id', locals.user.id);
      if (error) throw new Error(error.message);

      return json({ ok: true, data: { id } });
    }

    if (action === 'upsertSpot') {
      if (!locals.user) return unauthorized();
      const spot = payload.spot as Spot | undefined;
      if (!spot?.name?.trim()) return badRequest('Spot name is required.');

      let spotId = spot.id;
      if (spot.externalId) {
        const { data: existingByExternalId } = await locals.supabase
          .from('spots')
          .select('id')
          .eq('external_id', spot.externalId)
          .maybeSingle();
        if (existingByExternalId?.id) {
          spotId = existingByExternalId.id;
        }
      }

      const { error: spotError } = await locals.supabase.from('spots').upsert(
        {
          id: spotId,
          external_id: spot.externalId ?? null,
          name: spot.name,
          description: spot.description ?? null,
          city: spot.city ?? null,
          country: spot.country ?? null,
        },
        { onConflict: 'id' },
      );

      if (spotError) throw new Error(spotError.message);

      const snapshot = await snapshotFor(locals, locals.user.id);
      const saved = snapshot.spots.find((entry) => entry.id === spotId);
      if (!saved) throw new Error('Spot saved but failed to load it.');
      return json({ ok: true, data: saved });
    }

    if (action === 'updateUserProfile') {
      if (!locals.user) return unauthorized();
      const userId = payload.userId as string | undefined;
      const updates = payload.updates as Partial<UserProfile> | undefined;
      if (!userId || !updates) return badRequest('userId and updates are required.');
      if (userId !== locals.user.id) return forbidden();

      const patch: Record<string, unknown> = {};
      if (typeof updates.displayName === 'string') patch.display_name = updates.displayName;
      if (typeof updates.bio === 'string' || updates.bio === undefined) patch.bio = updates.bio ?? null;
      if (typeof updates.city === 'string' || updates.city === undefined) patch.city = updates.city ?? null;
      if (typeof updates.country === 'string' || updates.country === undefined) patch.country = updates.country ?? null;
      if (typeof updates.isPublic === 'boolean') patch.is_public = updates.isPublic;
      if (typeof updates.role === 'string') patch.role = updates.role;

      const { error } = await locals.supabase.from('users').update(patch).eq('id', userId);
      if (error) throw new Error(error.message);

      const snapshot = await snapshotFor(locals, locals.user.id);
      const profile = snapshot.users.find((entry) => entry.id === userId);
      if (!profile) throw new Error('Profile updated but failed to load it.');
      return json({ ok: true, data: profile });
    }

    if (action === 'createChallenge') {
      if (!locals.user) return unauthorized();
      const input = payload.input as CreateChallengeInput | undefined;
      if (!input?.title?.trim()) return badRequest('Challenge title is required.');

      const { data: row, error } = await locals.supabase
        .from('challenges')
        .insert({
          user_id: locals.user.id,
          title: input.title,
          description: input.description ?? null,
          status: input.status,
          difficulty: input.difficulty ?? null,
        })
        .select('id')
        .single();

      if (error || !row) throw new Error(error?.message ?? 'Failed to create challenge.');

      const challengeId = row.id;

      if ((input.spotIds ?? []).length > 0) {
        const inserts = input.spotIds!.map((spotId) => ({ challenge_id: challengeId, spot_id: spotId }));
        const { error: spotsError } = await locals.supabase.from('challenge_spots').insert(inserts);
        if (spotsError) throw new Error(spotsError.message);
      }

      if ((input.goalIds ?? []).length > 0) {
        const inserts = input.goalIds!.map((goalId) => ({ challenge_id: challengeId, goal_id: goalId }));
        const { error: goalsError } = await locals.supabase.from('challenge_goals').insert(inserts);
        if (goalsError) throw new Error(goalsError.message);
      }

      const snapshot = await snapshotFor(locals, locals.user.id);
      const challenge = snapshot.challenges.find((entry) => entry.id === challengeId);
      if (!challenge) throw new Error('Challenge created but failed to load it.');
      return json({ ok: true, data: challenge });
    }

    if (action === 'updateChallenge') {
      if (!locals.user) return unauthorized();
      const id = payload.id as string | undefined;
      const patch = payload.patch as Partial<Challenge> | undefined;
      if (!id || !patch) return badRequest('Challenge id and patch are required.');

      const challengePatch: Record<string, unknown> = {};
      if (typeof patch.title === 'string') challengePatch.title = patch.title;
      if (typeof patch.description === 'string' || patch.description === undefined) {
        challengePatch.description = patch.description ?? null;
      }
      if (typeof patch.status === 'string') challengePatch.status = patch.status;
      if (typeof patch.difficulty === 'number' || patch.difficulty === undefined) {
        challengePatch.difficulty = patch.difficulty ?? null;
      }

      const { error: challengeError } = await locals.supabase
        .from('challenges')
        .update(challengePatch)
        .eq('id', id)
        .eq('user_id', locals.user.id);

      if (challengeError) throw new Error(challengeError.message);

      if (Array.isArray(patch.spotIds)) {
        await locals.supabase.from('challenge_spots').delete().eq('challenge_id', id);
        if (patch.spotIds.length > 0) {
          const inserts = patch.spotIds.map((spotId) => ({ challenge_id: id, spot_id: spotId }));
          const { error } = await locals.supabase.from('challenge_spots').insert(inserts);
          if (error) throw new Error(error.message);
        }
      }

      if (Array.isArray(patch.goalIds)) {
        await locals.supabase.from('challenge_goals').delete().eq('challenge_id', id);
        if (patch.goalIds.length > 0) {
          const inserts = patch.goalIds.map((goalId) => ({ challenge_id: id, goal_id: goalId }));
          const { error } = await locals.supabase.from('challenge_goals').insert(inserts);
          if (error) throw new Error(error.message);
        }
      }

      const snapshot = await snapshotFor(locals, locals.user.id);
      const challenge = snapshot.challenges.find((entry) => entry.id === id);
      if (!challenge) return json({ ok: false, error: 'Challenge not found.' }, { status: 404 });
      return json({ ok: true, data: challenge });
    }

    return badRequest(`Unknown action: ${action}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error.';
    return json({ ok: false, error: message }, { status: 500 });
  }
};
