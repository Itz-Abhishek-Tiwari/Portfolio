import { z } from 'zod';
import { isAdmin,sameOrigin } from '../../../../lib/admin';
import { readContent } from '../../../../lib/store';
import { contentSchema, initialContent } from '../../../../lib/content';
import { getDb } from '../../../../db';
import { portfolio } from '../../../../db/schema';
import { and,eq } from 'drizzle-orm';
export async function GET(){if(!await isAdmin())return Response.json({error:'Administrator access required'},{status:403});try{const [draft,published]=await Promise.all([readContent(true),readContent(false)]);return Response.json({...draft,published:published.content},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Content could not be loaded. Please try again.'},{status:503});}}
export async function PUT(request:Request){
 if(!sameOrigin(request)||!await isAdmin())return Response.json({error:'Administrator access required'},{status:403});
 let body:z.infer<typeof requestSchema>;
 try{const raw=await request.text();if(raw.length>200000)return Response.json({error:'Content is too large'},{status:413});body=requestSchema.parse(JSON.parse(raw));}catch(error){return Response.json({error:'Please fix the highlighted fields.',issues:error instanceof z.ZodError?error.issues.map(issue=>({...issue,path:issue.path[0]==='content'?issue.path.slice(1):issue.path})):[]},{status:422});}
 try{const current=await readContent(true);if(body.revision!==current.revision)return Response.json({error:'A newer draft exists. Your edits have been kept. Reload the latest draft or copy your changes before replacing it.'},{status:409});
 const next=current.revision+1,now=new Date().toISOString(),value=JSON.stringify(body.content),db=getDb();
 if(current.revision===0){const inserted=await db.insert(portfolio).values({id:'main',draft:value,published:JSON.stringify(body.publish?body.content:initialContent),revision:next,updatedAt:now}).onConflictDoNothing().returning();if(!inserted.length)return Response.json({error:'Another session saved first. Reload the latest draft.'},{status:409});}
 else {const rows=await db.update(portfolio).set({draft:value,...(body.publish?{published:value}:{}),revision:next,updatedAt:now}).where(and(eq(portfolio.id,'main'),eq(portfolio.revision,current.revision))).returning();if(!rows.length)return Response.json({error:'A newer draft exists. Reload the latest draft before saving.'},{status:409});}
 return Response.json({revision:next,updatedAt:now,content:body.content,published:body.publish});
 }catch{return Response.json({error:'Save failed. Your edits are still here. Try again.'},{status:503});}
}
const requestSchema=z.object({content:contentSchema,revision:z.number().int().nonnegative(),publish:z.boolean()});
