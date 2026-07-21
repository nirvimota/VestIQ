import supabase from '../config/supabase.js';

export async function submitKyc(userId, payload) {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .upsert({ user_id: userId, ...payload, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}