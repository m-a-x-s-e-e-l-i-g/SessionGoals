create extension if not exists "pgcrypto";

create type goal_type as enum ('move', 'spot', 'inspiration');
create type goal_status as enum ('idea', 'want_to_try', 'training', 'landed', 'done', 'archived');
create type goal_list_type as enum ('training_plan', 'competition', 'wishlist', 'general');
create type goal_list_visibility as enum ('public', 'private');
create type user_role as enum ('athlete', 'teacher', 'athlete_teacher');

create table if not exists users (
  id text primary key,
  username text not null unique,
  display_name text not null,
  role user_role not null default 'athlete',
  teacher_id text references users(id) on delete set null,
  coaching_needs text[] not null default '{}',
  bio text,
  city text,
  country text,
  is_public boolean not null default true,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tags (
  id text primary key,
  name text not null unique,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists spots (
  id text primary key default ('spot-' || encode(gen_random_bytes(8), 'hex')),
  external_id text unique,
  name text not null,
  description text,
  city text,
  country text,
  lat double precision,
  lng double precision,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists spot_tags (
  spot_id text not null references spots(id) on delete cascade,
  tag_id text not null references tags(id) on delete cascade,
  primary key (spot_id, tag_id)
);

create table if not exists goals (
  id text primary key default ('goal-' || encode(gen_random_bytes(8), 'hex')),
  user_id text not null references users(id) on delete cascade,
  type goal_type not null,
  title text not null,
  description text,
  status goal_status not null default 'want_to_try',
  difficulty integer check (difficulty between 1 and 5),
  spot_id text references spots(id) on delete set null,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_user_id_idx on goals(user_id);
create index if not exists goals_status_idx on goals(status);

create table if not exists goal_tags (
  goal_id text not null references goals(id) on delete cascade,
  tag_id text not null references tags(id) on delete cascade,
  primary key (goal_id, tag_id)
);

create table if not exists goal_links (
  id text primary key default ('glink-' || encode(gen_random_bytes(8), 'hex')),
  goal_id text not null references goals(id) on delete cascade,
  url text not null,
  platform text,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists goal_lists (
  id text primary key default ('list-' || encode(gen_random_bytes(8), 'hex')),
  user_id text not null references users(id) on delete cascade,
  name text not null,
  description text,
  type goal_list_type not null default 'general',
  visibility goal_list_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goal_lists_user_id_idx on goal_lists(user_id);
create index if not exists goal_lists_visibility_idx on goal_lists(visibility);

create table if not exists goal_list_items (
  id text primary key default ('gli-' || encode(gen_random_bytes(8), 'hex')),
  list_id text not null references goal_lists(id) on delete cascade,
  goal_id text not null references goals(id) on delete cascade,
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  unique (list_id, goal_id),
  unique (list_id, position)
);

create table if not exists list_progress (
  id text primary key default ('progress-' || encode(gen_random_bytes(8), 'hex')),
  user_id text not null references users(id) on delete cascade,
  source_list_id text not null references goal_lists(id) on delete cascade,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_list_id)
);

create table if not exists list_progress_items (
  id text primary key default ('pi-' || encode(gen_random_bytes(8), 'hex')),
  progress_id text not null references list_progress(id) on delete cascade,
  goal_id text not null references goals(id) on delete cascade,
  done boolean not null default false,
  completed_at timestamptz,
  unique (progress_id, goal_id)
);

create table if not exists activities (
  id text primary key default ('activity-' || encode(gen_random_bytes(8), 'hex')),
  user_id text not null references users(id) on delete cascade,
  date date not null,
  duration integer check (duration is null or (duration between 5 and 480)),
  notes text,
  linked_goal_id text references goals(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists activities_user_id_date_idx on activities(user_id, date desc);

create table if not exists challenges (
  id text primary key default ('challenge-' || encode(gen_random_bytes(8), 'hex')),
  user_id text not null references users(id) on delete cascade,
  title text not null,
  description text,
  status goal_status not null default 'want_to_try',
  difficulty integer check (difficulty between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists challenge_spots (
  challenge_id text not null references challenges(id) on delete cascade,
  spot_id text not null references spots(id) on delete cascade,
  primary key (challenge_id, spot_id)
);

create table if not exists challenge_goals (
  challenge_id text not null references challenges(id) on delete cascade,
  goal_id text not null references goals(id) on delete cascade,
  primary key (challenge_id, goal_id)
);

create table if not exists challenge_tags (
  challenge_id text not null references challenges(id) on delete cascade,
  tag_id text not null references tags(id) on delete cascade,
  primary key (challenge_id, tag_id)
);

create table if not exists challenge_links (
  id text primary key default ('chlink-' || encode(gen_random_bytes(8), 'hex')),
  challenge_id text not null references challenges(id) on delete cascade,
  url text not null,
  platform text,
  title text,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists trg_spots_updated_at on spots;
create trigger trg_spots_updated_at
before update on spots
for each row execute function set_updated_at();

drop trigger if exists trg_goals_updated_at on goals;
create trigger trg_goals_updated_at
before update on goals
for each row execute function set_updated_at();

drop trigger if exists trg_goal_lists_updated_at on goal_lists;
create trigger trg_goal_lists_updated_at
before update on goal_lists
for each row execute function set_updated_at();

drop trigger if exists trg_list_progress_updated_at on list_progress;
create trigger trg_list_progress_updated_at
before update on list_progress
for each row execute function set_updated_at();

drop trigger if exists trg_challenges_updated_at on challenges;
create trigger trg_challenges_updated_at
before update on challenges
for each row execute function set_updated_at();

alter table users enable row level security;
alter table spots enable row level security;
alter table tags enable row level security;
alter table spot_tags enable row level security;
alter table goals enable row level security;
alter table goal_tags enable row level security;
alter table goal_links enable row level security;
alter table goal_lists enable row level security;
alter table goal_list_items enable row level security;
alter table list_progress enable row level security;
alter table list_progress_items enable row level security;
alter table activities enable row level security;
alter table challenges enable row level security;
alter table challenge_spots enable row level security;
alter table challenge_goals enable row level security;
alter table challenge_tags enable row level security;
alter table challenge_links enable row level security;

create policy users_public_read on users
for select using (
  is_public
  or id = auth.uid()::text
  or teacher_id = auth.uid()::text
  or id in (
    select u.teacher_id
    from users u
    where u.id = auth.uid()::text
      and u.teacher_id is not null
  )
);

create policy users_self_write on users
for all using (id = auth.uid()::text)
with check (id = auth.uid()::text);

create policy spots_read on spots
for select using (true);

create policy spots_write_authenticated on spots
for all using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy tags_read on tags
for select using (true);

create policy tags_write_authenticated on tags
for all using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy spot_tags_read on spot_tags
for select using (true);

create policy spot_tags_write_authenticated on spot_tags
for all using (auth.uid() is not null)
with check (auth.uid() is not null);

create policy goals_read on goals
for select using (user_id = auth.uid()::text or exists (
  select 1 from users u where u.id = goals.user_id and u.is_public
));

create policy goals_write_own on goals
for all using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

create policy goal_tags_read on goal_tags
for select using (exists (
  select 1 from goals g
  where g.id = goal_tags.goal_id
    and (g.user_id = auth.uid()::text or exists (
      select 1 from users u where u.id = g.user_id and u.is_public
    ))
));

create policy goal_tags_write_own on goal_tags
for all using (exists (
  select 1 from goals g where g.id = goal_tags.goal_id and g.user_id = auth.uid()::text
))
with check (exists (
  select 1 from goals g where g.id = goal_tags.goal_id and g.user_id = auth.uid()::text
));

create policy goal_links_read on goal_links
for select using (exists (
  select 1 from goals g
  where g.id = goal_links.goal_id
    and (g.user_id = auth.uid()::text or exists (
      select 1 from users u where u.id = g.user_id and u.is_public
    ))
));

create policy goal_links_write_own on goal_links
for all using (exists (
  select 1 from goals g where g.id = goal_links.goal_id and g.user_id = auth.uid()::text
))
with check (exists (
  select 1 from goals g where g.id = goal_links.goal_id and g.user_id = auth.uid()::text
));

create policy goal_lists_read on goal_lists
for select using (user_id = auth.uid()::text or visibility = 'public');

create policy goal_lists_write_own on goal_lists
for all using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

create policy goal_list_items_read on goal_list_items
for select using (exists (
  select 1 from goal_lists gl
  where gl.id = goal_list_items.list_id
    and (gl.user_id = auth.uid()::text or gl.visibility = 'public')
));

create policy goal_list_items_write_own on goal_list_items
for all using (exists (
  select 1 from goal_lists gl where gl.id = goal_list_items.list_id and gl.user_id = auth.uid()::text
))
with check (exists (
  select 1 from goal_lists gl where gl.id = goal_list_items.list_id and gl.user_id = auth.uid()::text
));

create policy list_progress_read_own on list_progress
for select using (user_id = auth.uid()::text);

create policy list_progress_write_own on list_progress
for all using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

create policy list_progress_items_read_own on list_progress_items
for select using (exists (
  select 1 from list_progress lp where lp.id = list_progress_items.progress_id and lp.user_id = auth.uid()::text
));

create policy list_progress_items_write_own on list_progress_items
for all using (exists (
  select 1 from list_progress lp where lp.id = list_progress_items.progress_id and lp.user_id = auth.uid()::text
))
with check (exists (
  select 1 from list_progress lp where lp.id = list_progress_items.progress_id and lp.user_id = auth.uid()::text
));

create policy activities_read on activities
for select using (user_id = auth.uid()::text or exists (
  select 1 from users u where u.id = activities.user_id and u.is_public
));

create policy activities_write_own on activities
for all using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

create policy challenges_read on challenges
for select using (user_id = auth.uid()::text or exists (
  select 1 from users u where u.id = challenges.user_id and u.is_public
));

create policy challenges_write_own on challenges
for all using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

create policy challenge_spots_read on challenge_spots
for select using (exists (
  select 1 from challenges c
  where c.id = challenge_spots.challenge_id
    and (c.user_id = auth.uid()::text or exists (
      select 1 from users u where u.id = c.user_id and u.is_public
    ))
));

create policy challenge_spots_write_own on challenge_spots
for all using (exists (
  select 1 from challenges c where c.id = challenge_spots.challenge_id and c.user_id = auth.uid()::text
))
with check (exists (
  select 1 from challenges c where c.id = challenge_spots.challenge_id and c.user_id = auth.uid()::text
));

create policy challenge_goals_read on challenge_goals
for select using (exists (
  select 1 from challenges c
  where c.id = challenge_goals.challenge_id
    and (c.user_id = auth.uid()::text or exists (
      select 1 from users u where u.id = c.user_id and u.is_public
    ))
));

create policy challenge_goals_write_own on challenge_goals
for all using (exists (
  select 1 from challenges c where c.id = challenge_goals.challenge_id and c.user_id = auth.uid()::text
))
with check (exists (
  select 1 from challenges c where c.id = challenge_goals.challenge_id and c.user_id = auth.uid()::text
));

create policy challenge_tags_read on challenge_tags
for select using (exists (
  select 1 from challenges c
  where c.id = challenge_tags.challenge_id
    and (c.user_id = auth.uid()::text or exists (
      select 1 from users u where u.id = c.user_id and u.is_public
    ))
));

create policy challenge_tags_write_own on challenge_tags
for all using (exists (
  select 1 from challenges c where c.id = challenge_tags.challenge_id and c.user_id = auth.uid()::text
))
with check (exists (
  select 1 from challenges c where c.id = challenge_tags.challenge_id and c.user_id = auth.uid()::text
));

create policy challenge_links_read on challenge_links
for select using (exists (
  select 1 from challenges c
  where c.id = challenge_links.challenge_id
    and (c.user_id = auth.uid()::text or exists (
      select 1 from users u where u.id = c.user_id and u.is_public
    ))
));

create policy challenge_links_write_own on challenge_links
for all using (exists (
  select 1 from challenges c where c.id = challenge_links.challenge_id and c.user_id = auth.uid()::text
))
with check (exists (
  select 1 from challenges c where c.id = challenge_links.challenge_id and c.user_id = auth.uid()::text
));
