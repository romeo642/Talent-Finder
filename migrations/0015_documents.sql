alter table listings add column if not exists document_name text not null default '';
alter table user_contacts add column if not exists twitter text not null default '';

create table if not exists listing_documents (
  listing_id text primary key,
  name text not null,
  mime text not null,
  body text not null
);
