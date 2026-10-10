import { isAdmin } from '../../../lib/admin';
import { readContent } from '../../../lib/store';
import { redirect } from 'next/navigation';
import PreviewClient from './preview-client';
export const dynamic='force-dynamic';
export default async function Preview({searchParams}:{searchParams:Promise<{embedded?:string}>}){if(!await isAdmin())redirect('/admin');const {content}=await readContent(true);const params=await searchParams;return <PreviewClient initial={content} embedded={params.embedded==='1'}/>;}
