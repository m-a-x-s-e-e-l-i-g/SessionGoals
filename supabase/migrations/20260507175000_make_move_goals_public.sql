drop policy if exists goals_read on public.goals;
create policy goals_read on public.goals
for select using (
  type::text = 'move'
  or user_id = auth.uid()::text
  or exists (
    select 1 from public.users u
    where u.id = goals.user_id and u.is_public
  )
);

drop policy if exists goal_tags_read on public.goal_tags;
create policy goal_tags_read on public.goal_tags
for select using (
  exists (
    select 1 from public.goals g
    where g.id = goal_tags.goal_id
      and (
        g.type::text = 'move'
        or g.user_id = auth.uid()::text
        or exists (
          select 1 from public.users u
          where u.id = g.user_id and u.is_public
        )
      )
  )
);

drop policy if exists goal_links_read on public.goal_links;
create policy goal_links_read on public.goal_links
for select using (
  exists (
    select 1 from public.goals g
    where g.id = goal_links.goal_id
      and (
        g.type::text = 'move'
        or g.user_id = auth.uid()::text
        or exists (
          select 1 from public.users u
          where u.id = g.user_id and u.is_public
        )
      )
  )
);

drop policy if exists goal_subgoals_read on public.goal_subgoals;
create policy goal_subgoals_read on public.goal_subgoals
for select using (
  exists (
    select 1
    from public.goals g
    where g.id = goal_subgoals.parent_goal_id
      and (
        g.type::text = 'move'
        or g.user_id = auth.uid()::text
        or exists (
          select 1 from public.users u
          where u.id = g.user_id and u.is_public
        )
      )
  )
);
