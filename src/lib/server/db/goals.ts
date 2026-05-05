// Supabase-backed goals repository (future).
// When Supabase is connected, move the logic from src/lib/data/goals.ts here
// and use the `supabase` client to query the `goals` table.
//
// import { supabase } from '../supabase';
//
// export async function getGoals(userId: string) {
//   const { data, error } = await supabase
//     .from('goals')
//     .select('*, goal_tags(tag_id, tags(*))')
//     .eq('user_id', userId);
//   if (error) throw error;
//   return data;
// }

export {};
