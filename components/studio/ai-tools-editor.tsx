'use client';
import { useEffect, useRef } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import type { Content } from '@/lib/content';
import SiteIcon from '@/components/ui/site-icon';

type Tool = Content['aiTools'][number];

export default function AiToolsEditor({
  content: c,
  onChange,
  issues = {}
}: {
  content: Content;
  issues?: Record<string, string>;
  onChange: (tools: Tool[]) => void;
}) {
  const tools = c.aiTools;
  const focusId = useRef<string | null>(null);

  useEffect(() => {
    if (!focusId.current) return;
    const input = document.querySelector<HTMLInputElement>('[data-ai-id="' + focusId.current + '"]');
    focusId.current = null;
    input?.focus();
    input?.select();
  }, [tools.length]);

  const edit = (i: number, key: 'name' | 'use' | 'url', value: string) =>
    onChange(tools.map((t, j) => (j === i ? { ...t, [key]: value } : t)));
  function move(i: number, delta: number) {
    const next = [...tools];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    onChange(next);
  }
  function add() {
    const tool: Tool = { id: crypto.randomUUID(), name: 'New tool', use: '', url: '' };
    focusId.current = tool.id;
    onChange([...tools, tool]);
  }

  return (
    <div className="editor-panel ai-panel">
      <div className="skills-toolbar">
        <div className="skills-intro">
          <h3>
            AI tools <span className="skills-total">{tools.length}</span>
          </h3>
          <p className="studio-info">
            The AI assistants you work with, shown in their own section on the site. Well-known tools get
            their logo automatically.
          </p>
        </div>
        <button className="solid-button" disabled={tools.length >= 24} onClick={add}>
          <Plus size={16} />
          Add tool
        </button>
      </div>

      {!tools.length ? (
        <p className="skills-empty">
          No AI tools yet. The section stays hidden on the site until you add one.
        </p>
      ) : (
        <div className="ai-editor-list">
          {tools.map((t, i) => (
            <div className="ai-editor-row" key={t.id}>
              <span className="ai-editor-icon">
                <SiteIcon
                  name={t.name}
                  assets={c.iconAssets}
                  style={c.iconStyle}
                  fallback={Sparkles}
                  size={26}
                />
              </span>
              <div className="ai-editor-fields">
                <label className="field">
                  <span>Tool name</span>
                  <input
                    id={'field-aiTools.' + i + '.name'}
                    data-ai-id={t.id}
                    aria-invalid={!!issues['aiTools.' + i + '.name']}
                    value={t.name}
                    onChange={e => edit(i, 'name', e.target.value)}
                  />
                  {issues['aiTools.' + i + '.name'] && (
                    <small className="field-error">{issues['aiTools.' + i + '.name']}</small>
                  )}
                </label>
                <label className="field">
                  <span>Link (optional)</span>
                  <input
                    id={'field-aiTools.' + i + '.url'}
                    type="url"
                    placeholder="https://"
                    aria-invalid={!!issues['aiTools.' + i + '.url']}
                    value={t.url}
                    onChange={e => edit(i, 'url', e.target.value)}
                  />
                  {issues['aiTools.' + i + '.url'] && (
                    <small className="field-error">{issues['aiTools.' + i + '.url']}</small>
                  )}
                </label>
                <label className="field ai-editor-use">
                  <span>What you use it for</span>
                  <input
                    id={'field-aiTools.' + i + '.use'}
                    maxLength={200}
                    value={t.use}
                    onChange={e => edit(i, 'use', e.target.value)}
                  />
                </label>
              </div>
              <div className="row-controls">
                <button
                  className="icon-button"
                  disabled={i === 0}
                  aria-label={'Move ' + t.name + ' up'}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  className="icon-button"
                  disabled={i === tools.length - 1}
                  aria-label={'Move ' + t.name + ' down'}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  className="icon-button danger"
                  aria-label={'Remove ' + t.name}
                  onClick={() => onChange(tools.filter((_, j) => j !== i))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
