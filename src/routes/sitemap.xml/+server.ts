import type { SupabaseClient } from '@supabase/supabase-js';
import type { RequestHandler } from './$types';
import { getCanonicalOrigin } from '$lib/server/urls';

type ChangeFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: ChangeFrequency;
  priority?: number;
}

interface UserSitemapRow {
  id: string;
  joined_at: string | null;
}

interface ListSitemapRow {
  id: string;
  updated_at: string | null;
}

interface GoalSitemapRow {
  id: string;
  updated_at: string | null;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: '/', changefreq: 'daily', priority: 1 },
  { path: '/inspiration', changefreq: 'weekly', priority: 0.85 },
  { path: '/lists', changefreq: 'daily', priority: 0.8 },
  { path: '/people', changefreq: 'weekly', priority: 0.75 },
  { path: '/spots', changefreq: 'weekly', priority: 0.7 },
  { path: '/privacy', changefreq: 'yearly', priority: 0.25 },
  { path: '/terms', changefreq: 'yearly', priority: 0.25 },
];

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function normalizeLastmod(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
}

function createPath(base: string, id: string): string {
  return `${base}/${encodeURIComponent(id)}`;
}

function isNewerLastmod(candidate: string | undefined, current: string | undefined): boolean {
  if (!candidate) return false;
  if (!current) return true;
  return new Date(candidate).getTime() > new Date(current).getTime();
}

function dedupeEntries(entries: SitemapEntry[]): SitemapEntry[] {
  const byPath = new Map<string, SitemapEntry>();

  for (const entry of entries) {
    const existing = byPath.get(entry.path);
    if (!existing || isNewerLastmod(entry.lastmod, existing.lastmod)) {
      byPath.set(entry.path, entry);
    }
  }

  return Array.from(byPath.values()).sort((left, right) => left.path.localeCompare(right.path));
}

async function loadPublicEntries(supabase: SupabaseClient | null): Promise<SitemapEntry[]> {
  if (!supabase) return [];

  const [usersResult, listsResult, libraryGoalsResult] = await Promise.all([
    supabase.from('users').select('id, joined_at').eq('is_public', true),
    supabase.from('goal_lists').select('id, updated_at').eq('visibility', 'public'),
    supabase.from('goals').select('id, updated_at').eq('is_library_entry', true),
  ]);

  const entries: SitemapEntry[] = [];

  if (usersResult.error) {
    console.error(`Failed to load public users for sitemap: ${usersResult.error.message}`);
  } else {
    const users = (usersResult.data ?? []) as UserSitemapRow[];
    entries.push(
      ...users.map((user) => ({
        path: createPath('/people', user.id),
        lastmod: normalizeLastmod(user.joined_at),
        changefreq: 'weekly' as const,
        priority: 0.65,
      })),
    );

    if (users.length > 0) {
      const publicUserGoalResult = await supabase
        .from('goals')
        .select('id, updated_at')
        .in('user_id', users.map((user) => user.id));

      if (publicUserGoalResult.error) {
        console.error(`Failed to load public user goals for sitemap: ${publicUserGoalResult.error.message}`);
      } else {
        const publicUserGoals = (publicUserGoalResult.data ?? []) as GoalSitemapRow[];
        entries.push(
          ...publicUserGoals.map((goal) => ({
            path: createPath('/goals', goal.id),
            lastmod: normalizeLastmod(goal.updated_at),
            changefreq: 'weekly' as const,
            priority: 0.55,
          })),
        );
      }
    }
  }

  if (listsResult.error) {
    console.error(`Failed to load public lists for sitemap: ${listsResult.error.message}`);
  } else {
    const lists = (listsResult.data ?? []) as ListSitemapRow[];
    entries.push(
      ...lists.map((list) => ({
        path: createPath('/lists', list.id),
        lastmod: normalizeLastmod(list.updated_at),
        changefreq: 'weekly' as const,
        priority: 0.7,
      })),
    );
  }

  if (libraryGoalsResult.error) {
    console.error(`Failed to load library goals for sitemap: ${libraryGoalsResult.error.message}`);
  } else {
    const libraryGoals = (libraryGoalsResult.data ?? []) as GoalSitemapRow[];
    entries.push(
      ...libraryGoals.map((goal) => ({
        path: createPath('/goals', goal.id),
        lastmod: normalizeLastmod(goal.updated_at),
        changefreq: 'monthly' as const,
        priority: 0.6,
      })),
    );
  }

  return entries;
}

function renderEntry(entry: SitemapEntry, origin: string): string {
  const loc = new URL(entry.path, origin).toString();
  const parts = ['  <url>', `    <loc>${escapeXml(loc)}</loc>`];

  if (entry.lastmod) {
    parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  }

  if (entry.changefreq) {
    parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  }

  if (entry.priority !== undefined) {
    parts.push(`    <priority>${entry.priority.toFixed(2)}</priority>`);
  }

  parts.push('  </url>');
  return parts.join('\n');
}

function renderSitemap(entries: SitemapEntry[], origin: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => renderEntry(entry, origin)),
    '</urlset>',
    '',
  ].join('\n');
}

export const GET: RequestHandler = async ({ locals, url }) => {
  const origin = getCanonicalOrigin(url);
  const dynamicEntries = await loadPublicEntries(locals.supabase);
  const entries = dedupeEntries([...STATIC_ENTRIES, ...dynamicEntries]);

  return new Response(renderSitemap(entries, origin), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
};