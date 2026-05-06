import type { Tag } from '$lib/types';
import { getAppState } from './state';

export function getTags(): Tag[] {
  return getAppState().tags;
}
