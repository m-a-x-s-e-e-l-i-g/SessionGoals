create or replace function ensure_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, username, display_name, joined_at)
  values (
    new.id::text,
    coalesce(new.raw_user_meta_data ->> 'user_name', split_part(coalesce(new.email, new.id::text), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, new.id::text), '@', 1)),
    now()
  )
  on conflict (id) do update
    set username = excluded.username,
        display_name = excluded.display_name,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure ensure_user_profile();

insert into public.tags (id, name, category)
values
  ('tag-vault', 'vault', 'movement'),
  ('tag-precision', 'precision', 'movement'),
  ('tag-balance', 'balance', 'movement'),
  ('tag-rail', 'rail', 'spot'),
  ('tag-line', 'line', 'session')
on conflict (id) do nothing;
