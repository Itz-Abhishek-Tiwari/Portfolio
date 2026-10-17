create unique index if not exists portfolio_posts_published_slug
on public.portfolio_posts ((published->>'slug'))
where published is not null and archived=false;
