alter table listings add column if not exists visibility text not null default 'draft';
alter table listings add column if not exists consent_version integer not null default 0;
alter table listings add column if not exists on_boards boolean not null default false;
alter table listings add column if not exists tips boolean not null default false;
alter table listings add column if not exists hidden_reason text not null default '';

create table if not exists consents (
  id text primary key,
  user_id text not null,
  country text not null,
  version integer not null,
  public_ok boolean not null,
  own_work boolean not null,
  boards boolean not null,
  tips boolean not null,
  language text not null,
  created_at timestamptz not null default now()
);

create index if not exists consents_user_idx on consents (user_id, created_at desc);

create table if not exists deletion_requests (
  id text primary key,
  user_id text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists profile_reports (
  id text primary key,
  listing_id text not null,
  reason text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists review_decisions (
  id text primary key,
  listing_id text not null,
  reviewer text not null,
  outcome text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists breach_log (
  id text primary key,
  country text not null,
  what text not null,
  people integer not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists admin_views (
  id text primary key,
  staff text not null,
  subject text not null,
  created_at timestamptz not null default now()
);
