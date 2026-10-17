import { Image as ImageIcon } from 'lucide-react';
import type { Content } from '@/lib/content';
import { AssetInput, Field } from '../field';
import type { PanelProps, UploadFile, UploadFiles } from '../types';
import RowControls, { moved } from './row-controls';

type TextKey =
  | 'name'
  | 'role'
  | 'headline'
  | 'intro'
  | 'about'
  | 'email'
  | 'availability'
  | 'github'
  | 'linkedin'
  | 'bandCaption'
  | 'bandCredit';

export default function ProfilePanel({
  content,
  update,
  issues,
  upload,
  uploadMany
}: PanelProps & { upload: UploadFile; uploadMany: UploadFiles }) {
  const text = (
    label: string,
    key: TextKey,
    options: { area?: boolean; full?: boolean; type?: string; hint?: string } = {}
  ) => (
    <Field
      label={label}
      path={key}
      value={content[key]}
      onChange={value => update(key, value)}
      issues={issues}
      {...options}
    />
  );
  const asset = (
    label: string,
    key: 'portrait' | 'portraitIllustrated' | 'bandImage' | 'resume',
    kind: 'image' | 'resume'
  ) => (
    <AssetInput
      label={label}
      url={content[key]}
      kind={kind}
      onUpload={file => upload(file, url => update(key, url as Content[typeof key]), kind)}
    />
  );
  return (
    <>
      <div className="editor-panel">
        <h3>Introduction</h3>
        <div className="editor-grid">
          {text('Full name', 'name')}
          {text('Professional role', 'role')}
          {text('Hero headline', 'headline', {
            area: true,
            full: true,
            hint: 'Keep it short. Line breaks are supported.'
          })}
          {text('Short introduction', 'intro', { area: true, full: true })}
          {text('About you', 'about', { area: true, full: true })}
        </div>
      </div>
      <div className="editor-panel">
        <h3>Contact & profiles</h3>
        <div className="editor-grid">
          {text('Contact email', 'email', { type: 'email' })}
          {text('Contact invitation', 'availability')}
          {text('GitHub profile URL', 'github', { type: 'url' })}
          {text('LinkedIn profile URL', 'linkedin', { type: 'url' })}
        </div>
      </div>
      <div className="editor-panel">
        <h3>Images & résumé</h3>
        <p className="studio-info">
          The original portrait appears in the hero and About section; the illustrated one shows on hover. The
          banner image sits behind its own caption after the About section; a wide landscape works best.
        </p>
        <div className="editor-grid">
          {text('Banner caption', 'bandCaption', {
            area: true,
            hint: 'Two lines; the second is set in italics.'
          })}
          {text('Banner credit', 'bandCredit', { hint: 'Who said it. Leave empty to hide.' })}
        </div>
        {asset('Upload illustrated portrait', 'portraitIllustrated', 'image')}
        {asset('Upload original portrait', 'portrait', 'image')}
        {asset('Upload banner image', 'bandImage', 'image')}
        <h4 className="slides-heading">Banner slideshow</h4>
        <p className="studio-info">
          These rotate with the banner image above. With more than one image, the banner plays as a slideshow.
        </p>
        {content.bandSlides.map((url, i) => (
          <div className="asset-editor" key={url + i}>
            <div className="asset-preview">
              <img src={url} alt={'Banner slide ' + (i + 2)} />
            </div>
            <RowControls
              index={i}
              count={content.bandSlides.length}
              label={'slide ' + (i + 2)}
              removeLabel={'Remove slide ' + (i + 2)}
              onMove={dir => update('bandSlides', moved(content.bandSlides, i, dir))}
              onRemove={() =>
                update(
                  'bandSlides',
                  content.bandSlides.filter((_, j) => j !== i)
                )
              }
            />
          </div>
        ))}
        {content.bandSlides.length < 8 && (
          <label className="asset-upload">
            <ImageIcon size={16} />
            <span>Add slides</span>
            <input
              aria-label="Add slides"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={e => {
                const room = 8 - content.bandSlides.length;
                const files = [...(e.target.files ?? [])].slice(0, room);
                uploadMany(files, urls => update('bandSlides', [...content.bandSlides, ...urls]));
                e.target.value = '';
              }}
            />
            <small>
              Select several at once · JPG, PNG or WebP · up to 4 MB each · {8 - content.bandSlides.length}{' '}
              more allowed
            </small>
          </label>
        )}
        {asset('Upload résumé', 'resume', 'resume')}
      </div>
    </>
  );
}
