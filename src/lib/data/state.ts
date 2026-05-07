import { get, writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { AppStateSnapshot } from '$lib/types/appState';
import { createEmptyAppState } from '$lib/types/appState';

const appState = writable<AppStateSnapshot>(createEmptyAppState());
let initialized = false;

export function initializeAppState(snapshot: AppStateSnapshot): void {
  appState.set(snapshot);
  initialized = true;
}

export function getAppState(): AppStateSnapshot {
  return get(appState);
}

export function updateAppState(updater: (state: AppStateSnapshot) => AppStateSnapshot): void {
  appState.update(updater);
}

export function getCurrentUserIdFromState(): string | null {
  return getAppState().currentUserId;
}

/** Readable store — subscribe to re-run derived values when state changes */
export { appState as appStateStore };

export function ensureClientStateReady(): void {
  if (!browser) return;
  if (initialized) return;
  appState.set(createEmptyAppState());
  initialized = true;
}
