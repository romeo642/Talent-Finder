alter table listings add column if not exists tiktok text not null default '';

create table if not exists user_contacts (
  user_id text primary key,
  phone text not null default '',
  facebook text not null default '',
  instagram text not null default '',
  tiktok text not null default ''
);
