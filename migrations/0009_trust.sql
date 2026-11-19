create table if not exists job_confirms (
  token text primary key,
  listing_id text not null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists job_confirms_listing_idx on job_confirms (listing_id);

create table if not exists vouches (
  id text primary key,
  listing_id text not null,
  kind text not null,
  org_name text not null,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists vouches_listing_idx on vouches (listing_id);

create table if not exists practical_tests (
  id text primary key,
  listing_id text not null,
  skill_name text not null,
  status text not null default 'pending',
  token text not null unique,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists practical_tests_listing_idx on practical_tests (listing_id);

create table if not exists test_photos (
  test_id text primary key,
  mime text not null,
  body text not null
);
