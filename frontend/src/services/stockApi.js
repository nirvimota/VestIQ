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

export function searchStocks(query) {
  return apiFetch(`/stocks/search?q=${encodeURIComponent(query)}`);
}

export function getStockQuote(symbol) {
  return apiFetch(`/stocks/${symbol}/quote`);
}

/** Fetch multiple quotes in one round-trip (comma-separated symbols) */
export function getStockQuotes(symbols) {
  return apiFetch(`/stocks/quotes?symbols=${encodeURIComponent(symbols.join(','))}`);
}

export function getStockHistory(symbol, interval = '1day', outputsize = 30) {
  return apiFetch(`/stocks/${symbol}/history?interval=${interval}&outputsize=${outputsize}`);
}

export function getIndices() {
  return apiFetch('/stocks/indices');
}

export function getMovers() {
  return apiFetch('/stocks/movers');
}

export function getAIStockAnalysis(symbol, token) {
  return apiFetch(`/ai/analyze/${symbol}`, { token });
}

export function askAIChat(question, contextData, token) {
  return apiFetch('/ai/chat', {
    method: 'POST',
    body: { question, contextData },
    token,
  });
}
