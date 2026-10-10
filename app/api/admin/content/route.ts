import { z } from 'zod';
import { isAdmin,sameOrigin } from '../../../../lib/admin';
import { readContent } from '../../../../lib/store';
import { contentSchema, initialContent } from '../../../../lib/content';
import { getDb } from '../../../../db';
import { portfolio } from '../../../../db/schema';
import { and,eq } from 'drizzle-orm';
export async function GET(){if(!await isAdmin())return Response.json({error:'Administrator access required'},{status:403});return Response.json(await readContent(true),{headers:{'Cache-Control':'no-store'}});}
export async function PUT(request:Request){
 if(!sameOrigin(request))return Response.json({error:'Invalid origin'},{status:403});
 if(!await isAdmin())return Response.json({error:'Administrator access required'},{status:403});
 try {
 const raw=await request.text();if(raw.length>200000)return Response.json({error:'Content is too large'},{status:413});
 const body=z.object({content:contentSchema,revision:z.number().int().nonnegative(),publish:z.boolean()}).parse(JSON.parse(raw)); const content=contentSchema.parse(body.content); const current=await readContent(true);
 if(body.revision!==current.revision)return Response.json({error:'Content changed in another session. Reload before saving.'},{status:409});
 const next=current.revision+1, now=new Date().toISOString(), value=JSON.stringify(content), db=getDb();
 if(current.revision===0){await db.insert(portfolio).values({id:'main',draft:value,published:JSON.stringify(body.publish?content:initialContent),revision:next,updatedAt:now}).onConflictDoNothing();const row=await readContent(true);if(row.revision!==next||JSON.stringify(row.content)!==value)return Response.json({error:'Another session saved first. Reload.'},{status:409});}
 else {const rows=await db.update(portfolio).set({draft:value,...(body.publish?{published:value}:{}),revision:next,updatedAt:now}).where(and(eq(portfolio.id,'main'),eq(portfolio.revision,current.revision))).returning();if(!rows.length)return Response.json({error:'Content changed. Reload before saving.'},{status:409});}
 return Response.json({revision:next,updatedAt:now});
 }catch(error){return Response.json({error:error instanceof Error?error.message:'Save failed'},{status:400});}
}
