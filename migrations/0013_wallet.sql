create table if not exists wallet_entries (
  id text primary key,
  user_id text not null,
  country text not null,
  currency text not null,
  reference text not null,
  amount integer not null,
  status text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists wallet_entries_reference_status_idx on wallet_entries (reference, status);
