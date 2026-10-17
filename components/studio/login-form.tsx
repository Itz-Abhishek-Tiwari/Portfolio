'use client';
import { useState } from 'react';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') })
      });
      if (response.ok) return window.location.reload();
      setError(((await response.json()) as { error?: string }).error || 'Sign in failed.');
    } catch {
      setError('Network error. Try again.');
    }
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="login-form">
      <label className="login-field">
        Email
        <div>
          <input name="email" type="email" autoComplete="username" autoFocus required />
        </div>
      </label>
      <label className="login-field">
        Password
        <div>
          <input name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required />
          <button type="button" className="login-toggle" onClick={() => setShow(!show)} aria-pressed={show}>
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
      </label>
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
      <button className="solid-button" type="submit" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
