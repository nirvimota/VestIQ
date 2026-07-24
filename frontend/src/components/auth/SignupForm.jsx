import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

/** Calculates a 0-4 strength score for the password */
function getPasswordStrength(pw) {
  let score = 0;
  if (!pw) return score;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const strengthMeta = [
  { label: '', color: 'transparent', width: '0%' },
  { label: 'Weak', color: '#E5484D', width: '25%' },
  { label: 'Fair', color: '#e8b84b', width: '50%' },
  { label: 'Good', color: '#3fd6c0', width: '75%' },
  { label: 'Strong', color: '#34d399', width: '100%' },
];

export default function SignupForm({ onSubmit, loading, error }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const meta = strengthMeta[strength];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password, fullName });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-5"
    >
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-coral/10 border border-coral/20 px-4 py-3 text-coral text-sm font-mono"
        >
          {error}
        </motion.div>
      )}

      {/* Full Name */}
      <div className="input-group">
        <label className="input-label" htmlFor="signup-name">Full name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
          <input
            id="signup-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="auth-input"
            placeholder="John Doe"
            autoComplete="name"
          />
        </div>
      </div>

      {/* Email Field */}
      <div className="input-group">
        <label className="input-label" htmlFor="signup-email">Email address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
          <input
            id="signup-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input pl-10"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="input-group">
        <label className="input-label" htmlFor="signup-password">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input pl-10 pr-10"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="password-toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Password Strength Bar */}
        {password.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="strength-bar">
              <div
                className="strength-bar-fill"
                style={{ width: meta.width, backgroundColor: meta.color }}
              />
            </div>
            <p className="text-xs mt-1.5" style={{ color: meta.color }}>
              {meta.label}
            </p>
          </motion.div>
        )}
      </div>

      {/* Terms Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-border bg-ink accent-teal"
        />
        <span className="text-xs text-slate leading-relaxed group-hover:text-bone transition-colors">
          I agree to the{' '}
          <span className="text-teal hover:underline cursor-pointer">Terms of Service</span>
          {' '}and{' '}
          <span className="text-teal hover:underline cursor-pointer">Privacy Policy</span>
        </span>
      </label>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading || !agreed}
        className="auth-btn auth-btn-primary flex items-center justify-center gap-2"
        whileTap={{ scale: 0.98 }}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </motion.button>
    </motion.form>
  );
}
