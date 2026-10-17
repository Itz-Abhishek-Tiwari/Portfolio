import {Client} from 'pg';
import {readFile} from 'node:fs/promises';
import {randomUUID,createHmac} from 'node:crypto';
const base='http://127.0.0.1:5173',config=JSON.parse(await readFile('.sites-runtime/database.json','utf8')),db=new Client({connectionString:config.databaseUrl});await db.connect();
const name='Local QA '+randomUUID(),ip='local-qa-'+randomUUID(),bucket=createHmac('sha256',config.apiKey).update(ip).digest('hex'),data={name,email:'qa@example.com',topic:'Project inquiry',message:'A local automated contact test. <script>not executable</script>',website:''};
async function post(body,origin=base){const r=await fetch(base+'/api/contact',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','cf-connecting-ip':ip},body:JSON.stringify(body)});const raw=await r.text();let responseBody;try{responseBody=JSON.parse(raw);}catch{responseBody={error:raw};}return {status:r.status,body:responseBody};}
try{
 if((await fetch(base+'/api/admin/inbox')).status!==403)throw Error('Inbox exposed to anonymous visitor');
 if((await post(data,'https://example.com')).status!==403)throw Error('Origin check failed');
 if((await post({...data,email:'bad'})).status!==422)throw Error('Email validation failed');
 if((await post({...data,message:'short'})).status!==422)throw Error('Message validation failed');
 if((await post({...data,website:'spam.example'})).status!==202)throw Error('Honeypot handling failed');
 if(Number((await db.query('select count(*) from portfolio_contact_messages where name=$1',[name])).rows[0].count)!==0)throw Error('Honeypot stored message');
 for(let i=0;i<5;i++){const result=await post(data);if(result.status!==201||!result.body.received)throw Error('Contact persistence failed '+JSON.stringify(result));}
 if((await post(data)).status!==429)throw Error('Rate limit failed');
 const rows=(await db.query('select * from portfolio_contact_messages where name=$1',[name])).rows;if(rows.length!==5||rows.some(r=>r.status!=='new'||r.message!==data.message))throw Error('Stored message differs');
 const auth={Cookie:'__sites_local_auth=1',Origin:base,'Content-Type':'application/json'};
 const inbox=await fetch(base+'/api/admin/inbox',{headers:auth});if(inbox.status!==200)throw Error('Admin inbox inaccessible');
 for(const status of ['read','archived','new']){const r=await fetch(base+'/api/admin/inbox',{method:'PATCH',headers:auth,body:JSON.stringify({id:rows[0].id,status})});if(r.status!==200||(await r.json()).message.status!==status)throw Error('Inbox status failed '+status);}
 const denied=await fetch(base+'/api/admin/inbox',{method:'PATCH',headers:{...auth,Origin:'https://example.com'},body:JSON.stringify({id:rows[0].id,status:'read'})});if(denied.status!==403)throw Error('Inbox write origin check failed');
 console.log('PASS: contact validation, origin check, honeypot, persistence, atomic rate limit, private inbox, read/archive/restore.');
}finally{await db.query('delete from portfolio_contact_messages where name=$1 and email=$2',[name,'qa@example.com']);await db.query('delete from portfolio_contact_limits where bucket=$1',[bucket]);await db.end();console.log('Only this test’s local fixtures were removed.');}
