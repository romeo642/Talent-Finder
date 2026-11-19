alter table payments add column if not exists country text not null default '';
alter table payments add column if not exists provider text not null default 'paystack';
alter table payments add column if not exists display_name text not null default '';
alter table payments add column if not exists language text not null default 'en';

create table if not exists payment_events (
  id text primary key,
  reference text not null,
  event text not null,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_reference_idx on payment_events (reference, created_at);
