'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight, Upload, Search } from 'lucide-react';
import { effectiveSkills, type Skill } from '@/lib/icon-system';
import type { Content } from '@/lib/content';
import SiteIcon from '@/components/ui/site-icon';

type Assets = Content['iconAssets'];
const CATEGORIES = ['Mobile', 'Frontend', 'Backend', 'Tools'];
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export default function SkillsEditor({
  content: c,
  onChange,
  onAssets,
  onUpload,
  issues = {}
}: {
  content: Content;
  issues?: Record<string, string>;
  onChange: (skills: Skill[]) => void;
  onAssets: (assets: Assets) => void;
  onUpload: (file: File, apply: (url: string) => void) => void;
}) {
  const skills = effectiveSkills(c);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const focusId = useRef<string | null>(null);

  const assetFor = (name: string) => c.iconAssets.find(a => a.kind === 'skill' && same(a.name, name));
  const count = (category: string) => skills.filter(s => s.category === category).length;
  // Keep each skill's position in the full list so edits, errors and reordering stay correct while filtered.
  const visible = skills
    .map((skill, index) => ({ skill, index }))
    .filter(
      ({ skill }) =>
        (filter === 'All' || skill.category === filter) &&
        (!search.trim() || skill.name.toLowerCase().includes(search.trim().toLowerCase()))
    );

  useEffect(() => {
    if (!focusId.current) return;
    const input = document.querySelector<HTMLInputElement>('[data-skill-id="' + focusId.current + '"]');
    focusId.current = null;
    input?.focus();
    input?.select();
  }, [skills.length]);

  function edit(i: number, key: 'name' | 'category', value: string) {
    const previous = skills[i].name;
    onChange(skills.map((s, j) => (j === i ? ({ ...s, [key]: value } as Skill) : s)));
    // keep an uploaded icon attached when the skill is renamed
    if (key === 'name' && assetFor(previous))
      onAssets(
        c.iconAssets.map(a => (a.kind === 'skill' && same(a.name, previous) ? { ...a, name: value } : a))
      );
  }
  // Move within what is on screen: swap with the neighbouring visible skill.
  function move(position: number, delta: number) {
    const from = visible[position]?.index;
    const to = visible[position + delta]?.index;
    if (from === undefined || to === undefined) return;
    const next = [...skills];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  }
  function add() {
    const skill: Skill = {
      id: crypto.randomUUID(),
      name: 'New skill',
      category: (filter === 'All' ? 'Tools' : filter) as Skill['category']
    };
    setSearch('');
    focusId.current = skill.id;
    onChange([...skills, skill]);
  }
  function setIcon(name: string, url: string) {
    const existing = assetFor(name);
    onAssets(
      existing
        ? c.iconAssets.map(a => (a === existing ? { ...a, image: url } : a))
        : [...c.iconAssets, { id: crypto.randomUUID(), name, kind: 'skill', image: url, themed: false }]
    );
  }
  function setThemed(name: string, themed: boolean) {
    onAssets(c.iconAssets.map(a => (a.kind === 'skill' && same(a.name, name) ? { ...a, themed } : a)));
  }
  function clearIcon(name: string) {
    onAssets(c.iconAssets.filter(a => !(a.kind === 'skill' && same(a.name, name))));
  }

  return (
    <div className="editor-panel skills-panel">
      <div className="skills-toolbar">
        <div className="skills-intro">
          <h3>
            Skills &amp; tools <span className="skills-total">{skills.length}</span>
          </h3>
          <p className="studio-info">
            Well-known technologies get an icon automatically. Click an icon to upload your own.
          </p>
        </div>
        <button className="solid-button" disabled={skills.length >= 80} onClick={add}>
          <Plus size={16} />
          Add skill
        </button>
      </div>

      <div className="skills-filters">
        <div className="skill-chips" role="tablist" aria-label="Filter by category">
          {['All', ...CATEGORIES].map(name => (
            <button
              key={name}
              role="tab"
              aria-selected={filter === name}
              className={'skill-chip' + (filter === name ? ' active' : '')}
              onClick={() => setFilter(name)}
            >
              {name}
              <span>{name === 'All' ? skills.length : count(name)}</span>
            </button>
          ))}
        </div>
        <label className="skills-search">
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search skills…"
            aria-label="Search skills"
          />
        </label>
      </div>

      {!visible.length ? (
        <p className="skills-empty">
          {skills.length ? 'No skills match that filter.' : 'No skills yet. Add your first one.'}
        </p>
      ) : (
        <div className="skill-grid">
          {visible.map(({ skill: s, index: i }, position) => {
            const asset = assetFor(s.name);
            const error = issues['skillItems.' + i + '.name'];
            return (
              <div className="skill-card" key={s.id}>
                <div className="skill-card-main">
                  <label className="skill-tile" title={asset?.image ? 'Replace icon' : 'Upload icon'}>
                    <SiteIcon name={s.name} assets={c.iconAssets} style={c.iconStyle} size={30} />
                    <span className="skill-tile-hint">
                      <Upload size={13} />
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/webp,image/jpeg"
                      aria-label={'Upload icon for ' + s.name}
                      hidden
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) onUpload(file, url => setIcon(s.name, url));
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <div className="skill-card-fields">
                    <input
                      id={'field-skillItems.' + i + '.name'}
                      data-skill-id={s.id}
                      className="skill-name"
                      aria-invalid={!!error}
                      aria-label={'Skill ' + (i + 1) + ' name'}
                      value={s.name}
                      onChange={e => edit(i, 'name', e.target.value)}
                    />
                    <select
                      className="skill-category"
                      aria-label={'Skill ' + (i + 1) + ' category'}
                      value={s.category}
                      onChange={e => edit(i, 'category', e.target.value)}
                    >
                      {CATEGORIES.map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {error && <small className="field-error">{error}</small>}
                <div className="skill-card-foot">
                  <div className="skill-icon-tools">
                    {asset?.image ? (
                      <>
                        <label
                          className="checkbox-field skill-theme-toggle"
                          title="Tint the icon with the site colours"
                        >
                          <input
                            type="checkbox"
                            checked={asset.themed}
                            onChange={e => setThemed(s.name, e.target.checked)}
                          />
                          Tint
                        </label>
                        <button className="text-button" onClick={() => clearIcon(s.name)}>
                          Reset icon
                        </button>
                      </>
                    ) : (
                      <span className="skill-auto">Default icon</span>
                    )}
                  </div>
                  <div className="row-controls">
                    <button
                      className="icon-button"
                      disabled={position === 0}
                      aria-label={'Move ' + s.name + ' earlier'}
                      onClick={() => move(position, -1)}
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      className="icon-button"
                      disabled={position === visible.length - 1}
                      aria-label={'Move ' + s.name + ' later'}
                      onClick={() => move(position, 1)}
                    >
                      <ArrowRight size={14} />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={'Remove ' + s.name + ' skill'}
                      onClick={() => onChange(skills.filter((_, j) => j !== i))}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <button className="skill-add-card" disabled={skills.length >= 80} onClick={add}>
            <Plus size={18} />
            Add skill
          </button>
        </div>
      )}
    </div>
  );
}
