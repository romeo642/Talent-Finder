alter table listings add column if not exists plan_id text not null default 'starter';
alter table listings add column if not exists plan_status text not null default 'trial';
alter table listings add column if not exists trial_started_at timestamptz;
alter table listings add column if not exists plan_expires_at timestamptz;
alter table listings add column if not exists boost_until timestamptz;
alter table listings add column if not exists boosts_used integer not null default 0;
alter table listings add column if not exists boosts_year integer not null default 0;
alter table listings add column if not exists language text not null default 'en';

create table if not exists listing_gallery (
  id text primary key,
  listing_id text not null,
  position integer not null,
  mime text not null,
  body text not null
);

create index if not exists listing_gallery_listing_idx on listing_gallery (listing_id, position);

create table if not exists payments (
  reference text primary key,
  user_id text not null,
  kind text not null,
  plan_id text,
  amount integer not null,
  currency text not null,
  status text not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table if not exists plan_settings (
  key text primary key,
  value text not null
);

create table if not exists plan_reminders (
  listing_id text not null,
  day integer not null,
  sent_at timestamptz not null default now(),
  primary key (listing_id, day)
);

create table if not exists hirer_plans (
  user_id text primary key,
  expires_at timestamptz not null,
  reference text not null
);
