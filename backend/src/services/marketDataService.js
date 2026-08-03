// Test file
import supabase from '../config/supabase.js';
import { env } from '../config/env.js';
export async function getQuote(symbol) {
  return { symbol: symbol.toUpperCase(), price: 100 };
}
