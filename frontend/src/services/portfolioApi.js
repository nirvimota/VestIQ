const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json.data;
}

/** Fetch raw holdings/positions from DB (includes avg price, qty) */
export function getHoldings(token) {
  return apiFetch('/portfolio/holdings', { token });
}

/** Fetch live bulk quotes for a list of symbols */
export function getLiveQuotes(symbols) {
  if (!symbols || symbols.length === 0) return Promise.resolve({});
  return apiFetch(`/stocks/quotes?symbols=${encodeURIComponent(symbols.join(','))}`);
}

/** Fetch historical OHLCV data for a symbol + interval */
export function getStockHistory(symbol, interval = '1day', outputsize = 30) {
  return apiFetch(`/stocks/${symbol}/history?interval=${interval}&outputsize=${outputsize}`);
}

/**
 * Get portfolio holdings enriched with live market prices.
 * 1. Fetches positions from DB via /portfolio/holdings (already has live LTP from backend)
 * 2. Additionally hits /stocks/quotes for a second live-price refresh layer
 * 3. Merges the freshest price available
 */
export async function getPortfolioWithLivePrices(token) {
  // Step 1: fetch positions (backend already fetches Yahoo Finance per holding)
  const holdings = await getHoldings(token);
  if (!holdings || holdings.length === 0) return [];

  // Step 2: batch-fetch live quotes for all symbols simultaneously
  const symbols = holdings.map((h) => h.symbol);
  let liveQuotes = {};
  try {
    liveQuotes = await getLiveQuotes(symbols);
  } catch {
    // Non-fatal — fall back to backend-provided prices
  }

  // Step 3: merge — prefer live quote price, then backend ltp, then avg
  return holdings.map((h) => {
    const sym = h.symbol?.toUpperCase();
    const liveQ = liveQuotes[sym];
    const ltp = liveQ?.price || h.ltp || h.current_price || h.avg || h.average_price || 0;
    const change_pct = liveQ?.change_pct ?? h.change_pct ?? 0;
    const change = liveQ?.change ?? h.change ?? 0;
    return {
      ...h,
      ltp,
      change,
      change_pct,
      name: liveQ?.name || h.name || sym,
      _live: !!liveQ,
    };
  });
}

export function getFunds(token) {
  return apiFetch('/portfolio/funds', { token });
}
