'use client';
import { useRef, useState } from 'react';
import { ArrowUpRight, Check, Send, LoaderCircle } from 'lucide-react';
import CustomSelect from '@/components/ui/custom-select';
import { contactTopics } from '@/lib/contact';
const empty = { name: '', email: '', topic: 'Project inquiry', message: '', website: '' };
export default function ContactForm() {
  const [form, setForm] = useState(empty),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState(''),
    [issues, setIssues] = useState<Record<string, string>>({});
  const operation = useRef(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError('');
    setIssues({});
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const result = (await response.json().catch(() => ({
        error: 'The contact service is unavailable. Please try again or use the email link.'
      }))) as { received?: boolean; error?: string; issues?: { field: string; message: string }[] };
      if (!response.ok || !result.received) {
        setIssues(Object.fromEntries((result.issues || []).map(i => [i.field, i.message])));
        throw Error(result.error || 'The message could not be saved.');
      }
      setSent(true);
      setForm(empty);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send. Your message is still here.');
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }
  if (sent)
    return (
      <div className="contact-success" role="status">
        <span>
          <Check size={27} />
        </span>
        <h3>Message received.</h3>
        <p>Thank you. Your message is saved in my portfolio inbox.</p>
        <button className="text-button" onClick={() => setSent(false)}>
          Write another message <ArrowUpRight size={16} />
        </button>
      </div>
    );
  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-form-heading">
        <Send size={18} />
        <h3>Leave a message.</h3>
      </div>
      <div className="contact-form-grid">
        <label>
          <span>Your name</span>
          <input
            disabled={busy}
            name="name"
            autoComplete="name"
            required
            maxLength={100}
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            aria-invalid={!!issues.name}
            aria-describedby={issues.name ? 'contact-name-error' : undefined}
          />
          {issues.name && <small id="contact-name-error">{issues.name}</small>}
        </label>
        <label>
          <span>Email address</span>
          <input
            disabled={busy}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            aria-invalid={!!issues.email}
            aria-describedby={issues.email ? 'contact-email-error' : undefined}
          />
          {issues.email && <small id="contact-email-error">{issues.email}</small>}
        </label>
        <CustomSelect
          label="What’s on your mind?"
          disabled={busy}
          value={form.topic}
          options={contactTopics}
          onChange={topic => setForm({ ...form, topic })}
        />
        <label className="contact-full">
          <span>Your message</span>
          <textarea
            disabled={busy}
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            aria-invalid={!!issues.message}
            aria-describedby={issues.message ? 'contact-message-error' : undefined}
          />
          {issues.message && <small id="contact-message-error">{issues.message}</small>}
          <span className="contact-counter" aria-hidden="true">
            {form.message.length} / 4000
          </span>
        </label>
      </div>
      <div className="contact-trap" aria-hidden="true">
        <label>
          Website
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={e => setForm({ ...form, website: e.target.value })}
          />
        </label>
      </div>
      {error && (
        <p className="contact-error" role="alert">
          {error}
        </p>
      )}
      <div className="contact-submit">
        <p>Your details are saved so I can respond.</p>
        <button className="solid-button" disabled={busy} type="submit">
          {busy ? 'Sending…' : 'Send message'}
          {busy ? <LoaderCircle size={16} /> : <ArrowUpRight size={17} />}
        </button>
      </div>
    </form>
  );
}
