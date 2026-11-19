create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  skill text not null,
  country text not null,
  place text not null,
  years int not null default 1,
  about text not null,
  photo_url text,
  social text,
  created_at timestamptz not null default now(),
  unique (user_id)
);
alter table public.profiles enable row level security;
drop policy if exists "Anyone can read profiles" on public.profiles;
create policy "Anyone can read profiles" on public.profiles for select to anon, authenticated using (true);
drop policy if exists "Users insert their own profile" on public.profiles;
create policy "Users insert their own profile" on public.profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile" on public.profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table public.profiles drop constraint if exists profiles_limits;
alter table public.profiles add constraint profiles_limits check (
  char_length(display_name) between 2 and 80 and char_length(skill) between 2 and 60 and char_length(place) between 2 and 120
  and char_length(about) between 40 and 1500 and years between 0 and 60
  and country in ('Ghana','Zambia')
  and (photo_url is null or char_length(photo_url) < 350000)
  and (social is null or social = '' or social ~ '^https://'));
alter table public.profiles add column if not exists hidden boolean not null default false;
alter table public.profiles add column if not exists msg_facebook text not null default '';
alter table public.profiles add column if not exists msg_instagram text not null default '';
alter table public.profiles add column if not exists msg_tiktok text not null default '';
alter table public.profiles add column if not exists msg_x text not null default '';
create table if not exists public.moderators (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.moderators enable row level security;
drop policy if exists "See own moderator row" on public.moderators;
create policy "See own moderator row" on public.moderators for select to authenticated using (user_id = auth.uid());
drop policy if exists "Anyone can read profiles" on public.profiles;
create policy "Anyone can read profiles" on public.profiles for select to anon, authenticated
  using (hidden = false or auth.uid() = user_id or exists (select 1 from public.moderators m where m.user_id = auth.uid()));
drop policy if exists "Users delete their own profile" on public.profiles;
create policy "Users delete their own profile" on public.profiles for delete to authenticated using (auth.uid() = user_id);
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  profile_user_id uuid not null,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
drop policy if exists "Signed-in people can report" on public.reports;
create policy "Signed-in people can report" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
drop policy if exists "Moderators read reports" on public.reports;
create policy "Moderators read reports" on public.reports for select to authenticated
  using (exists (select 1 from public.moderators m where m.user_id = auth.uid()));
drop policy if exists "Moderators hide profiles" on public.profiles;
create policy "Moderators hide profiles" on public.profiles for update to authenticated
  using (exists (select 1 from public.moderators m where m.user_id = auth.uid()))
  with check (exists (select 1 from public.moderators m where m.user_id = auth.uid()));
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Sign in first'; end if;
  delete from public.reports where reporter_id = me or profile_user_id = me;
  delete from public.messages where sender_id = me or talent_user_id = me;
  delete from public.work_items where user_id = me;
  delete from public.profiles where user_id = me;
  delete from auth.users where id = me;
end;
$$;
grant execute on function public.delete_my_account() to authenticated;
create or replace function public.moderate_profile()
returns trigger language plpgsql as $func$
declare blob text;
begin
  blob := lower(coalesce(new.display_name, '') || ' ' || coalesce(new.skill, '') || ' ' || coalesce(new.place, '') || ' ' || coalesce(new.about, '') || ' ' || coalesce(new.social, '') || ' ' || coalesce(new.msg_facebook, '') || ' ' || coalesce(new.msg_instagram, '') || ' ' || coalesce(new.msg_tiktok, '') || ' ' || coalesce(new.msg_x, ''));
  if blob ~ '(nurse|nanny|veterinar|doctor|patient|midwife|childcare|babysit|passport|identity card|ghana card|porn|nude|\mxxx\M)' then
    raise exception 'Automatic check: this listing is not allowed.';
  end if;
  if blob ~ '[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}' then
    raise exception 'Automatic check: do not put an email address on the public profile.';
  end if;
  if blob ~ '[0-9]([ -]?[0-9]){9,}' then
    raise exception 'Automatic check: do not put a phone number on the public profile.';
  end if;
  if new.photo_url is null or new.photo_url !~ '^data:image/jpeg' or char_length(new.photo_url) < 800 then
    raise exception 'Automatic check: upload a photo of the finished work.';
  end if;
  return new;
end;
$func$;
drop trigger if exists moderate_profile_trigger on public.profiles;
create trigger moderate_profile_trigger
before insert or update of display_name, skill, place, about, social, photo_url, msg_facebook, msg_instagram, msg_tiktok, msg_x on public.profiles
for each row execute function public.moderate_profile();
create table if not exists public.work_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('photo', 'note')),
  title text not null,
  body text not null default '',
  photo_url text,
  created_at timestamptz not null default now()
);
alter table public.work_items enable row level security;
drop policy if exists "Read work items" on public.work_items;
create policy "Read work items" on public.work_items for select to anon, authenticated
  using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.user_id = work_items.user_id and p.hidden = false));
