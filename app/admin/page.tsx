import Link from 'next/link';
import { isAdmin } from '@/lib/server/auth';
import { readDraftAndPublished } from '@/lib/server/content-store';
import Studio from '@/components/studio/studio';
import LoginForm from '@/components/studio/login-form';
export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  if (!(await isAdmin()))
    return (
      <main className="gate">
        <span className="section-kicker">PRIVATE / CONTENT STUDIO</span>
        <h1>
          Your story.
          <br />
          Your studio.
        </h1>
        <p>Sign in with your administrator email and password to manage the portfolio.</p>
        <LoginForm />
        <Link className="text-link" href="/">
          Back to portfolio
        </Link>
      </main>
    );
  const { draft: data, published } = await readDraftAndPublished();
  return (
    <Studio
      publishedContent={published.content}
      initial={data.content}
      initialRevision={data.revision}
      initialUpdatedAt={data.updatedAt}
    />
  );
}
