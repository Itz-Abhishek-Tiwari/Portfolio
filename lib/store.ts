import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { portfolio } from '../db/schema';
import { initialContent, contentSchema } from './content';
export async function readContent(draft=false) {
 const rows=await getDb().select().from(portfolio).where(eq(portfolio.id,'main')).limit(1);
 if(!rows[0]) return {content:initialContent,revision:0,updatedAt:null};
 return {content:contentSchema.parse(JSON.parse(draft?rows[0].draft:rows[0].published)),revision:rows[0].revision,updatedAt:rows[0].updatedAt};
}
