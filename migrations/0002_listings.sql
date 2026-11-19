create table if not exists listings (
  id text primary key,
  user_id text not null unique,
  country_code text not null,
  country_name text not null,
  region_code text not null,
  region_name text not null,
  town_code text not null,
  town_name text not null,
  community_code text not null,
  community_name text not null,
  skill_id text not null,
  skill_name text not null,
  years integer not null,
  display_name text not null,
  phone text not null,
  whatsapp text,
  email text,
  contact_active boolean not null default true,
  experience text not null,
  photo text not null,
  currency text not null,
  fee_label text not null,
  pay_reference text not null unique,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists listings_browse_idx on listings (country_code, region_code, skill_id);
create index if not exists listings_town_idx on listings (town_code);

create table if not exists id_counters (
  place_key text primary key,
  n integer not null
);

create table if not exists pending_listings (
  reference text primary key,
  user_id text not null,
  payload text not null,
  created_at timestamptz not null default now()
);
