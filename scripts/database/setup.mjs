import { Client } from 'pg';
import { createHmac,randomBytes } from 'node:crypto';
import { mkdir,readFile,writeFile,open,readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),runtime=path.join(root,'.sites-runtime'),database='port_abhishek_dev',role='port_abhishek_api';
await mkdir(runtime,{recursive:true,mode:0o700});
const admin=new Client({connectionString:process.env.PORTFOLIO_SETUP_DATABASE_URL||'postgresql:///postgres?host=/tmp'});await admin.connect();
const ident=s=>'"'+s.replaceAll('"','""')+'"';
if(!(await admin.query('select 1 from pg_database where datname=$1',[database])).rowCount)await admin.query('create database '+ident(database));
if(!(await admin.query('select 1 from pg_roles where rolname=$1',[role])).rowCount)await admin.query('create role '+ident(role)+' nologin');
const current=(await admin.query('select current_user as name')).rows[0].name;await admin.query('grant '+ident(role)+' to '+ident(current));await admin.end();
const dbUrl='postgresql://'+encodeURIComponent(current)+'@/'+database+'?host=%2Ftmp';
const db=new Client({connectionString:dbUrl});await db.connect();await db.query('create table if not exists public.portfolio_schema_migrations(version text primary key, applied_at timestamptz not null default now())');for(const filename of (await readdir(path.join(root,'database'))).filter(f=>f.endsWith('.sql')).sort()){if((await db.query('select 1 from public.portfolio_schema_migrations where version=$1',[filename])).rowCount)continue;await db.query('begin');try{await db.query(await readFile(path.join(root,'database',filename),'utf8'));await db.query('insert into public.portfolio_schema_migrations(version) values($1)',[filename]);await db.query('commit');}catch(error){await db.query('rollback');throw error;}}
for(const table of ['portfolio_content','portfolio_github_cache','portfolio_posts','portfolio_contact_messages','portfolio_contact_limits']){
 await db.query('grant all on public.'+table+' to '+ident(role));
 if(!(await db.query('select 1 from pg_policies where tablename=$1 and policyname=$2',[table,'local_server_only'])).rowCount)await db.query('create policy local_server_only on public.'+table+' to '+ident(role)+' using (true) with check (true)');
}
await db.query('grant usage on schema public to '+ident(role));await db.query('grant execute on function public.portfolio_save_content(jsonb,jsonb,bigint,boolean),public.portfolio_save_post(uuid,text,jsonb,bigint,boolean),public.portfolio_set_post_state(uuid,bigint,text),public.portfolio_submit_contact(text,text,text,text,text) to '+ident(role));
try{const backup=JSON.parse(await readFile(path.join(runtime,'d1-migration-backup.json'),'utf8'));await db.query('insert into portfolio_content(id,draft,published,revision,updated_at) values($1,$2,$3,$4,$5) on conflict do nothing',['main',backup.content,backup.published,Math.max(1,backup.revision),backup.updatedAt||new Date().toISOString()]);}catch(error){if(error.code!=='ENOENT')throw error;}
await db.query("notify pgrst,'reload schema'");await db.end();
let config;try{config=JSON.parse(await readFile(path.join(runtime,'database.json'),'utf8'));}catch{const secret=randomBytes(48).toString('base64url'),header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),payload=Buffer.from(JSON.stringify({role,iss:'portfolio-local',iat:Math.floor(Date.now()/1000)})).toString('base64url'),unsigned=header+'.'+payload;config={databaseUrl:dbUrl,apiUrl:'http://127.0.0.1:54380',apiKey:unsigned+'.'+createHmac('sha256',secret).update(unsigned).digest('base64url'),jwtSecret:secret};await writeFile(path.join(runtime,'database.json'),JSON.stringify(config),{mode:0o600});}
const conf=path.join(runtime,'postgrest.conf');await writeFile(conf,['db-uri = '+JSON.stringify(config.databaseUrl),'db-schemas = "public"','db-config = false','jwt-secret = '+JSON.stringify(config.jwtSecret),'server-host = "127.0.0.1"','server-port = 54380','db-pool = 4','db-max-rows = 100','log-level = "warn"'].join('\n'),{mode:0o600});
let healthy=false;try{const r=await fetch(config.apiUrl+'/portfolio_content?select=id',{headers:{Authorization:'Bearer '+config.apiKey}});healthy=r.ok;}catch{}
if(!healthy){const log=await open(path.join(runtime,'postgrest.log'),'a',0o600),child=spawn(process.env.PORTFOLIO_POSTGREST_BIN||'/opt/homebrew/bin/postgrest',[conf],{detached:true,stdio:['ignore',log.fd,log.fd]});child.unref();await writeFile(path.join(runtime,'postgrest.pid'),String(child.pid));await log.close();}
console.log('PostgreSQL development database: '+database+'\nPostgREST: '+config.apiUrl+'\nPrivate configuration saved under ignored .sites-runtime/.');
