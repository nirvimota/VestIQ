import supabase from '../config/supabase.js';
import { ok, fail } from '../utils/apiResponse.js';

export async function list(req, res) {
  const { data, error } = await supabase.from('watchlist_items').select('*').eq('user_id', req.user.id);
  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

export async function add(req, res) {
  const { symbol } = req.body;
  if (!symbol) return fail(res, 'symbol is required', 422);

  const { data, error } = await supabase
    .from('watchlist_items')
    .insert({ user_id: req.user.id, symbol })
    .select()
    .single();
  if (error) return fail(res, error.message, 400);
  return ok(res, data, 201);
}

export async function remove(req, res) {
  const { symbol } = req.params;
  const { error } = await supabase
    .from('watchlist_items')
    .delete()
    .eq('user_id', req.user.id)
    .eq('symbol', symbol);
  if (error) return fail(res, error.message, 400);
  return ok(res, { removed: symbol });
}