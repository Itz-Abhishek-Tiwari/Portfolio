import {get,put} from '@vercel/blob';
import {base,cookie} from './local-env.mjs';
import {randomUUID,createHmac} from 'node:crypto';
const PATH='data/inbox.json';
async function readInbox(){const r=await get(PATH,{access:'private',useCache:false});return r?.statusCode===200?{data:await new Response(r.stream).json(),etag:r.blob.etag}:{data:{messages:[],limits:{}},etag:null};}
const name='Local QA '+randomUUID(),ip='local-qa-'+randomUUID(),bucket=createHmac('sha256',process.env.PORTFOLIO_SESSION_SECRET||process.env.PORTFOLIO_ADMIN_PASSWORD).update(ip).digest('hex'),data={name,email:'qa@example.com',topic:'Project inquiry',message:'A local automated contact test. <script>not executable</script>',website:''};
const stored=async()=>(await readInbox()).data.messages.filter(m=>m.name===name);
async function post(body,origin=base){const r=await fetch(base+'/api/contact',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Real-IP':ip},body:JSON.stringify(body)});const raw=await r.text();let responseBody;try{responseBody=JSON.parse(raw);}catch{responseBody={error:raw};}return {status:r.status,body:responseBody};}
try{
 if((await fetch(base+'/api/admin/inbox')).status!==403)throw Error('Inbox exposed to anonymous visitor');
 if((await post(data,'https://example.com')).status!==403)throw Error('Origin check failed');
 if((await post({...data,email:'bad'})).status!==422)throw Error('Email validation failed');
 if((await post({...data,message:'short'})).status!==422)throw Error('Message validation failed');
 if((await post({...data,website:'spam.example'})).status!==202)throw Error('Honeypot handling failed');
 if((await stored()).length!==0)throw Error('Honeypot stored message');
 const burst=await Promise.all(Array.from({length:5},()=>post(data)));if(burst.some(r=>r.status!==201||!r.body.received))throw Error('Contact persistence failed '+JSON.stringify(burst));
 if((await post(data)).status!==429)throw Error('Rate limit failed');
 const rows=await stored();if(rows.length!==5||rows.some(r=>r.status!=='new'||r.message!==data.message))throw Error('Stored message differs');
 const auth={Cookie:cookie,Origin:base,'Content-Type':'application/json'};
 const inbox=await fetch(base+'/api/admin/inbox',{headers:auth});if(inbox.status!==200)throw Error('Admin inbox inaccessible');
 for(const status of ['read','archived','new']){const r=await fetch(base+'/api/admin/inbox',{method:'PATCH',headers:auth,body:JSON.stringify({id:rows[0].id,status})});if(r.status!==200||(await r.json()).message.status!==status)throw Error('Inbox status failed '+status);}
 const denied=await fetch(base+'/api/admin/inbox',{method:'PATCH',headers:{...auth,Origin:'https://example.com'},body:JSON.stringify({id:rows[0].id,status:'read'})});if(denied.status!==403)throw Error('Inbox write origin check failed');
 console.log('PASS: contact validation, origin check, honeypot, concurrent persistence, rate limit, private inbox, read/archive/restore.');
}finally{
 for(let i=0;i<5;i++){const {data:inboxData,etag}=await readInbox();delete inboxData.limits[bucket];inboxData.messages=inboxData.messages.filter(m=>!(m.name===name&&m.email==='qa@example.com'));try{await put(PATH,JSON.stringify(inboxData),{access:'private',contentType:'application/json',addRandomSuffix:false,cacheControlMaxAge:60,...(etag?{ifMatch:etag}:{allowOverwrite:false})});break;}catch(e){if(i===4)throw e;}}
 console.log('Only this test’s fixtures were removed.');
}
