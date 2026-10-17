import { listPosts } from '@/lib/server/posts-store';
export async function GET() {
  try {
    const rows = await listPosts();
    return Response.json(
      { posts: rows.map(row => ({ id: row.id, ...row.published!, publishedAt: row.published_at })) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json({ error: 'The journal is temporarily unavailable.' }, { status: 503 });
  }
}
