alter table account_admin add column if not exists role text not null default 'user';

update account_admin set role = 'admin' where staff = true and role = 'user';
