import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

export function isSupabaseConfigured() {
	return Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY);
}

export function createServerSupabaseClient(event: RequestEvent) {
	if (!isSupabaseConfigured()) {
		return null;
	}

	const client = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookies) => {
				for (const { name, value, options } of cookies) {
					event.cookies.set(name, value, {
						path: '/',
						...(options as CookieOptions)
					});
				}
			}
		}
	});

	return {
		client
	};
}
