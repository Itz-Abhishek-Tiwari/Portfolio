import { readContent } from '../../../lib/store';
import { githubLogin,loadGithub } from '../../../lib/github';
export async function GET(){try{const {content}=await readContent();const data=await loadGithub(githubLogin(content.github));return Response.json(data,{headers:{'Cache-Control':'no-store'}});}catch(e){return Response.json({error:e instanceof Error?e.message:'GitHub unavailable'},{status:503});}}
