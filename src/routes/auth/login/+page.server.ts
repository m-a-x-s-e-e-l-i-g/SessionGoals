import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function sanitizeNextPath(path: string | null) {
  if (!path || !path.startsWith('/')) {
    return '/';
  }

  if (path.startsWith('//')) {
    return '/';
  }

  return path;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) {
    throw redirect(303, '/');
  }

  return {
    next: sanitizeNextPath(url.searchParams.get('next')),
    missingConfig: url.searchParams.get('config') === 'missing',
    urlError: url.searchParams.get('error') ?? ''
  };
};

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    if (!locals.supabase) {
      return fail(500, {
        error: 'Supabase is not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.'
      });
    }

    const form = await request.formData();
    const next = sanitizeNextPath((form.get('next') as string) || url.searchParams.get('next'));
    const callbackUrl = new URL('/auth/callback', url.origin);
    callbackUrl.searchParams.set('next', next);

    const { data, error } = await locals.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          prompt: 'select_account'
        }
      }
    });

    if (error || !data.url) {
      return fail(400, {
        error: error?.message ?? 'Unable to start Google sign-in.'
      });
    }

    throw redirect(303, data.url);
  }
};