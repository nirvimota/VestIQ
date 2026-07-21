import supabase from '../config/supabase.js';

export async function registerUser(email, password) {
  return supabase.auth.signUp({ email, password });
}

export async function loginUser(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}