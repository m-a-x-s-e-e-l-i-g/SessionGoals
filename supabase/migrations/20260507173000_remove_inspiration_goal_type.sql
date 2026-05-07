update public.goals
set type = 'move'
where type::text = 'inspiration';

alter table public.goals
  alter column type type text using type::text;

drop type public.goal_type;

create type public.goal_type as enum ('move', 'spot');

alter table public.goals
  alter column type type public.goal_type using type::public.goal_type;
