import type { LayoutServerLoad } from './$types';
import { loadAppStateForRequest } from '$lib/server/appState';
import { createEmptyAppState } from '$lib/types/appState';

export const load: LayoutServerLoad = async ({ locals }) => {
  const currentUserId = locals.user?.id ?? null;
  const appState = locals.supabase
    ? await loadAppStateForRequest(locals.supabase, currentUserId)
    : createEmptyAppState(currentUserId);

  return {
    user: locals.user,
    appState,
  };
};