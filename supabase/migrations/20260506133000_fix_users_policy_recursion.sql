create or replace function get_current_user_teacher_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select teacher_id
  from public.users
  where id = auth.uid()::text
  limit 1;
$$;

drop policy if exists users_public_read on users;

create policy users_public_read on users
for select using (
  is_public
  or id = auth.uid()::text
  or teacher_id = auth.uid()::text
  or id = get_current_user_teacher_id()
);
