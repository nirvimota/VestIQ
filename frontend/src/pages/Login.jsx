import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signInWithPassword(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8">
        <h1 className="font-display text-2xl text-bone mb-1">
          vest<span className="text-gold">IQ</span>
        </h1>
        <p className="text-slate text-sm mb-6">Log in to your account</p>

        {error && <p className="text-coral text-sm mb-4 font-mono">{error}</p>}

        <label className="block text-xs text-slate mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 rounded-lg bg-ink border border-border px-3 py-2 text-bone text-sm outline-none focus:border-teal"
          placeholder="you@example.com"
        />

        <label className="block text-xs text-slate mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 rounded-lg bg-ink border border-border px-3 py-2 text-bone text-sm outline-none focus:border-teal"
          placeholder="••••••••"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gold text-ink font-medium py-2.5 text-sm hover:bg-[#f0c665] transition-colors disabled:opacity-60"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p className="text-slate text-sm text-center mt-5">
          New here?{' '}
          <Link to="/signup" className="text-teal hover:underline">Create an account</Link>
        </p>
      </form>
    </div>
  );
}