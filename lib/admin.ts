import { getChatGPTUser } from '../app/chatgpt-auth';
import { env } from 'cloudflare:workers';
export async function isAdmin(){
 const user=await getChatGPTUser(); if(!user) return false;
 const configured=(env as unknown as Record<string,string>).PORTFOLIO_ADMIN_EMAIL || 'abhitiwariabhi7@gmail.com';
 return user.email.toLowerCase()===configured.toLowerCase() || (import.meta.env.DEV && user.userId==='local_seedy');
}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
