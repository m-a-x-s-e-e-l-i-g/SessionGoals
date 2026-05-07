create table if not exists public.goal_subgoals (
  parent_goal_id text not null references public.goals(id) on delete cascade,
  child_goal_id text not null references public.goals(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (parent_goal_id, child_goal_id),
  constraint goal_subgoals_no_self check (parent_goal_id <> child_goal_id)
);

create index if not exists goal_subgoals_child_goal_id_idx
  on public.goal_subgoals(child_goal_id);

alter table public.goal_subgoals enable row level security;

create policy goal_subgoals_read on public.goal_subgoals
for select using (
  exists (
    select 1
    from public.goals g
    where g.id = goal_subgoals.parent_goal_id
      and (
        g.user_id = auth.uid()::text
        or exists (
          select 1 from public.users u
          where u.id = g.user_id and u.is_public
        )
      )
  )
);

create policy goal_subgoals_write_own on public.goal_subgoals
for all using (
  exists (
    select 1 from public.goals parent_goal
    where parent_goal.id = goal_subgoals.parent_goal_id
      and parent_goal.user_id = auth.uid()::text
  )
  and exists (
    select 1 from public.goals child_goal
    where child_goal.id = goal_subgoals.child_goal_id
      and child_goal.user_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1 from public.goals parent_goal
    where parent_goal.id = goal_subgoals.parent_goal_id
      and parent_goal.user_id = auth.uid()::text
  )
  and exists (
    select 1 from public.goals child_goal
    where child_goal.id = goal_subgoals.child_goal_id
      and child_goal.user_id = auth.uid()::text
  )
);
