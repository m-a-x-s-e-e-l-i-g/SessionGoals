create type activity_type as enum (
  'parkour',
  'running',
  'gym',
  'bouldering',
  'calisthenics',
  'mobility',
  'other'
);

alter table activities
add column activity_type activity_type not null default 'parkour';