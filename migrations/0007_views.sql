alter table listings add column if not exists views integer not null default 0;

create index if not exists listings_country_views_idx on listings (country_code, views desc);
