import supabase  from '../config/supabase.js';

export async function getHoldings(userId) {
  const { data, error } = await supabase.from('holdings').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function getFundsSummary(userId) {
  const { data, error } = await supabase
    .from('funds')
    .select('available_balance, blocked_margin')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}