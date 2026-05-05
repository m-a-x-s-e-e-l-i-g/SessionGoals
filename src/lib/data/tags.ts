import { mockTags } from './mock';
import type { Tag } from '$lib/types';

export function getTags(): Tag[] {
  return mockTags;
}
