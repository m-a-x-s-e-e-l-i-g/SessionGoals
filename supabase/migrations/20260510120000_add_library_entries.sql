-- Add is_admin flag to users so admins can manage the permanent library
alter table users add column if not exists is_admin boolean not null default false;

-- Add is_library_entry flag to goals for permanent library moves
alter table goals add column if not exists is_library_entry boolean not null default false;

-- Library entries have no personal owner (user_id = null)
alter table goals alter column user_id drop not null;

-- Index to efficiently query library entries
create index if not exists goals_library_idx on goals(is_library_entry) where is_library_entry = true;

-- Rebuild the goals read policy to include library entries (readable by all)
-- and allow admins to read every goal regardless of privacy
drop policy if exists goals_read on goals;

create policy goals_read on goals
for select using (
  -- Permanent library entries are public to everyone
  is_library_entry = true
  -- Own personal goals are always visible
  or user_id = auth.uid()::text
  -- Goals from public profiles are visible
  or (user_id is not null and exists (
    select 1 from users u where u.id = goals.user_id and u.is_public
  ))
  -- Admins can see everything
  or exists (
    select 1 from users u where u.id = auth.uid()::text and u.is_admin = true
  )
);

-- Admins can insert / update / delete library entries (is_library_entry = true, user_id = null)
create policy goals_library_admin_write on goals
for all using (
  is_library_entry = true
  and exists (
    select 1 from users u where u.id = auth.uid()::text and u.is_admin = true
  )
)
with check (
  is_library_entry = true
  and exists (
    select 1 from users u where u.id = auth.uid()::text and u.is_admin = true
  )
);

-- goal_links: library entries' links are readable by everyone
drop policy if exists goal_links_read on goal_links;

create policy goal_links_read on goal_links
for select using (exists (
  select 1 from goals g
  where g.id = goal_links.goal_id
    and (
      g.is_library_entry = true
      or g.user_id = auth.uid()::text
      or (g.user_id is not null and exists (
        select 1 from users u where u.id = g.user_id and u.is_public
      ))
      or exists (
        select 1 from users u where u.id = auth.uid()::text and u.is_admin = true
      )
    )
));

-- goal_links: admins can write links for library entries
create policy goal_links_library_admin_write on goal_links
for all using (exists (
  select 1 from goals g
  where g.id = goal_links.goal_id
    and g.is_library_entry = true
    and exists (
      select 1 from users u where u.id = auth.uid()::text and u.is_admin = true
    )
))
with check (exists (
  select 1 from goals g
  where g.id = goal_links.goal_id
    and g.is_library_entry = true
    and exists (
      select 1 from users u where u.id = auth.uid()::text and u.is_admin = true
    )
));
