import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';

export default function Login() {
  const { signInWithPassword } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async ({ email, password }) => {
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
    <div className="auth-bg flex items-center justify-center px-6">
      {/* Ambient Orbs */}
      <div className="orb orb-teal w-72 h-72 -top-20 -left-20" />
      <div className="orb orb-gold w-96 h-96 -bottom-32 -right-24" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-display text-3xl text-bone tracking-tight"
            >
              vest<span className="text-gold">IQ</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate text-sm mt-2"
            >
              Welcome back — sign in to continue
            </motion.p>
          </div>

          {/* Login Form */}
          <LoginForm
            onSubmit={handleLogin}
            loading={loading}
            error={error}
          />

          {/* Footer Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate text-sm text-center mt-6"
          >
            New here?{' '}
            <Link
              to="/signup"
              className="text-teal hover:text-teal/80 transition-colors font-medium"
            >
              Create an account
            </Link>
          </motion.p>
        </div>

        {/* Subtle bottom glow */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full bg-gold/5 blur-2xl pointer-events-none" />
      </motion.div>
    </div>
  );
}