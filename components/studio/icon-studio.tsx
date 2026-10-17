'use client';
import { useState } from 'react';
import { Copy, Plus, Trash2, Upload, Check } from 'lucide-react';
import type { Content } from '@/lib/content';
import { effectiveSkills, makeIconPrompt, iconPromptDefault } from '@/lib/icon-system';
import SiteIcon from '@/components/ui/site-icon';
type Kind = Content['iconAssets'][number]['kind'];
export default function IconStudio({
  content: c,
  onAssets,
  onStyle,
  onTemplate,
  onUpload,
  issues = {}
}: {
  content: Content;
  issues?: Record<string, string>;
  onAssets: (a: Content['iconAssets']) => void;
  onStyle: (style: Content['iconStyle']) => void;
  onTemplate: (prompt: string) => void;
  onUpload: (file: File, apply: (url: string) => void) => void;
}) {
  const [subject, setSubject] = useState(c.experience[0]?.company || 'New company'),
    [kind, setKind] = useState<Kind>('company'),
    [copied, setCopied] = useState(false);
  const prompt = makeIconPrompt(c, subject || 'COMPANY OR TOOL NAME', kind),
    subjects =
      kind === 'company'
        ? c.experience.map(e => e.company)
        : kind === 'skill'
          ? effectiveSkills(c).map(s => s.name)
          : [
              'Home',
              'Work',
              'About',
              'Skills',
              'Journey',
              'Elsewhere',
              'Play',
              'Journal',
              'Contact',
              'GitHub',
              'LinkedIn'
            ];
  function edit(i: number, patch: Partial<Content['iconAssets'][number]>) {
    onAssets(c.iconAssets.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setCopied(false);
      document.querySelector<HTMLTextAreaElement>('#icon-rendered-prompt')?.select();
    }
  }
  return (
    <>
      <div className="editor-panel">
        <h3>One consistent icon system</h3>
        <p className="studio-info">
          Technology marks use Simple Icons, company marks use the official logos, and interface symbols use
          Lucide. Uploaded icons override the built-in mark by matching its name and category.
        </p>
        <div className="mode-options">
          {(['themed', 'brand'] as const).map(s => (
            <button
              key={s}
              className={'outline-button' + (c.iconStyle === s ? ' active' : '')}
              aria-pressed={c.iconStyle === s}
              onClick={() => onStyle(s)}
            >
              {s === 'themed' ? 'Match site colours' : 'Original brand colours'}
            </button>
          ))}
        </div>
        <div className="icon-sample-strip">
          {['React Native', 'TypeScript', 'Python', 'Git', 'Linux'].map(name => (
            <div key={name}>
              <SiteIcon name={name} style={c.iconStyle} assets={c.iconAssets} size={28} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="editor-panel">
        <h3>Prompt for ChatGPT</h3>
        <p className="studio-info">
          Choose a company, skill, or interface symbol. The prompt includes the current theme and mode. Copy
          it into ChatGPT with the official logo, then upload the transparent PNG or WebP below.
        </p>
        <div className="editor-grid">
          <label className="field">
            <span>Icon category</span>
            <select
              value={kind}
              onChange={e => {
                setKind(e.target.value as Kind);
                setCopied(false);
              }}
            >
              <option value="company">Company</option>
              <option value="skill">Skill</option>
              <option value="interface">Interface</option>
            </select>
          </label>
          <label className="field">
            <span>Company or icon name</span>
            <input
              list="icon-subjects"
              value={subject}
              onChange={e => {
                setSubject(e.target.value);
                setCopied(false);
              }}
            />
            <datalist id="icon-subjects">
              {subjects.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="field full">
            <span>Ready-to-copy prompt</span>
            <textarea id="icon-rendered-prompt" rows={9} readOnly value={prompt} />
          </label>
        </div>
        <button className="solid-button" onClick={copy}>
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Prompt copied' : 'Copy prompt'}
        </button>
        <details className="prompt-template">
          <summary>Customize the reusable prompt template</summary>
          <label className="field">
            <span>Template</span>
            <textarea rows={10} value={c.iconPromptTemplate} onChange={e => onTemplate(e.target.value)} />
            <small>
              Available placeholders: {'{name}, {kind}, {foreground}, {background}, {accent}, {style}'}
            </small>
          </label>
          <button className="text-button" onClick={() => onTemplate(iconPromptDefault)}>
            Restore default prompt
          </button>
        </details>
      </div>
      <div className="editor-panel">
        <div className="panel-top">
          <h3>Custom icon library</h3>
          <button
            className="outline-button"
            disabled={c.iconAssets.length >= 120}
            onClick={() =>
              onAssets([
                ...c.iconAssets,
                { id: crypto.randomUUID(), name: subject || 'New company', kind, image: '', themed: true }
              ])
            }
          >
            <Plus size={16} />
            Add icon entry
          </button>
        </div>
        <p className="studio-info">
          Match the exact company, skill, or navigation label. Transparent PNG/WebP is recommended. Monochrome
          treatment changes with the theme; switch it off for a multi-colour illustration.
        </p>
        {!c.iconAssets.length && (
          <p className="studio-info">Built-in icons are active. Add an entry when you want to replace one.</p>
        )}
        {c.iconAssets.map((a, i) => (
          <div className="icon-library-row" key={a.id}>
            <div className="icon-library-preview">
              <SiteIcon name={a.name} kind={a.kind} assets={c.iconAssets} style={c.iconStyle} size={48} />
            </div>
            <div className="editor-grid">
              <label className="field">
                <span>Name to match</span>
                <input
                  aria-invalid={!!issues['iconAssets.' + i + '.name']}
                  id={'field-iconAssets.' + i + '.name'}
                  value={a.name}
                  onChange={e => edit(i, { name: e.target.value })}
                />
                {issues['iconAssets.' + i + '.name'] && (
                  <small className="field-error">{issues['iconAssets.' + i + '.name']}</small>
                )}
              </label>
              <label className="field">
                <span>Category</span>
                <select value={a.kind} onChange={e => edit(i, { kind: e.target.value as Kind })}>
                  <option value="company">Company</option>
                  <option value="skill">Skill</option>
                  <option value="interface">Interface</option>
                </select>
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={a.themed}
                  onChange={e => edit(i, { themed: e.target.checked })}
                />
                Adapt to site colours
              </label>
              <label className="asset-upload">
                <Upload size={15} />
                <span>{a.image ? 'Replace icon' : 'Upload icon'}</span>
                <input
                  aria-label={'Upload ' + a.name + ' icon'}
                  type="file"
                  accept="image/png,image/webp,image/jpeg"
                  onChange={e => {
                    if (e.target.files?.[0]) onUpload(e.target.files[0], url => edit(i, { image: url }));
                    e.target.value = '';
                  }}
                />
              </label>
              {a.image && (
                <button className="text-button" onClick={() => edit(i, { image: '' })}>
                  Use built-in icon
                </button>
              )}
            </div>
            <button
              className="icon-button danger"
              aria-label={'Remove ' + a.name + ' icon override'}
              onClick={() => onAssets(c.iconAssets.filter((_, j) => j !== i))}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
