/**
 * marketDataService.js
 * Live & historical market data via Twelve Data API.
 * Falls back to last-known cached value on any API error.
 */

import axios from 'axios';
import NodeCache from 'node-cache';
import { env } from '../config/env.js';

// ── Cache instances ─────────────────────────────────────────────────────────
const quoteCache   = new NodeCache({ stdTTL: env.quoteCacheTtl  || 15  });
const indexCache   = new NodeCache({ stdTTL: env.indexCacheTtl  || 30  });
const historyCache = new NodeCache({ stdTTL: 300 }); // 5 min for OHLCV
const fallbackCache = new NodeCache({ stdTTL: 0 });  // never expires – stale fallback

const BASE = 'https://api.twelvedata.com';
const API_KEY = () => env.twelveDataApiKey;

// Helper — make a Twelve Data GET request
async function td(endpoint, params = {}) {
  const res = await axios.get(`${BASE}${endpoint}`, {
    params: { ...params, apikey: API_KEY() },
    timeout: 8000,
  });
  if (res.data?.status === 'error') throw new Error(res.data.message || 'Twelve Data error');
  return res.data;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Get a real-time quote for a single symbol.
 * @param {string} symbol  e.g. "RELIANCE", "TCS"
 */
export async function getQuote(symbol) {
  const key = `quote:${symbol.toUpperCase()}`;
  const cached = quoteCache.get(key);
  if (cached) return cached;

  try {
    // Twelve Data requires NSE stocks as "SYMBOL:NSE" — the exchange param alone causes 404
    const sym = symbol.toUpperCase();
    const tdSymbol = sym.includes(':') ? sym : `${sym}:NSE`;
    const data = await td('/quote', { symbol: tdSymbol });

    const quote = {
      symbol:     data.symbol,
      name:       data.name,
      exchange:   data.exchange,
      price:      parseFloat(data.close),
      open:       parseFloat(data.open),
      high:       parseFloat(data.high),
      low:        parseFloat(data.low),
      prev_close: parseFloat(data.previous_close),
      change:     parseFloat(data.change),
      change_pct: parseFloat(data.percent_change),
      volume:     parseInt(data.volume, 10),
      timestamp:  data.datetime,
    };

    quoteCache.set(key, quote);
    fallbackCache.set(key, quote);
    return quote;
  } catch (err) {
    console.error(`[MarketData] getQuote(${symbol}) failed:`, err.message);
    const stale = fallbackCache.get(key);
    if (stale) return { ...stale, _stale: true };
    // Last resort: return a minimal object so the app doesn't crash
    return { symbol: symbol.toUpperCase(), price: 0, _unavailable: true };
  }
}

/**
 * Get real-time quotes for multiple symbols in one round-trip.
 * @param {string[]} symbols
 * @returns {Object}  { RELIANCE: {...}, TCS: {...}, ... }
 */
export async function getQuotes(symbols) {
  if (!symbols?.length) return {};

  const upper = [...new Set(symbols.map(s => s.toUpperCase()))];

  // Separate hits vs misses
  const result = {};
  const toFetch = [];
  for (const sym of upper) {
    const hit = quoteCache.get(`quote:${sym}`);
    if (hit) result[sym] = hit;
    else toFetch.push(sym);
  }

  if (toFetch.length === 0) return result;

  try {
    // Twelve Data supports comma-separated symbols in /price
    // NSE stocks must be in "SYMBOL:NSE" format
    const tdSymbols = toFetch.map(s => s.includes(':') ? s : `${s}:NSE`);
    const data = await td('/price', { symbol: tdSymbols.join(',') });

    // Response shape differs for 1 vs many symbols
    // Keys in response will be "SYMBOL:NSE" — strip the exchange suffix for our result map
    const rawPrices = toFetch.length === 1
      ? { [toFetch[0]]: data }
      : data;

    for (const [rawKey, info] of Object.entries(rawPrices)) {
      const sym = rawKey.split(':')[0]; // strip :NSE suffix if present
      const quote = {
        symbol: sym,
        price: parseFloat(info.price),
        timestamp: new Date().toISOString(),
      };
      quoteCache.set(`quote:${sym}`, quote);
      fallbackCache.set(`quote:${sym}`, quote);
      result[sym] = quote;
    }
  } catch (err) {
    console.error('[MarketData] getQuotes batch failed:', err.message);
    // Fill remaining from fallback
    for (const sym of toFetch) {
      const stale = fallbackCache.get(`quote:${sym}`);
      result[sym] = stale ? { ...stale, _stale: true } : { symbol: sym, price: 0, _unavailable: true };
    }
  }

  return result;
}

/**
 * Get OHLCV time-series data.
 * @param {string} symbol
 * @param {string} interval  '1min' | '5min' | '15min' | '1h' | '1day'
 * @param {number} outputsize  number of data points (max 5000 on free tier)
 */
export async function getTimeSeries(symbol, interval = '1day', outputsize = 30) {
  const key = `ts:${symbol}:${interval}:${outputsize}`;
  const cached = historyCache.get(key);
  if (cached) return cached;

  try {
    const sym = symbol.toUpperCase();
    const tdSymbol = sym.includes(':') ? sym : `${sym}:NSE`;
    const data = await td('/time_series', {
      symbol: tdSymbol,
      interval,
      outputsize,
    });

    const series = (data.values || []).map(v => ({
      datetime: v.datetime,
      open:   parseFloat(v.open),
      high:   parseFloat(v.high),
      low:    parseFloat(v.low),
      close:  parseFloat(v.close),
      volume: parseInt(v.volume, 10),
    })).reverse(); // oldest first

    historyCache.set(key, series);
    return series;
  } catch (err) {
    console.error(`[MarketData] getTimeSeries(${symbol}) failed:`, err.message);
    return historyCache.get(key) || [];
  }
}

/**
 * Get major Indian indices (NIFTY 50, SENSEX, BANK NIFTY).
 */
export async function getIndices() {
  const key = 'indices:IN';
  const cached = indexCache.get(key);
  if (cached) return cached;

  const INDEX_SYMBOLS = [
    { symbol: 'NIFTY:NSE',     name: 'NIFTY 50'    },
    { symbol: 'SENSEX:BSE',   name: 'SENSEX'       },
    { symbol: 'BANKNIFTY:NSE', name: 'BANK NIFTY' },
  ];

  try {
    const results = await Promise.allSettled(
      INDEX_SYMBOLS.map(idx => td('/quote', { symbol: idx.symbol }))
    );

    const indices = INDEX_SYMBOLS.map((idx, i) => {
      const displaySymbol = idx.symbol.split(':')[0]; // strip exchange suffix for display
      const r = results[i];
      if (r.status === 'fulfilled') {
        const d = r.value;
        return {
          symbol:    displaySymbol,
          name:      idx.name,
          price:     parseFloat(d.close),
          change:    parseFloat(d.change),
          change_pct: parseFloat(d.percent_change),
        };
      }
      // Fallback
      const stale = fallbackCache.get(`index:${displaySymbol}`);
      return stale || { symbol: displaySymbol, name: idx.name, price: 0, change: 0, change_pct: 0, _unavailable: true };
    });

    // Store using clean symbol (no exchange suffix)
    indices.forEach(idx => fallbackCache.set(`index:${idx.symbol}`, idx));

    indexCache.set(key, indices);
    return indices;
  } catch (err) {
    console.error('[MarketData] getIndices failed:', err.message);
    return fallbackCache.get(key) || [];
  }
}

/**
 * Get top movers (gainers & losers) from a predefined NSE universe.
 */
export async function getTopMovers() {
  const UNIVERSE = [
    'RELIANCE','TCS','HDFCBANK','INFY','ICICIBANK',
    'SBIN','ITC','KOTAKBANK','AXISBANK','TATAMOTORS',
    'WIPRO','BAJFINANCE','SUNPHARMA','HCLTECH','MARUTI',
  ];

  const quotes = await getQuotes(UNIVERSE);

  const withChange = Object.values(quotes)
    .filter(q => !q._unavailable)
    .map(q => ({ ...q, change_pct: q.change_pct || 0 }));

  const sorted = [...withChange].sort((a, b) => b.change_pct - a.change_pct);

  return {
    gainers: sorted.slice(0, 5),
    losers:  sorted.slice(-5).reverse(),
  };
}

const overviewInFlight = new Map();

/**
 * Get company fundamentals via Alpha Vantage OVERVIEW endpoint.
 * @param {string} symbol
 */
export async function getCompanyOverview(symbol) {
  const sym = symbol.toUpperCase();
  const key = `overview:${sym}`;
  const cached = historyCache.get(key);
  if (cached) return cached;

  if (overviewInFlight.has(key)) {
    return await overviewInFlight.get(key);
  }

  const fetchPromise = (async () => {
    try {
      if (!env.alphaVantageApiKey || env.alphaVantageApiKey.includes('your_')) {
        throw new Error('Alpha Vantage API key not configured');
      }

      const res = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'OVERVIEW',
          symbol: sym,
          apikey: env.alphaVantageApiKey,
        },
        timeout: 10000,
      });

      const d = res.data;

      // Handle Alpha Vantage rate limit / note payload
      if (d?.Note || d?.Information) {
        console.warn(`[MarketData] Alpha Vantage limit note for ${sym}:`, d.Note || d.Information);
        const stale = fallbackCache.get(key);
        if (stale) return stale;
        throw new Error('Rate limit exceeded on Alpha Vantage API');
      }

      if (!d?.Symbol) throw new Error('No fundamental data available');

      const overview = {
        symbol:           d.Symbol,
        name:             d.Name,
        sector:           d.Sector,
        industry:         d.Industry,
        market_cap:       parseFloat(d.MarketCapitalization) || 0,
        pe_ratio:         parseFloat(d.PERatio) || null,
        eps:              parseFloat(d.EPS) || null,
        dividend_yield:   parseFloat(d.DividendYield) || null,
        beta:             parseFloat(d.Beta) || null,
        week_52_high:     parseFloat(d['52WeekHigh']) || null,
        week_52_low:      parseFloat(d['52WeekLow']) || null,
        description:      d.Description,
      };

      // Store in standard cache (24 hrs) and stale fallback
      historyCache.set(key, overview, 86400);
      fallbackCache.set(key, overview);
      return overview;
    } catch (err) {
      console.error(`[MarketData] getCompanyOverview(${sym}) failed:`, err.message);
      const stale = fallbackCache.get(key);
      if (stale) return { ...stale, _stale: true };
      return null;
    } finally {
      overviewInFlight.delete(key);
    }
  })();

  overviewInFlight.set(key, fetchPromise);
  return await fetchPromise;
}

