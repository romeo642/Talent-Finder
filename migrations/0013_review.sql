create table if not exists photo_notes (
  listing_id text not null,
  position integer not null,
  note text not null default '',
  made_on text not null default '',
  sha text not null default '',
  primary key (listing_id, position)
);

create table if not exists review_flags (
  id text primary key,
  listing_id text not null,
  kind text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists appeals (
  id text primary key,
  listing_id text not null,
  user_id text not null,
  note text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table listings add column if not exists work_checked boolean not null default false;
alter table listings add column if not exists proof_added boolean not null default false;
alter table listings add column if not exists review_status text not null default 'clear';
