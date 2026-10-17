import { Check, Eye } from 'lucide-react';
import { themes, getPalette } from '@/lib/theme';
import type { PanelProps } from '../types';

export default function AppearancePanel({
  content,
  update,
  onPreview
}: Omit<PanelProps, 'issues'> & { onPreview: () => void }) {
  return (
    <>
      <div className="editor-panel">
        <h3>Complete site theme</h3>
        <p className="studio-info">
          Palettes apply to backgrounds, surfaces, text, borders, buttons, and artwork accents. Changes show
          immediately in the studio and Preview. Publish to apply them to the live website.
        </p>
        <div className="theme-options">
          {themes.map(theme => {
            const palette = getPalette(theme.id, content.colorMode);
            const active = content.theme === theme.id;
            return (
              <button
                className={'theme-option' + (active ? ' active' : '')}
                key={theme.id}
                aria-pressed={active}
                onClick={() => update('theme', theme.id)}
              >
                <div className="theme-swatch">
                  {[palette.bg, palette.accent, palette.accent2].map(color => (
                    <i key={color} style={{ background: color }} />
                  ))}
                </div>
                <span>
                  <b>{theme.name}</b>
                  <small>{theme.description}</small>
                </span>
                {active && <Check size={18} />}
              </button>
            );
          })}
        </div>
        <button className="outline-button theme-preview" onClick={onPreview}>
          <Eye size={16} />
          Preview this theme
        </button>
      </div>
      <div className="editor-panel">
        <h3>Default appearance</h3>
        <div className="mode-options">
          {(['dark', 'light'] as const).map(m => (
            <button
              key={m}
              className={'outline-button' + (content.colorMode === m ? ' active' : '')}
              aria-pressed={content.colorMode === m}
              onClick={() => update('colorMode', m)}
            >
              {m === 'dark' ? 'Dark' : 'Light'}
            </button>
          ))}
        </div>
        <p className="studio-info">
          Visitors can switch modes in the navigation. Their preference stays on their device.
        </p>
      </div>
      <div className="editor-panel">
        <h3>Scene motion</h3>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={content.motion}
            onChange={e => update('motion', e.target.checked)}
          />
          Enable entrance and scroll animations
        </label>
        <p className="studio-info">Reduced-motion preferences are always respected.</p>
      </div>
    </>
  );
}
