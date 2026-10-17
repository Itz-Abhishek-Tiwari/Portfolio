import { isAdmin } from '@/lib/server/auth';
import { readContent } from '@/lib/server/content-store';
import { redirect } from 'next/navigation';
import DraftPreview from '@/components/studio/draft-preview';
export const dynamic = 'force-dynamic';
export default async function Preview({ searchParams }: { searchParams: Promise<{ embedded?: string }> }) {
  if (!(await isAdmin())) redirect('/admin');
  const { content } = await readContent(true);
  const params = await searchParams;
  return <DraftPreview initial={content} embedded={params.embedded === '1'} />;
}
