import { isAdmin } from '../../../lib/admin';
import { readContent } from '../../../lib/store';
import Portfolio from '../../portfolio';
import { redirect } from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Preview(){if(!await isAdmin())redirect('/admin');const {content}=await readContent(true);return <><div className="studio-status" style={{margin:0,textAlign:'center'}}>PRIVATE DRAFT PREVIEW · <a href="/admin">Back to studio ↗</a></div><Portfolio content={content}/></>;}
