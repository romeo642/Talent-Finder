create table if not exists account_admin (
  user_id text primary key,
  verified boolean not null default false,
  removed boolean not null default false,
  note text not null default '',
  updated_at timestamptz not null default now()
);
