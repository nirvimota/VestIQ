import supabase from '../config/supabase.js';

export async function listNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createNotification(userId, title, kind) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, kind })
    .select()
    .single();
  if (error) throw error;
  return data;
}