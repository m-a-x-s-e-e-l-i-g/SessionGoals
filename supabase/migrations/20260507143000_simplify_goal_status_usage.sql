update public.goals
set status = case
  when status in ('done', 'landed') then 'done'::goal_status
  else 'want_to_try'::goal_status
end
where status <> case
  when status in ('done', 'landed') then 'done'::goal_status
  else 'want_to_try'::goal_status
end;

update public.challenges
set status = case
  when status in ('done', 'landed') then 'done'::goal_status
  else 'want_to_try'::goal_status
end
where status <> case
  when status in ('done', 'landed') then 'done'::goal_status
  else 'want_to_try'::goal_status
end;