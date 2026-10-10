import { readContent } from '../../../lib/store';
export async function GET(){try{return Response.json(await readContent(),{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Content unavailable'},{status:503});}}
