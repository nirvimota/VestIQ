import supabase from '../config/supabase.js';

/** Register a new user via Supabase Auth */
export async function registerUser(email, password) {
  return supabase.auth.signUp({ email, password });
}

/** Sign in with email + password */
export async function loginUser(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

/** Create a profile row in the public.profiles table */
export async function createProfile(userId, { fullName = '', phone = '' } = {}) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, full_name: fullName, phone })
    .select()
    .single();
  return { data, error };
}

/** Fetch a user's profile by their auth UID */
export async function getProfileById(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

/** Update a user's profile */
export async function updateProfile(userId, updates) {
  const allowed = {};
  if (updates.fullName !== undefined) allowed.full_name = updates.fullName;
  if (updates.phone !== undefined) allowed.phone = updates.phone;
  if (updates.avatarUrl !== undefined) allowed.avatar_url = updates.avatarUrl;

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}