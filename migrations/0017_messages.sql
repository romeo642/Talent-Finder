create table if not exists messages (
  id text primary key,
  request_id text not null,
  sender_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_request_idx on messages (request_id, created_at);
