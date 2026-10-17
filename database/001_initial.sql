-- PostgreSQL 16+; also compatible with Supabase PostgreSQL.
-- Content is seeded separately, never inside schema migrations.
create table if not exists public.portfolio_content (
 id text primary key,
 draft jsonb not null,
 published jsonb not null,
 revision bigint not null default 1 check (revision >= 1),
 updated_at timestamptz not null default now()
);
create table if not exists public.portfolio_github_cache (
 id text primary key,
 payload jsonb not null,
 fetched_at bigint not null
);
create table if not exists public.portfolio_posts (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 draft jsonb not null,
 published jsonb,
 revision bigint not null default 1 check (revision >= 1),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 published_at timestamptz,
 archived boolean not null default false
);
alter table public.portfolio_content enable row level security;
alter table public.portfolio_github_cache enable row level security;
alter table public.portfolio_posts enable row level security;
revoke all on public.portfolio_content,public.portfolio_github_cache,public.portfolio_posts from public;

create or replace function public.portfolio_save_content(p_content jsonb,p_initial jsonb,p_revision bigint,p_publish boolean)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare row_record portfolio_content%rowtype;
begin
 if p_revision=0 then
  insert into portfolio_content(id,draft,published,revision) values('main',p_content,case when p_publish then p_content else p_initial end,1)
  on conflict do nothing returning * into row_record;
 else
  update portfolio_content set draft=p_content,published=case when p_publish then p_content else published end,revision=revision+1,updated_at=now()
  where id='main' and revision=p_revision returning * into row_record;
 end if;
 if row_record.id is null then raise sqlstate 'PT409' using message='A newer draft exists. Reload the latest draft before saving.';end if;
 return jsonb_build_object('revision',row_record.revision,'updatedAt',row_record.updated_at);
end $$;

create or replace function public.portfolio_save_post(p_id uuid,p_slug text,p_content jsonb,p_revision bigint,p_publish boolean)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare row_record portfolio_posts%rowtype;
begin
 if p_revision=0 then
  insert into portfolio_posts(id,slug,draft,published,revision,published_at)
  values(p_id,p_slug,p_content,case when p_publish then p_content else null end,1,case when p_publish then now() else null end)
  on conflict do nothing returning * into row_record;
 else
  update portfolio_posts set slug=p_slug,draft=p_content,published=case when p_publish then p_content else published end,
   revision=revision+1,updated_at=now(),published_at=case when p_publish then coalesce(published_at,now()) else published_at end,archived=false
  where id=p_id and revision=p_revision returning * into row_record;
 end if;
 if row_record.id is null then raise sqlstate 'PT409' using message='This post changed in another session, or the slug is already used. Reload or choose another slug.';end if;
 return jsonb_build_object('id',row_record.id,'revision',row_record.revision,'updatedAt',row_record.updated_at,'publishedAt',row_record.published_at);
exception when unique_violation then raise sqlstate 'PT409' using message='This slug is already used. Choose a different slug.';
end $$;

create or replace function public.portfolio_set_post_state(p_id uuid,p_revision bigint,p_action text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare row_record portfolio_posts%rowtype;
begin
 if p_action not in ('unpublish','archive','restore') then raise sqlstate 'PT400' using message='Invalid action';end if;
 update portfolio_posts set published=case when p_action='unpublish' then null else published end,
  archived=case when p_action='archive' then true when p_action='restore' then false else archived end,
  updated_at=now(),revision=revision+1
 where id=p_id and revision=p_revision returning * into row_record;
 if row_record.id is null then raise sqlstate 'PT409' using message='This post changed in another session. Reload before trying again.';end if;
 return jsonb_build_object('id',row_record.id,'revision',row_record.revision,'updatedAt',row_record.updated_at);
end $$;
revoke execute on function portfolio_save_content(jsonb,jsonb,bigint,boolean) from public;
revoke execute on function portfolio_save_post(uuid,text,jsonb,bigint,boolean) from public;
revoke execute on function portfolio_set_post_state(uuid,bigint,text) from public;
-- Supabase service-role grants; local grants are applied by the setup script.
do $$ begin
 if exists(select 1 from pg_roles where rolname='service_role') then
  grant all on portfolio_content,portfolio_github_cache,portfolio_posts to service_role;
  grant execute on function portfolio_save_content(jsonb,jsonb,bigint,boolean),portfolio_save_post(uuid,text,jsonb,bigint,boolean),portfolio_set_post_state(uuid,bigint,text) to service_role;
 end if;
end $$;
