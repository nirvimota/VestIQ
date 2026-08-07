import supabase from '../config/supabase.js';
import { ok, fail } from '../utils/apiResponse.js';

export async function list(req, res) {
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', req.user.id)
    .order('added_at', { ascending: false });
  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

export async function add(req, res) {
  const { symbol } = req.body;
  if (!symbol) return fail(res, 'symbol is required', 422);

  const sym = symbol.toUpperCase();

  // Check if already in watchlist — return 200 instead of erroring
  const { data: existing } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', req.user.id)
    .eq('symbol', sym)
    .single();
  if (existing) return ok(res, existing);

  const { data, error } = await supabase
    .from('watchlist')
    .insert({ user_id: req.user.id, symbol: sym })
    .select()
    .single();
  if (error) return fail(res, error.message, 400);
  return ok(res, data, 201);
}

export async function remove(req, res) {
  const symbol = req.params.symbol.toUpperCase();
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', req.user.id)
    .eq('symbol', symbol);
  if (error) return fail(res, error.message, 400);
  return ok(res, { removed: symbol });
}