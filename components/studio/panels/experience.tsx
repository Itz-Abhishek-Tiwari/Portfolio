import { Image as ImageIcon, Plus } from 'lucide-react';
import type { Content } from '@/lib/content';
import { Field } from '../field';
import SiteIcon from '@/components/ui/site-icon';
import type { PanelProps, UploadFile } from '../types';
import RowControls, { moved } from './row-controls';

type Role = Content['experience'][number];
const MAX_ROLES = 20;
const fields = ['role', 'company', 'period', 'description'] as const;

export default function ExperiencePanel({
  content,
  update,
  issues,
  upload,
  onRemove
}: PanelProps & { upload: UploadFile; onRemove: (index: number, item: Role) => void }) {
  const roles = content.experience;
  const assets = content.iconAssets;
  // Company logos live in the shared icon library, matched to the role by company name.
  const logoFor = (company: string) =>
    assets.find(a => a.kind === 'company' && a.name.trim().toLowerCase() === company.trim().toLowerCase());
  function setLogo(company: string, image: string) {
    const existing = logoFor(company);
    update(
      'iconAssets',
      existing
        ? assets.map(a => (a.id === existing.id ? { ...a, image } : a))
        : [
            ...assets,
            { id: crypto.randomUUID(), name: company.trim(), kind: 'company', image, themed: false }
          ]
    );
  }
  const removeLogo = (company: string) =>
    update(
      'iconAssets',
      assets.filter(a => a.id !== logoFor(company)?.id)
    );
  return (
    <>
      {roles.map((e, i) => (
        <div className="editor-panel" key={e.id}>
          <div className="panel-top">
            <h3>{e.company || 'New experience'}</h3>
            <RowControls
              index={i}
              count={roles.length}
              label={e.company + ' experience'}
              removeLabel={'Remove ' + e.company + ' experience'}
              onMove={direction => update('experience', moved(roles, i, direction))}
              onRemove={() => onRemove(i, e)}
            />
          </div>
          <div className="exp-logo-editor">
            <span className="exp-logo-preview">
              <SiteIcon name={e.company} kind="company" assets={assets} style="brand" size={44} />
            </span>
            <label className="asset-upload">
              <ImageIcon size={16} />
              <span>{logoFor(e.company)?.image ? 'Replace company logo' : 'Upload company logo'}</span>
              <input
                aria-label={'Upload ' + e.company + ' logo'}
                type="file"
                accept="image/png,image/webp,image/jpeg"
                disabled={!e.company.trim() || (!logoFor(e.company) && assets.length >= 120)}
                onChange={event => {
                  upload(event.target.files?.[0], url => setLogo(e.company, url), 'image');
                  event.target.value = '';
                }}
              />
              <small>
                Square, transparent PNG or WebP works best. Linked by company name, so set that first.
              </small>
            </label>
            {logoFor(e.company) && (
              <button className="text-button" onClick={() => removeLogo(e.company)}>
                Remove logo
              </button>
            )}
          </div>
          <div className="editor-grid">
            {fields.map(key => (
              <Field
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                path={'experience.' + i + '.' + key}
                value={e[key]}
                onChange={value =>
                  update(
                    'experience',
                    roles.map((item, j) => (j === i ? { ...item, [key]: value } : item))
                  )
                }
                issues={issues}
                area={key === 'description'}
                full={key === 'description'}
              />
            ))}
          </div>
        </div>
      ))}
      <button
        className="outline-button add-button"
        disabled={roles.length >= MAX_ROLES}
        onClick={() =>
          update('experience', [
            ...roles,
            {
              id: crypto.randomUUID(),
              role: 'Your role',
              company: 'Company',
              period: 'Dates',
              description: ''
            }
          ])
        }
      >
        <Plus size={17} />
        Add experience
      </button>
    </>
  );
}