drop policy if exists "Add own work items" on public.work_items;
create policy "Add own work items" on public.work_items for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Remove own work items" on public.work_items;
create policy "Remove own work items" on public.work_items for delete to authenticated using (auth.uid() = user_id);
create or replace function public.moderate_work_item()
returns trigger language plpgsql as $func$
declare blob text;
begin
  blob := lower(coalesce(new.title, '') || ' ' || coalesce(new.body, ''));
  if blob ~ '(nurse|nanny|veterinar|doctor|patient|midwife|childcare|babysit|passport|identity card|ghana card|porn|nude|\mxxx\M)' then
    raise exception 'Automatic check: this work record is not allowed.';
  end if;
  if blob ~ '[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}' or blob ~ '[0-9]([ -]?[0-9]){9,}' then
    raise exception 'Automatic check: do not put an email or a phone number on a work record.';
  end if;
  if new.kind = 'photo' and (new.photo_url is null or new.photo_url !~ '^data:image/jpeg' or char_length(new.photo_url) < 800) then
    raise exception 'Automatic check: add a photo of your own work.';
  end if;
  if new.kind = 'photo' and (select count(*) from public.work_items w where w.user_id = new.user_id and w.kind = 'photo' and w.id is distinct from new.id) >= 4 then
    raise exception 'You can keep up to 4 photos of your work.';
  end if;
  return new;
end;
$func$;
drop trigger if exists moderate_work_item_trigger on public.work_items;
create trigger moderate_work_item_trigger
before insert or update on public.work_items
for each row execute function public.moderate_work_item();
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
insert into public.admins (user_id)
select user_id from public.moderators
on conflict do nothing;
alter table public.admins enable row level security;
create or replace function public.is_admin()
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    return false;
  end if;
  return exists (select 1 from public.admins where user_id = auth.uid());
end;
$$;
grant execute on function public.is_admin() to anon, authenticated;
drop policy if exists "See own admin row" on public.admins;
create policy "See own admin row" on public.admins for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create or replace function public.grant_admin(target_email text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_admin() then raise exception 'Admin code required'; end if;
  select id into uid from auth.users where lower(email) = lower(target_email);
  if uid is null then raise exception 'No account with that email'; end if;
  insert into public.admins (user_id) values (uid) on conflict do nothing;
end;
$$;
create or replace function public.revoke_admin(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admin code required'; end if;
  if target = auth.uid() then raise exception 'You cannot remove your own admin role'; end if;
  delete from public.admins where user_id = target;
end;
$$;
grant execute on function public.grant_admin(text) to authenticated;
grant execute on function public.revoke_admin(uuid) to authenticated;
drop policy if exists "Moderators hide profiles" on public.profiles;
drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Moderators read reports" on public.reports;
create policy "Admins read reports" on public.reports for select to authenticated using (public.is_admin());
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  talent_user_id uuid not null,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  check (char_length(body) between 2 and 500)
);
alter table public.messages enable row level security;
drop policy if exists "Send a message" on public.messages;
create policy "Send a message" on public.messages for insert to authenticated
  with check (auth.uid() = sender_id and sender_id <> talent_user_id);
drop policy if exists "Read own messages" on public.messages;
create policy "Read own messages" on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = talent_user_id or public.is_admin());
drop policy if exists "Admins remove messages" on public.messages;
create policy "Admins remove messages" on public.messages for delete to authenticated using (public.is_admin());
create or replace function public.moderate_message()
returns trigger language plpgsql as $func$
begin
  if lower(new.body) ~ '(porn|nude|passport|identity card|ghana card)' then
    raise exception 'Automatic check: this message is not allowed.';
  end if;
  if new.body ~ '[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}' or new.body ~ '[0-9]([ -]?[0-9]){9,}' then
    raise exception 'Automatic check: do not put an email or a phone number in a message.';
  end if;
  return new;
