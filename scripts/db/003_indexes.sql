create index if not exists idx_posts_date on public.match_posts(date);
create index if not exists idx_posts_city on public.match_posts(city);
create index if not exists idx_reservations_post on public.match_reservations(post_id);
