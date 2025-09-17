alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.match_posts enable row level security;
alter table public.match_reservations enable row level security;

create policy "teams_public_select" on public.teams for select using ( true );
create policy "teams_owner_write" on public.teams for all using ( owner_id = auth.uid() );

create policy "profiles_self_select" on public.profiles for select using ( auth.uid() = id );
create policy "profiles_self_upsert" on public.profiles for insert with check ( auth.uid() = id );
create policy "profiles_self_update" on public.profiles for update using ( auth.uid() = id );

create policy "posts_public_select" on public.match_posts for select using ( true );
create policy "posts_author_write" on public.match_posts for all using (
  (select owner_id from public.teams t where t.id = author_team_id) = auth.uid()
);

create policy "reservations_visible_to_author_or_requester" on public.match_reservations for select using (
  (select owner_id from public.teams t join public.match_posts p on p.author_team_id = t.id where p.id = post_id) = auth.uid()
  or (select owner_id from public.teams t2 where t2.id = requester_team_id) = auth.uid()
);
create policy "reservations_requester_insert" on public.match_reservations for insert with check (
  (select owner_id from public.teams t where t.id = requester_team_id) = auth.uid()
);
create policy "reservations_author_update" on public.match_reservations for update using (
  (select owner_id from public.teams t join public.match_posts p on p.author_team_id = t.id where p.id = post_id) = auth.uid()
);
