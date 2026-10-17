create table if not exists public.portfolio_contact_messages (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(name) between 1 and 100),
 email text not null check (length(email) <= 254),
 topic text not null check (length(topic) <= 80),
 message text not null check (length(message) between 10 and 4000),
 status text not null default 'new' check (status in ('new','read','archived')),
 created_at timestamptz not null default now()
);
create table if not exists public.portfolio_contact_limits (
 bucket text primary key,
 window_started_at timestamptz not null default now(),
 attempts integer not null default 1
);
alter table public.portfolio_contact_messages enable row level security;
alter table public.portfolio_contact_limits enable row level security;
revoke all on public.portfolio_contact_messages,public.portfolio_contact_limits from public;
create index if not exists portfolio_contact_created on public.portfolio_contact_messages(created_at desc,id desc);
create or replace function public.portfolio_submit_contact(p_name text,p_email text,p_topic text,p_message text,p_bucket text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare total integer; receipt uuid;
begin
 insert into portfolio_contact_limits(bucket) values(p_bucket)
 on conflict(bucket) do update set
 attempts=case when portfolio_contact_limits.window_started_at < now()-interval '1 hour' then 1 else portfolio_contact_limits.attempts+1 end,
 window_started_at=case when portfolio_contact_limits.window_started_at < now()-interval '1 hour' then now() else portfolio_contact_limits.window_started_at end
 returning attempts into total;
 if total>5 then raise exception using errcode='PT429',message='Too many messages. Please try again later.';end if;
 insert into portfolio_contact_messages(name,email,topic,message) values(p_name,p_email,p_topic,p_message) returning id into receipt;
 return jsonb_build_object('id',receipt);
end;$$;
revoke execute on function public.portfolio_submit_contact(text,text,text,text,text) from public;
do $$ begin if exists(select 1 from pg_roles where rolname='service_role') then
 grant all on public.portfolio_contact_messages,public.portfolio_contact_limits to service_role;
 grant execute on function public.portfolio_submit_contact(text,text,text,text,text) to service_role;
end if;end $$;
notify pgrst,'reload schema';
