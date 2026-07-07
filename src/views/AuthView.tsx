import { useState } from 'react';
import { useAuth } from '../lib/auth';

export function AuthView() {
  const { cloudEnabled, signInGoogle, signInEmail, signUpEmail, useLocal } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !pw) return;
    setBusy(true);
    setMsg(null);
    const err = mode === 'signin' ? await signInEmail(email, pw) : await signUpEmail(email, pw);
    setBusy(false);
    if (err === 'CHECK_EMAIL') setMsg('Check your email to confirm your account, then sign in.');
    else if (err) setMsg(err);
  };

  return (
    <div className="auth">
      <div className="auth-hero">
        <img src="/icon.svg" alt="" className="auth-logo" />
        <h1 className="auth-brand">REPFUEL</h1>
        <p className="auth-tag">Train. Eat. Progress.</p>
      </div>

      <div className="auth-body">
        {cloudEnabled ? (
          <>
            <button className="btn btn-google" onClick={() => signInGoogle()}>
              <span className="g-mark">G</span> Continue with Google
            </button>
            <div className="auth-divider"><span>or use email</span></div>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={pw}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            {msg && <div className="auth-msg">{msg}</div>}
            <button className="btn btn-primary" disabled={busy || !email || !pw} onClick={submit}>
              {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
            <button
              className="btn-link"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setMsg(null);
              }}
            >
              {mode === 'signin' ? "New here? Create an account" : 'Already have an account? Sign in'}
            </button>
            <div className="auth-divider"><span>or</span></div>
          </>
        ) : (
          <div className="auth-note">
            Cloud sync isn't configured yet (no Supabase keys). You can still use the full app on this device —
            see the README to enable accounts &amp; sync later.
          </div>
        )}
        <button className="btn btn-ghost" onClick={useLocal}>
          Continue without an account (this device only)
        </button>
      </div>
    </div>
  );
}
