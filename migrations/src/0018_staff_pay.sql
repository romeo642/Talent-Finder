create table if not exists staff_totp (
  user_id text primary key,
  secret text not null,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists staff_sessions (
  id text primary key,
  user_id text not null,
  expires_at timestamptz not null
);

create table if not exists paystack_keys (
  id text primary key,
  public_key text not null default '',
  secret_key text not null default '',
  updated_at timestamptz not null default now()
);
