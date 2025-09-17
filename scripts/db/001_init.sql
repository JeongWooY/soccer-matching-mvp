create extension if not exists pgcrypto;
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  level text,
  owner_id uuid references auth.users(id) on delete set null
);
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  region text,
  level text,
  team_id uuid references public.teams(id)
);
create table if not exists public.match_posts (
  id uuid primary key default gen_random_uuid(),
  author_team_id uuid references public.teams(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  venue text not null,
  city text,
  level text,
  fee_split text,
  openchat_url text,
  status text default 'open'
);
create table if not exists public.match_reservations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.match_posts(id) on delete cascade,
  requester_team_id uuid references public.teams(id) on delete cascade,
  message text,
  status text default 'requested'
);
