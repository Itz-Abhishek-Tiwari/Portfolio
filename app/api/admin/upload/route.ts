import { env } from 'cloudflare:workers';
import { isAdmin, sameOrigin } from '@/lib/server/auth';
export async function POST(request: Request) {
  if (!sameOrigin(request) || !(await isAdmin()))
    return Response.json({ error: 'Administrator access required' }, { status: 403 });
  if (Number(request.headers.get('content-length') || 0) > 9 * 1024 * 1024)
    return Response.json({ error: 'Choose a file under 8 MB' }, { status: 413 });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'The upload could not be read. Choose the file again.' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File) || !file.size || file.size > 8 * 1024 * 1024)
    return Response.json({ error: 'Choose a non-empty file under 8 MB' }, { status: 400 });
  const buffer = await file.arrayBuffer(),
    b = new Uint8Array(buffer),
    decoder = new TextDecoder();
  // PDFs may carry a few bytes (BOM, whitespace) before the header; the spec allows it anywhere in the first 1 KB.
  const detected = decoder.decode(b.slice(0, 1024)).includes('%PDF-')
    ? 'application/pdf'
    : b[0] === 255 && b[1] === 216
      ? 'image/jpeg'
      : b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71
        ? 'image/png'
        : decoder.decode(b.slice(0, 4)) === 'RIFF' && decoder.decode(b.slice(8, 12)) === 'WEBP'
          ? 'image/webp'
          : null;
  const kind = form.get('kind') || (detected === 'application/pdf' ? 'resume' : 'image');
  if (
    !detected ||
    // Browsers and OSes label the same file differently, so trust the bytes and only reject clear mismatches.
    ![
      '',
      'application/octet-stream',
      'binary/octet-stream',
      detected,
      ...(detected === 'application/pdf' ? ['application/x-pdf', 'application/acrobat'] : []),
      ...(detected === 'image/jpeg' ? ['image/jpg', 'image/pjpeg'] : [])
    ].includes(file.type) ||
    (kind === 'resume' && detected !== 'application/pdf') ||
    (kind === 'image' && detected === 'application/pdf') ||
    !['resume', 'image'].includes(String(kind))
  )
    return Response.json(
      { error: kind === 'resume' ? 'Choose a valid PDF résumé.' : 'Choose a valid JPG, PNG, or WebP image.' },
      { status: 422 }
    );
  if (!env.BUCKET)
    return Response.json({ error: 'Upload storage is unavailable. Try again later.' }, { status: 503 });
  try {
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }[
        detected
      ],
      key = crypto.randomUUID() + '.' + ext;
    await env.BUCKET.put(key, buffer, { httpMetadata: { contentType: detected } });
    return Response.json({ url: '/api/media/' + key });
  } catch {
    return Response.json({ error: 'Upload failed. The current file has not been changed.' }, { status: 503 });
  }
}
