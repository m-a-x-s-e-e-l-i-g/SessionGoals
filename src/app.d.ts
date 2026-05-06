import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { AppStateSnapshot } from '$lib/types/appState';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient | null;
      user: User | null;
    }

    interface PageData {
      user: User | null;
      appState: AppStateSnapshot;
    }
  }
}

export {};