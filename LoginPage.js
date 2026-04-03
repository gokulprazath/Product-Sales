import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode,     setMode]     = useState('login');   // 'login' | 'signup'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [msg,      setMsg]      = useState({ text: '', ok: true });
  const [busy,     setBusy]     = useState(false);

  const showMsg = (text, ok = false) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 4000);
  };

  const validateGmail = (val) => {
    if (!val.endsWith('@gmail.com')) {
      showMsg('Username must be a Gmail address (e.g. you@gmail.com)', false);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateGmail(email)) return;
    if (password.length < 6) {
      showMsg('Password must be at least 6 characters.', false);
      return;
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          showMsg(error.message || 'Login failed. Check your credentials.', false);
        } else {
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          showMsg(error.message || 'Sign-up failed. Try again.', false);
        } else {
          showMsg('Account created! Check your email to confirm, then log in.', true);
          setMode('login');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          Expense<span>Track</span>
        </div>
        <p className="login-sub">
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="field">
            <label htmlFor="email">Gmail Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {msg.text && (
            <div className={`toast show ${msg.ok ? 'ok' : 'err'}`}>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            className="btn primary login-submit"
            disabled={busy}
          >
            {busy
              ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="login-switch">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button className="link-btn" onClick={() => setMode('signup')}>
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className="link-btn" onClick={() => setMode('login')}>
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