end;
$func$;
drop trigger if exists moderate_message_trigger on public.messages;
create trigger moderate_message_trigger
before insert or update on public.messages
for each row execute function public.moderate_message();
alter table public.admins add column if not exists role text;
update public.admins set role = 'owner' where role is null;
alter table public.admins alter column role set default 'reviewer';
alter table public.admins alter column role set not null;
alter table public.admins drop constraint if exists admins_role_check;
alter table public.admins add constraint admins_role_check check (role in ('reviewer', 'admin', 'owner'));
create or replace function public.is_admin()
returns boolean language plpgsql stable security definer set search_path = public as $$
declare r text;
begin
  if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then return false; end if;
  select role into r from public.admins where user_id = auth.uid();
  return r in ('admin', 'owner');
end;
$$;
create or replace function public.is_owner()
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then return false; end if;
  return exists (select 1 from public.admins where user_id = auth.uid() and role = 'owner');
end;
$$;
create or replace function public.can_review()
returns boolean language plpgsql stable security definer set search_path = public as $$
declare r text;
begin
  select role into r from public.admins where user_id = auth.uid();
  if r = 'reviewer' then return true; end if;
  if r in ('admin', 'owner') and coalesce(auth.jwt() ->> 'aal', '') = 'aal2' then return true; end if;
  return false;
end;
$$;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.can_review() to authenticated;
drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles" on public.profiles for update to authenticated
  using (public.can_review()) with check (public.can_review());
drop policy if exists "Admins read reports" on public.reports;
create policy "Admins read reports" on public.reports for select to authenticated using (public.can_review());
create or replace function public.grant_role(target_email text, next_role text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if next_role not in ('reviewer', 'admin', 'owner') then raise exception 'Unknown role'; end if;
  if next_role = 'reviewer' then
    if not public.is_admin() then raise exception 'Admin code required'; end if;
  elsif not public.is_owner() then
    raise exception 'Only the owner can grant an admin or an owner';
  end if;
  select id into uid from auth.users where lower(email) = lower(target_email);
  if uid is null then raise exception 'No account with that email'; end if;
  insert into public.admins (user_id, role) values (uid, next_role)
  on conflict (user_id) do update set role = excluded.role;
end;
$$;
create or replace function public.revoke_role(target_email text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid;
declare current_role text;
begin
  select id into uid from auth.users where lower(email) = lower(target_email);
  if uid is null then raise exception 'No account with that email'; end if;
  if uid = auth.uid() then raise exception 'You cannot remove your own role'; end if;
  select role into current_role from public.admins where user_id = uid;
  if current_role is null then raise exception 'That account has no staff role'; end if;
  if public.is_owner() then
    delete from public.admins where user_id = uid;
    return;
  end if;
  if public.is_admin() and current_role = 'reviewer' then
    delete from public.admins where user_id = uid;
    return;
  end if;
  raise exception 'You cannot remove that role';
end;
$$;
grant execute on function public.grant_role(text, text) to authenticated;
grant execute on function public.revoke_role(text) to authenticated;
-- After you sign up, make yourself the owner (replace the email), then sign in and set up the admin code:
-- insert into public.admins (user_id, role) select id, 'owner' from auth.users where email = 'you@example.com' on conflict (user_id) do update set role = 'owner';
