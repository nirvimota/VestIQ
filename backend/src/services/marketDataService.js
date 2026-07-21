// MVP: static/mock quotes. Swap this out for a real vendor (NSE/BSE data
// feed, or a provider like Upstox/Kite Connect/TrueData) behind the same
// function signatures so controllers don't need to change.

const MOCK_QUOTES = {
  RELIANCE: { price: 2945.6, dayHigh: 2958.2, dayLow: 2910.0, changePct: 1.2 },
  TCS: { price: 3812.4, dayHigh: 3860.0, dayLow: 3795.5, changePct: -0.4 },
  HDFCBANK: { price: 1675.2, dayHigh: 1682.0, dayLow: 1660.1, changePct: 0.8 },
  INFY: { price: 1842.9, dayHigh: 1855.0, dayLow: 1830.2, changePct: 0.3 },
};

const MOCK_INDICES = {
  NIFTY50: { price: 24812.35, changePct: 0.62 },
  SENSEX: { price: 81245.1, changePct: 0.58 },
  BANKNIFTY: { price: 52340.15, changePct: -0.21 },
};

export async function getQuote(symbol) {
  const quote = MOCK_QUOTES[symbol.toUpperCase()];
  if (!quote) return null;
  return { symbol: symbol.toUpperCase(), ...quote };
}

export async function getIndices() {
  return MOCK_INDICES;
}

export async function getMovers() {
  return Object.entries(MOCK_QUOTES).map(([symbol, q]) => ({ symbol, ...q }));
}