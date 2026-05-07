alter table if exists public.spots
  drop column if exists lat,
  drop column if exists lng,
  drop column if exists image_url;
