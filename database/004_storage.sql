-- Private bucket for studio uploads (images and the résumé). Files are served through /api/media/<key>
-- with the server-only secret key, so no storage policies are granted to anon or authenticated users.
do $$ begin if exists(select 1 from information_schema.tables where table_schema='storage' and table_name='buckets') then
 insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('media','media',false,4194304,array['image/jpeg','image/png','image/webp','application/pdf'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
end if;end $$;
