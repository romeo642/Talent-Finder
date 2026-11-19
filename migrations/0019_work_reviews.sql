create table if not exists work_reviews (
  id text primary key,
  listing_id text not null,
  author_id text not null,
  author_name text not null,
  stars int not null,
  body text not null,
  visible boolean not null default false,
  created_at timestamptz not null default now(),
  unique (listing_id, author_id)
);

create index if not exists work_reviews_listing_idx on work_reviews (listing_id, visible, created_at desc);
