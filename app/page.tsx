import { readContent } from '../lib/store';
import Portfolio from './portfolio';
export const dynamic='force-dynamic';
export default async function Page(){const {content}=await readContent();return <Portfolio content={content}/>;}
