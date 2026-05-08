alter table goals
  add column if not exists source_goal_id text references goals(id);

create index if not exists goals_source_goal_id_idx on goals(source_goal_id);

create unique index if not exists goals_user_source_goal_id_unique
  on goals(user_id, source_goal_id)
  where source_goal_id is not null;
