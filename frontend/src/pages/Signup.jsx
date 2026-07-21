import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate('/kyc');
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8">
        <h1 className="font-display text-2xl text-bone mb-1">Create your account</h1>
        <p className="text-slate text-sm mb-6">Start investing in NSE &amp; BSE stocks</p>

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
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 rounded-lg bg-ink border border-border px-3 py-2 text-bone text-sm outline-none focus:border-teal"
          placeholder="At least 8 characters"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gold text-ink font-medium py-2.5 text-sm hover:bg-[#f0c665] transition-colors disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-slate text-sm text-center mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-teal hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}