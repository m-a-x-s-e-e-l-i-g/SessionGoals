import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function sanitizeNextPath(path: string | null) {
  if (!path || !path.startsWith('/')) {
    return '/';
  }

  if (path.startsWith('//')) {
    return '/';
  }

  return path;
}

export const GET: RequestHandler = async ({ locals, url }) => {
  const code = url.searchParams.get('code');
  const next = sanitizeNextPath(url.searchParams.get('next'));

  if (!locals.supabase || !code) {
    throw redirect(303, '/auth/login?error=oauth_callback');
  }

  const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
  if (error) {
    throw redirect(303, '/auth/login?error=oauth_exchange');
  }

  throw redirect(303, next);
};