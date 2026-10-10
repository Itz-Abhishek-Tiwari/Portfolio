import { env } from 'cloudflare:workers';
import { isAdmin,sameOrigin } from '../../../../lib/admin';
export async function POST(request:Request){
 if(!sameOrigin(request)||!await isAdmin())return Response.json({error:'Administrator access required'},{status:403});
 if(Number(request.headers.get('content-length')||0)>9*1024*1024)return Response.json({error:'Choose a file under 8 MB'},{status:413});
 const form=await request.formData(), file=form.get('file');
 if(!(file instanceof File)||file.size>8*1024*1024)return Response.json({error:'Choose a file under 8 MB'},{status:400});
 const types:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'};
 if(!types[file.type])return Response.json({error:'Use JPG, PNG, WebP, or PDF'},{status:400});
 const buffer=await file.arrayBuffer(), bytes=new Uint8Array(buffer);
 const valid=file.type==='application/pdf'?new TextDecoder().decode(bytes.slice(0,5))==='%PDF-':file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
 if(!valid)return Response.json({error:'File contents do not match its type'},{status:400});
 if(!env.BUCKET)return Response.json({error:'Upload storage unavailable'},{status:503});
 const key=crypto.randomUUID()+'.'+types[file.type];await env.BUCKET.put(key,buffer,{httpMetadata:{contentType:file.type}});return Response.json({url:'/api/media/'+key});
}
