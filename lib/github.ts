import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { githubCache } from '../db/schema';
const profileSchema=z.object({login:z.string(),name:z.string().nullable(),bio:z.string().nullable(),public_repos:z.number(),followers:z.number()});
const repositorySchema=z.object({id:z.number(),name:z.string(),description:z.string().nullable(),language:z.string().nullable(),stargazers_count:z.number(),forks_count:z.number(),fork:z.boolean(),archived:z.boolean(),pushed_at:z.string().nullable(),topics:z.array(z.string()).optional()});
const eventSchema=z.object({id:z.string(),type:z.string(),repo:z.object({name:z.string()}),created_at:z.string()});
export type GithubData={profile:{login:string;name:string;bio:string;repos:number;followers:number;stars:number},repositories:{id:number;name:string;description:string;language:string;stars:number;forks:number;updated:string|null;url:string;topics:string[]}[],events:{id:string;type:string;repo:string;date:string;url:string}[],languages:{name:string;count:number}[],syncedAt:string,stale:boolean,activityAvailable:boolean};
export function githubLogin(url:string){const u=new URL(url);if(u.hostname!=='github.com')throw new Error('Use a github.com profile URL');const login=u.pathname.split('/').filter(Boolean)[0];if(!login||!/^[a-zA-Z0-9-]{1,39}$/.test(login))throw new Error('Use a GitHub username in the profile URL');return login;}
const pending=new Map<string,Promise<GithubData>>();
export async function loadGithub(login:string):Promise<GithubData>{
 const db=getDb(),rows=await db.select().from(githubCache).where(eq(githubCache.id,login.toLowerCase())).limit(1),cached=rows[0];
 if(cached&&Date.now()-cached.fetchedAt<600000)return {...JSON.parse(cached.payload),stale:false};
 if(pending.has(login))return pending.get(login)!;
 const work=(async()=>{try{
 async function read(path:string){const r=await fetch('https://api.github.com'+path,{headers:{Accept:'application/vnd.github+json','User-Agent':'Abhishek-Portfolio','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(7000)});if(!r.ok)throw new Error(r.status===403||r.status===429?'GitHub rate limit reached. Try again later.':'GitHub is temporarily unavailable');return r.json();}
 const results=await Promise.allSettled([read('/users/'+login),read('/users/'+login+'/repos?per_page=100&sort=pushed'),read('/users/'+login+'/events/public?per_page=12')]);
 if(results[0].status==='rejected')throw results[0].reason;if(results[1].status==='rejected')throw results[1].reason;
 const profile=profileSchema.parse(results[0].value),repos=z.array(repositorySchema).parse(results[1].value),events=results[2].status==='fulfilled'?z.array(eventSchema).parse(results[2].value):[];
 const own=repos.filter(r=>!r.fork&&!r.archived&&r.name.toLowerCase()!==login.toLowerCase());
 const counts:Record<string,number>={};for(const repo of own){if(repo.language)counts[repo.language]=(counts[repo.language]||0)+1;}
 const data:GithubData={profile:{login:profile.login,name:profile.name||profile.login,bio:profile.bio||'',repos:profile.public_repos,followers:profile.followers,stars:own.reduce((sum,r)=>sum+r.stargazers_count,0)},repositories:own.filter(r=>r.name!=='life-os').map(r=>({id:r.id,name:r.name,description:r.description||'',language:r.language||'Code',stars:r.stargazers_count,forks:r.forks_count,updated:r.pushed_at,url:'https://github.com/'+profile.login+'/'+encodeURIComponent(r.name),topics:r.topics||[]})).sort((a,b)=>b.stars-a.stars),events:events.map(e=>({id:e.id,type:e.type,repo:e.repo.name,date:e.created_at,url:'https://github.com/'+e.repo.name.split('/').map(encodeURIComponent).join('/')})),languages:Object.entries(counts).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count),syncedAt:new Date().toISOString(),stale:false,activityAvailable:results[2].status==='fulfilled'};
 await db.insert(githubCache).values({id:login.toLowerCase(),payload:JSON.stringify(data),fetchedAt:Date.now()}).onConflictDoUpdate({target:githubCache.id,set:{payload:JSON.stringify(data),fetchedAt:Date.now()}});return data;
 }catch(error){if(cached)return {...JSON.parse(cached.payload),stale:true};throw error;}})();pending.set(login,work);try{return await work;}finally{pending.delete(login);}
}
