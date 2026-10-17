'use client';
import { useEffect, useState } from 'react';
import { contentSchema, type Content } from '@/lib/content';
import Portfolio from '@/components/home/portfolio';
/** /admin/preview: the saved draft, or live unsaved edits when embedded in the studio's drawer. */
export default function DraftPreview({ initial, embedded }: { initial: Content; embedded: boolean }) {
  const [content, setContent] = useState(initial);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.type !== 'portfolio:preview'
      )
        return;
      const result = contentSchema.safeParse(event.data.content);
      if (result.success) setContent(result.data);
    };
    window.addEventListener('message', receive);
    if (window.parent !== window)
      window.parent.postMessage({ type: 'portfolio:preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', receive);
  }, []);
  return (
    <div className={embedded ? undefined : 'saved-draft-preview'}>
      {!embedded && (
        <div className={'preview-banner theme-' + content.theme}>
          SAVED DRAFT PREVIEW <a href="/admin">Return to studio ↗</a>
        </div>
      )}
      <Portfolio content={content} previewMode={embedded} draftMode />
    </div>
  );
}
