import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppStateSnapshot } from '$lib/types/appState';
import { createEmptyAppState } from '$lib/types/appState';
import type {
  Activity,
  Challenge,
  Goal,
  GoalLink,
  GoalList,
  GoalListItem,
  ListProgress,
  ListProgressItem,
  Spot,
  UserProfile,
} from '$lib/types';
import { normalizeActivityType } from '$lib/types';

function toIsoString(value: string | null | undefined): string {
  return value ?? new Date().toISOString();
}

function normalizeGoalStatus(value: string | null | undefined): 'want_to_try' | 'done' {
  return value === 'done' || value === 'landed' ? 'done' : 'want_to_try';
}

function normalizeGoalType(value: string | null | undefined): 'move' | 'spot' {
  return value === 'spot' ? 'spot' : 'move';
}

type QueryResult<T> = { data: T[] | null; error: { message: string } | null };

function must<T>(result: QueryResult<T>, table: string): T[] {
  if (result.error) {
    throw new Error(`Failed to load ${table}: ${result.error.message}`);
  }
  return result.data ?? [];
}

export async function loadAppStateForRequest(
  supabase: SupabaseClient | null,
  currentUserId: string | null,
): Promise<AppStateSnapshot> {
  if (!supabase) {
    return createEmptyAppState(currentUserId);
  }

  const [
    usersResult,
    spotsResult,
    goalsResult,
    goalLinksResult,
    listsResult,
    listItemsResult,
    progressResult,
    progressItemsResult,
    activitiesResult,
    challengesResult,
    challengeSpotsResult,
    challengeGoalsResult,
    challengeLinksResult,
  ] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('spots').select('*'),
    supabase.from('goals').select('*'),
    supabase.from('goal_links').select('*'),
    supabase.from('goal_lists').select('*'),
    supabase.from('goal_list_items').select('*'),
    supabase.from('list_progress').select('*'),
    supabase.from('list_progress_items').select('*'),
    supabase.from('activities').select('*'),
    supabase.from('challenges').select('*'),
    supabase.from('challenge_spots').select('*'),
    supabase.from('challenge_goals').select('*'),
    supabase.from('challenge_links').select('*'),
  ]);

  const usersRows = must(usersResult, 'users');
  const spotsRows = must(spotsResult, 'spots');
  const goalsRows = must(goalsResult, 'goals');
  const goalLinksRows = must(goalLinksResult, 'goal_links');
  const listsRows = must(listsResult, 'goal_lists');
  const listItemsRows = must(listItemsResult, 'goal_list_items');
  const progressRows = must(progressResult, 'list_progress');
  const progressItemsRows = must(progressItemsResult, 'list_progress_items');
  const activitiesRows = must(activitiesResult, 'activities');
  const challengesRows = must(challengesResult, 'challenges');
  const challengeSpotsRows = must(challengeSpotsResult, 'challenge_spots');
  const challengeGoalsRows = must(challengeGoalsResult, 'challenge_goals');
  const challengeLinksRows = must(challengeLinksResult, 'challenge_links');

  const users: UserProfile[] = usersRows.map((row: any) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    teacherId: row.teacher_id ?? undefined,
    coachingNeeds: row.coaching_needs ?? [],
    bio: row.bio ?? undefined,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    isPublic: !!row.is_public,
    isAdmin: !!row.is_admin,
    joinedAt: toIsoString(row.joined_at),
  }));

  const spots: Spot[] = spotsRows.map((row: any) => ({
    id: row.id,
    externalId: row.external_id ?? undefined,
    name: row.name,
    description: row.description ?? undefined,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    // Coordinates are considered API-owned data and should be fetched live.
    coordinates: undefined,
    // Image URL is considered API-owned data and should be fetched live.
    imageUrl: undefined,
    createdAt: toIsoString(row.created_at),
  }));

  const goalLinksByGoalId = new Map<string, GoalLink[]>();
  for (const row of goalLinksRows as any[]) {
    const existing = goalLinksByGoalId.get(row.goal_id) ?? [];
    existing.push({
      id: row.id,
      goalId: row.goal_id,
      url: row.url,
      platform: row.platform ?? undefined,
      title: row.title ?? undefined,
    });
    goalLinksByGoalId.set(row.goal_id, existing);
  }

  const goals: Goal[] = goalsRows.map((row: any) => ({
    id: row.id,
    userId: row.user_id ?? undefined,
    sourceGoalId: row.source_goal_id ?? undefined,
    isLibraryEntry: !!row.is_library_entry,
    type: normalizeGoalType(row.type),
    title: row.title,
    description: row.description ?? undefined,
    status: normalizeGoalStatus(row.status),
    difficulty: row.difficulty ?? undefined,
    spotId: row.spot_id ?? undefined,
    imageUrl: row.image_url ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    links: goalLinksByGoalId.get(row.id) ?? [],
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }));

  const goalsById = new Map(goals.map((goal) => [goal.id, goal]));

  const listItemsByListId = new Map<string, GoalListItem[]>();
  for (const row of listItemsRows as any[]) {
    const existing = listItemsByListId.get(row.list_id) ?? [];
    existing.push({
      listId: row.list_id,
      goalId: row.goal_id,
      position: row.position,
      goal: goalsById.get(row.goal_id),
    });
    listItemsByListId.set(row.list_id, existing);
  }

  const lists: GoalList[] = listsRows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    type: row.type,
    visibility: row.visibility,
    items: (listItemsByListId.get(row.id) ?? []).sort((a, b) => a.position - b.position),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }));

  const progressItemsByProgressId = new Map<string, ListProgressItem[]>();
  for (const row of progressItemsRows as any[]) {
    const existing = progressItemsByProgressId.get(row.progress_id) ?? [];
    existing.push({
      goalId: row.goal_id,
      done: !!row.done,
      completedAt: row.completed_at ?? undefined,
    });
    progressItemsByProgressId.set(row.progress_id, existing);
  }

  const progress: ListProgress[] = progressRows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    sourceListId: row.source_list_id,
    items: progressItemsByProgressId.get(row.id) ?? [],
    startedAt: toIsoString(row.started_at),
    updatedAt: toIsoString(row.updated_at),
  }));

  const activities: Activity[] = activitiesRows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    activityType: normalizeActivityType(row.activity_type),
    duration: row.duration ?? undefined,
    notes: row.notes ?? undefined,
    linkedGoalId: row.linked_goal_id ?? undefined,
    createdAt: toIsoString(row.created_at),
  }));

  const challengeSpotsByChallengeId = new Map<string, string[]>();
  for (const row of challengeSpotsRows as any[]) {
    const existing = challengeSpotsByChallengeId.get(row.challenge_id) ?? [];
    existing.push(row.spot_id);
    challengeSpotsByChallengeId.set(row.challenge_id, existing);
  }

  const challengeGoalsByChallengeId = new Map<string, string[]>();
  for (const row of challengeGoalsRows as any[]) {
    const existing = challengeGoalsByChallengeId.get(row.challenge_id) ?? [];
    existing.push(row.goal_id);
    challengeGoalsByChallengeId.set(row.challenge_id, existing);
  }

  const challengeLinksByChallengeId = new Map<string, GoalLink[]>();
  for (const row of challengeLinksRows as any[]) {
    const existing = challengeLinksByChallengeId.get(row.challenge_id) ?? [];
    existing.push({
      id: row.id,
      goalId: row.challenge_id,
      url: row.url,
      platform: row.platform ?? undefined,
      title: row.title ?? undefined,
    });
    challengeLinksByChallengeId.set(row.challenge_id, existing);
  }

  const challenges: Challenge[] = challengesRows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    status: normalizeGoalStatus(row.status),
    difficulty: row.difficulty ?? undefined,
    spotIds: challengeSpotsByChallengeId.get(row.id) ?? [],
    goalIds: challengeGoalsByChallengeId.get(row.id) ?? [],
    links: challengeLinksByChallengeId.get(row.id) ?? [],
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }));

  return {
    currentUserId,
    users,
    spots,
    goals,
    lists,
    progress,
    activities,
    challenges,
  };
}
