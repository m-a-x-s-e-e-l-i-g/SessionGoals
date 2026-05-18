-- Support goals created only for list curation without surfacing them as personal goals.
alter table goals
  add column if not exists is_list_only boolean not null default false;

create index if not exists goals_user_list_only_idx
  on goals(user_id, is_list_only);
