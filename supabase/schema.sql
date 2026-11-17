-- Kareem Learning Explorer: the online part.
-- Grown-ups have accounts. Children do not: they belong to a grown-up and pick their picture on a device.
-- Teachers make classes with a join code. A parent adds their child to a class with that code,
-- and the teacher can then see and help with that child's learning.
-- This file is safe to run again and again (scripts/migrate.mjs runs it on every Vercel build).

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'parent' check (role in ('parent', 'teacher')),
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  join_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  name text not null,
  avatar text not null default '🌙',
  -- Sensory settings, learning profile, picked lessons and notes chosen by the grown-ups (src/lib/people.ts ChildProfile).
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per child per lesson: the quiet learning record grown-ups see (src/lib/progress.ts TopicRecord).
create table if not exists public.records (
  child_id uuid not null references public.children(id) on delete cascade,
  topic_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (child_id, topic_id)
);

create index if not exists children_owner on public.children(owner_id);
create index if not exists children_class on public.children(class_id);
create index if not exists classes_teacher on public.classes(teacher_id);

-- Who may see and help with a child: the grown-up who added them, or the teacher of their class.
create or replace function public.can_see_child(_child uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.children c
    left join public.classes k on k.id = c.class_id
    where c.id = _child and (c.owner_id = auth.uid() or k.teacher_id = auth.uid())
  );
$$;

-- The class a child is in right now (before a change), for the update rule below.
create or replace function public.class_of(_child uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select class_id from public.children where id = _child;
$$;

-- A parent puts their own child in a class using the teacher's join code. Returns the class name.
create or replace function public.join_class(_child uuid, _code text) returns text
language plpgsql security definer set search_path = public as $$
declare _class public.classes;
begin
  select * into _class from public.classes where join_code = upper(trim(_code));
  if _class.id is null then raise exception 'No class has that code.'; end if;
  update public.children set class_id = _class.id, updated_at = now()
    where id = _child and owner_id = auth.uid();
  if not found then raise exception 'You can only add your own children to a class.'; end if;
  return _class.name;
end;
$$;

-- Class names a parent can see (for their own children's classes).
create or replace function public.my_children_classes() returns table (id uuid, name text)
language sql stable security definer set search_path = public as $$
  select k.id, k.name from public.classes k
  where k.teacher_id = auth.uid()
     or exists (select 1 from public.children c where c.class_id = k.id and c.owner_id = auth.uid());
$$;

revoke all on function public.can_see_child(uuid) from public;
revoke all on function public.join_class(uuid, text) from public;
revoke all on function public.my_children_classes() from public;
revoke all on function public.class_of(uuid) from public;
grant execute on function public.class_of(uuid) to authenticated;
grant execute on function public.can_see_child(uuid) to authenticated;
grant execute on function public.join_class(uuid, text) to authenticated;
grant execute on function public.my_children_classes() to authenticated;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.children enable row level security;
alter table public.records enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "teacher owns class" on public.classes;
create policy "teacher owns class" on public.classes for all to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists "see children" on public.children;
create policy "see children" on public.children for select to authenticated using (public.can_see_child(id));
drop policy if exists "add own children" on public.children;
create policy "add own children" on public.children for insert to authenticated
  with check (owner_id = auth.uid() and (class_id is null or exists (select 1 from public.classes k where k.id = class_id and k.teacher_id = auth.uid())));
drop policy if exists "change children" on public.children;
create policy "change children" on public.children for update to authenticated
  using (public.can_see_child(id))
  with check (
    class_id is null
    or class_id is not distinct from public.class_of(id)
    or exists (select 1 from public.classes k where k.id = class_id and k.teacher_id = auth.uid())
  );
drop policy if exists "remove own children" on public.children;
create policy "remove own children" on public.children for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "child records" on public.records;
create policy "child records" on public.records for all to authenticated
  using (public.can_see_child(child_id)) with check (public.can_see_child(child_id));

grant select, insert, update, delete on public.profiles, public.classes, public.children, public.records to authenticated;
revoke all on public.profiles, public.classes, public.children, public.records from anon;

-- Earlier drafts of this file made these; they are not used.
drop table if exists public.assignments;
drop table if exists public.notes;
