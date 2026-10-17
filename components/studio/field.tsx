import { Download, Image as ImageIcon } from 'lucide-react';
import type { Issues } from './types';

/** A labelled text input or textarea wired to the studio's validation messages. */
export function Field({
  label,
  path,
  value,
  onChange,
  issues,
  area,
  full,
  type = 'text',
  hint
}: {
  label: string;
  path: string;
  value: string;
  onChange: (value: string) => void;
  issues: Issues;
  area?: boolean;
  full?: boolean;
  type?: string;
  hint?: string;
}) {
  const error = issues[path];
  const shared = {
    id: 'field-' + path,
    value,
    'aria-invalid': !!error,
    'aria-describedby': error ? 'error-' + path : undefined
  };
  return (
    <label className={'field' + (full ? ' full' : '')}>
      <span>{label}</span>
      {area ? (
        <textarea {...shared} rows={path === 'about' ? 6 : 3} onChange={e => onChange(e.target.value)} />
      ) : (
        <input {...shared} type={type} onChange={e => onChange(e.target.value)} />
      )}{' '}
      {error ? (
        <small id={'error-' + path} className="field-error">
          {error}
        </small>
      ) : (
        hint && <small>{hint}</small>
      )}
    </label>
  );
}

/** Preview plus file picker for an uploaded image or PDF. */
export function AssetInput({
  label,
  url,
  kind,
  onUpload
}: {
  label: string;
  url: string;
  kind: 'image' | 'resume';
  onUpload: (file: File | undefined) => void;
}) {
  return (
    <div className="asset-editor">
      <div className="asset-preview">
        {kind === 'image' ? (
          <img src={url} alt={label} />
        ) : (
          <div>
            <Download size={24} />
            <a href={url} target="_blank" rel="noreferrer">
              View current PDF ↗
            </a>
          </div>
        )}
      </div>
      <label className="asset-upload">
        <ImageIcon size={16} />
        <span>{label}</span>
        <input
          aria-label={label}
          type="file"
          accept={kind === 'resume' ? '.pdf,application/pdf' : 'image/jpeg,image/png,image/webp'}
          onChange={e => {
            onUpload(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <small>{kind === 'resume' ? 'PDF' : 'JPG, PNG or WebP'} · up to 4 MB</small>
      </label>
    </div>
  );
}
