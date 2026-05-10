import { redirect, type Handle } from '@sveltejs/kit';
import { createServerSupabaseClient, isSupabaseConfigured } from '$lib/server/supabase';
import { env } from '$env/dynamic/private';
import type { User } from '@supabase/supabase-js';

const PUBLIC_PATH_PREFIXES = [
  '/',
  '/auth/login',
  '/auth/callback',
  '/privacy',
  '/terms',
  '/people',
  '/library',
  '/inspiration',
  '/lists',
  '/spots'
];
const PUBLIC_EXACT_PATHS = ['/favicon.png', '/robots.txt'];

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT_PATHS.includes(pathname)) {
    return true;
  }

  if (pathname.startsWith('/_app/')) {
    return true;
  }

  if (pathname === '/') {
    return true;
  }

  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => prefix !== '/' && (pathname === prefix || pathname.startsWith(`${prefix}/`))
  );
}

function sanitizeNextPath(path: string | null) {
  if (!path || !path.startsWith('/')) {
    return '/';
  }

  if (path.startsWith('//')) {
    return '/';
  }

  return path;
}

export const handle: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;
  const isPublic = isPublicPath(pathname);

  if (!isSupabaseConfigured()) {
    event.locals.supabase = null;
    event.locals.user = null;

    if (!isPublic) {
      throw redirect(303, '/auth/login?config=missing');
    }

    return resolve(event);
  }

  const supabaseContext = createServerSupabaseClient(event);
  if (!supabaseContext) {
    event.locals.supabase = null;
    event.locals.user = null;
    return resolve(event);
  }

  event.locals.supabase = supabaseContext.client;

  const {
    data: { user }
  } = await event.locals.supabase.auth.getUser();

  event.locals.user = user ?? (env.DEV_BYPASS_USER_ID ? ({ id: env.DEV_BYPASS_USER_ID } as User) : null);

  if (!event.locals.user && !isPublic) {
    const next = sanitizeNextPath(`${pathname}${event.url.search}`);
    throw redirect(303, `/auth/login?next=${encodeURIComponent(next)}`);
  }

  return resolve(event);
};