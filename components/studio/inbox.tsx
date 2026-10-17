'use client';
import { useEffect, useState } from 'react';
import { Mail, Archive, ArchiveRestore, RefreshCw, Check, ArrowUpRight } from 'lucide-react';
import type { ContactMessage } from '@/lib/contact';
type Cursor = { before: string; beforeId: string } | null;
export default function Inbox() {
  const [rows, setRows] = useState<ContactMessage[]>([]),
    [selected, setSelected] = useState<string | null>(null),
    [filter, setFilter] = useState('Active'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [cursor, setCursor] = useState<Cursor>(null);
  async function load(next?: Cursor) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/inbox' + (next ? '?' + new URLSearchParams(next) : ''));
      const result = (await response.json()) as { messages: ContactMessage[]; next: Cursor; error?: string };
      if (!response.ok) throw Error(result.error);
      setRows(old =>
        next ? [...old, ...result.messages.filter(r => !old.some(o => o.id === r.id))] : result.messages
      );
      setCursor(result.next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inbox unavailable.');
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let alive = true;
    fetch('/api/admin/inbox')
      .then(async r => {
        const result = (await r.json()) as { messages: ContactMessage[]; next: Cursor; error?: string };
        if (!r.ok) throw Error(result.error);
        if (alive) {
          setRows(result.messages);
          setCursor(result.next);
        }
      })
      .catch(e => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);
  async function status(id: string, value: ContactMessage['status']) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: value })
      });
      const result = (await response.json()) as { message: ContactMessage; error?: string };
      if (!response.ok) throw Error(result.error);
      setRows(old => old.map(r => (r.id === id ? result.message : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  }
  const message = rows.find(r => r.id === selected),
    visible = rows.filter(r =>
      filter === 'Archived'
        ? r.status === 'archived'
        : filter === 'Unread'
          ? r.status === 'new'
          : r.status !== 'archived'
    );
  return (
    <div className="inbox">
      <div className="panel-top">
        <div>
          <h2>Conversations start here.</h2>
          <p className="studio-info">Messages sent through your contact form. Reply opens your email app.</p>
        </div>
        <button className="outline-button" disabled={busy} onClick={() => load()}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>
      {error && (
        <p className="studio-status error" role="alert">
          {error}
        </p>
      )}
      <div className="filters inbox-filters">
        {['Active', 'Unread', 'Archived'].map(f => (
          <button
            key={f}
            className={filter === f ? 'active' : ''}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="inbox-layout">
        <aside className="inbox-list" aria-label="Contact messages">
          {visible.map(r => (
            <button
              disabled={busy}
              key={r.id}
              className={(selected === r.id ? 'selected ' : '') + (r.status === 'new' ? 'unread' : '')}
              onClick={() => {
                setSelected(r.id);
                if (r.status === 'new') status(r.id, 'read');
              }}
            >
              <span>
                <b>{r.name}</b>
                {r.status === 'new' && <i aria-label="Unread" />}
              </span>
              <small>{r.topic}</small>
              <p>{r.message.slice(0, 110)}</p>
              <time>
                {new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Calcutta', dateStyle: 'medium' }).format(
                  new Date(r.created_at)
                )}
              </time>
            </button>
          ))}
          {!visible.length && (
            <div className="inbox-empty">
              <Mail size={24} />
              <p>
                No {filter === 'Unread' ? 'unread ' : filter === 'Archived' ? 'archived ' : ''}messages yet.
              </p>
            </div>
          )}
          {cursor && (
            <button className="text-button" disabled={busy} onClick={() => load(cursor)}>
              Load older messages
            </button>
          )}
        </aside>
        {message ? (
          <article className="inbox-message">
            <span className="section-kicker">
              {message.topic} / {message.status.toUpperCase()}
            </span>
            <h3>{message.name}</h3>
            <a className="text-link" href={'mailto:' + encodeURIComponent(message.email)}>
              {message.email}
            </a>
            <time>
              {new Intl.DateTimeFormat('en-IN', {
                timeZone: 'Asia/Calcutta',
                dateStyle: 'medium',
                timeStyle: 'short'
              }).format(new Date(message.created_at))}
            </time>
            <p className="inbox-body">{message.message}</p>
            <div className="inbox-actions">
              <a
                className="solid-button"
                href={
                  'mailto:' +
                  encodeURIComponent(message.email) +
                  '?subject=' +
                  encodeURIComponent('Re: ' + message.topic)
                }
              >
                Reply <ArrowUpRight size={16} />
              </a>
              <button
                className="outline-button"
                disabled={busy}
                onClick={() => status(message.id, message.status === 'archived' ? 'new' : 'archived')}
              >
                {message.status === 'archived' ? <ArchiveRestore size={15} /> : <Archive size={15} />}{' '}
                {message.status === 'archived' ? 'Restore' : 'Archive'}
              </button>
              {message.status !== 'archived' && (
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => status(message.id, message.status === 'new' ? 'read' : 'new')}
                >
                  <Check size={15} />
                  {message.status === 'new' ? 'Mark read' : 'Mark unread'}
                </button>
              )}
            </div>
          </article>
        ) : (
          <div className="inbox-message inbox-placeholder">
            <Mail size={35} />
            <p>Select a message to read it.</p>
          </div>
        )}
      </div>
    </div>
  );
}
