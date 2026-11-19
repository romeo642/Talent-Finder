alter table account_admin add column if not exists staff boolean not null default false;

create table if not exists age_checks (
  user_id text primary key,
  confirmed_at timestamptz not null default now()
);

create table if not exists hire_requests (
  id text primary key,
  listing_id text not null,
  talent_user_id text not null,
  seeker_user_id text not null,
  note text not null,
  status text not null default 'pending',
  reveal_phone boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists hire_requests_talent_idx on hire_requests (talent_user_id, created_at desc);
create index if not exists hire_requests_seeker_idx on hire_requests (seeker_user_id, created_at desc);
