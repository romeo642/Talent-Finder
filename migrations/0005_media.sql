create table if not exists listing_photos (
  listing_id text primary key,
  mime text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

create table if not exists pending_photos (
  reference text primary key,
  mime text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists submit_attempts (
  user_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists submit_attempts_user_idx on submit_attempts (user_id, created_at);
