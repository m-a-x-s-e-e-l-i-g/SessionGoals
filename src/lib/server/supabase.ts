import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

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

export function createAdminSupabaseClient() {
	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!PUBLIC_SUPABASE_URL || !serviceRoleKey) return null;
	return createClient(PUBLIC_SUPABASE_URL, serviceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});
}
