import { BlobPreconditionFailedError, get, head, put } from '@vercel/blob';
import { serverEnv } from '@/lib/server/env';

// All data lives as JSON documents in a private Vercel Blob store, one file per collection.
// Writes are conditional on the ETag read just before, so concurrent saves fail with 409
// instead of silently overwriting each other.
export class DatabaseError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/** On Vercel a connected store provides BLOB_STORE_ID (OIDC); locally BLOB_READ_WRITE_TOKEN works too. */
export const storeReady = () => Boolean(serverEnv('BLOB_READ_WRITE_TOKEN') || serverEnv('BLOB_STORE_ID'));

function requireStore() {
  if (!storeReady())
    throw new DatabaseError('Vercel Blob is not configured. Connect a Blob store to the project.', 503);
}

export type Doc<T> = { data: T; etag: string };

/**
 * Reads a JSON document, or null when it doesn't exist yet. Always from origin storage: the CDN copy
 * can lag an overwrite by a minute, and a publish has to show on the next page load.
 */
export async function readDoc<T>(pathname: string): Promise<Doc<T> | null> {
  requireStore();
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200) return null;
  return { data: (await new Response(result.stream).json()) as T, etag: result.blob.etag };
}

/** Writes a JSON document. `etag` is the version it replaces, or null when it must not exist yet. */
export async function writeDoc(pathname: string, data: unknown, etag: string | null, conflict: string) {
  requireStore();
  try {
    await put(pathname, JSON.stringify(data), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      cacheControlMaxAge: 60,
      ...(etag ? { ifMatch: etag } : { allowOverwrite: false })
    });
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) throw new DatabaseError(conflict, 409);
    // A create-only write fails when someone else created the file first.
    if (!etag && (await head(pathname).catch(() => null))) throw new DatabaseError(conflict, 409);
    throw new DatabaseError('The data store request failed. Please try again.', 503);
  }
}

/** Read-modify-write that retries when another request wrote in between (contact form, GitHub cache). */
export async function updateDoc<T, R>(
  pathname: string,
  initial: T,
  change: (data: T) => { data: T; result: R }
): Promise<R> {
  for (let attempt = 0; ; attempt++) {
    const doc = await readDoc<T>(pathname);
    const { data, result } = change(doc?.data ?? structuredClone(initial));
    try {
      await writeDoc(pathname, data, doc?.etag ?? null, 'busy');
      return result;
    } catch (error) {
      if (!(error instanceof DatabaseError && error.status === 409) || attempt === 7) throw error;
    }
  }
}