/**
 * Search stocks by symbol or name via Twelve Data /symbol_search endpoint.
 * @param {string} query
 */
export async function searchSymbols(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toUpperCase();
  const key = `search:${q}`;
  const cached = quoteCache.get(key);
  if (cached) return cached;

  try {
    const data = await td('/symbol_search', { symbol: q, outputsize: 10 });
    // Filter to NSE results for Indian stocks
    const nseResults = (data.data || []).filter(s => s.exchange === 'NSE' || s.country === 'India');
    const matches = nseResults.map(s => ({
      symbol: s.symbol,
      name: s.instrument_name,
      exchange: s.exchange,
      country: s.country,
      type: s.instrument_type,
    }));

    quoteCache.set(key, matches, 300); // 5 min cache
    return matches;
  } catch (err) {
    console.error(`[MarketData] searchSymbols(${q}) failed:`, err.message);
    return [];
  }
}

// Export getMovers alias for backward compatibility with stockController
export const getMovers = getTopMovers;

// ── Backward-compat class wrapper (portfolioService imports MarketDataService) ─
export class MarketDataService {
  static getQuote   = getQuote;
  static getQuotes  = getQuotes;
  static getIndices = getIndices;
  static getTopMovers = getTopMovers;
  static getMovers    = getTopMovers;
  static getCompanyOverview = getCompanyOverview;
  static getTimeSeries = getTimeSeries;
  static searchSymbols = searchSymbols;
}

export default MarketDataService;
