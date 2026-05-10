-- Change the source_goal_id FK to ON DELETE SET NULL so that deleting a goal
-- that others have adopted doesn't block the delete. Adopted copies will simply
-- lose their source link and become independent goals.

alter table goals
  drop constraint if exists goals_source_goal_id_fkey;

alter table goals
  add constraint goals_source_goal_id_fkey
    foreign key (source_goal_id)
    references goals(id)
    on delete set null;
