import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from the profiles table
  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  /** Sign in with email + password */
  const signInWithPassword = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  /**
   * Sign up with email + password.
   * Optionally pass metadata like { fullName } which gets stored
   * in raw_user_meta_data and picked up by the DB trigger.
   */
  const signUp = (email, password, { fullName } = {}) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || '' },
      },
    });

  /** Sign out */
  const signOut = () => supabase.auth.signOut();

  /** Update profile in the profiles table */
  const updateProfile = async (updates) => {
    if (!session?.user?.id) return { error: { message: 'Not authenticated' } };

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select()
      .single();

    if (data) setProfile(data);
    return { data, error };
  };

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signInWithPassword,
    signUp,
    signOut,
    updateProfile,
    refreshProfile: () => fetchProfile(session?.user?.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

