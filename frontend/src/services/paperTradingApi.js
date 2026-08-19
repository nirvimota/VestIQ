/**
 * paperTradingApi.js
 * API helpers for the Learn / Paper Trading section.
 * Follows the same pattern as orderApi.js / portfolioApi.js.
 */

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
  if (!res.ok) throw new Error(json.error || 'Paper trading API error');
  return json.data;
}

/** GET /api/learn/account — get or auto-create paper account */
export function getPaperAccount(token) {
  return apiFetch('/learn/account', { token });
}

/** GET /api/learn/portfolio — full portfolio summary */
export function getPaperPortfolio(token) {
  return apiFetch('/learn/portfolio', { token });
}

/** GET /api/learn/holdings — current open positions */
export function getPaperHoldings(token) {
  return apiFetch('/learn/holdings', { token });
}

/** GET /api/learn/orders — order history */
export function getPaperOrders(token) {
  return apiFetch('/learn/orders', { token });
}

/**
 * POST /api/learn/orders — place a paper order
 * @param {string} token
 * @param {{ symbol: string, side: 'buy'|'sell', orderType?: string, quantity: number, limitPrice?: number }} payload
 */
export function placePaperOrder(token, payload) {
  return apiFetch('/learn/orders', { method: 'POST', body: payload, token });
}

/** POST /api/learn/reset — reset paper account to ₹1,00,000 */
export function resetPaperAccount(token) {
  return apiFetch('/learn/reset', { method: 'POST', token });
}
