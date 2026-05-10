-- Remove the difficulty field from goals and challenges.
-- It was never well-used and adds noise to the UI.

alter table goals drop column if exists difficulty;
alter table challenges drop column if exists difficulty;
