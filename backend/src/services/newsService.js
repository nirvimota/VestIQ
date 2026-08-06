/**
 * newsService.js
 * Fetch financial news via NewsAPI, focused on Indian markets.
 */

import axios from 'axios';
import NodeCache from 'node-cache';
import { env } from '../config/env.js';

const cache = new NodeCache({ stdTTL: env.newsCacheTtl || 600 }); // 10 min default
const BASE  = 'https://newsapi.org/v2';

function apiKey() {
  return env.newsApiKey;
}

async function fetchNews(params) {
  const res = await axios.get(`${BASE}/everything`, {
    params: {
      language: 'en',
      sortBy:   'publishedAt',
      pageSize: 20,
      apiKey:   apiKey(),
      ...params,
    },
    timeout: 8000,
  });
  return res.data?.articles || [];
}

function sanitizeText(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

function normalizeArticle(a) {
  return {
    title:       sanitizeText(a.title),
    description: sanitizeText(a.description),
    url:         a.url || '#',
    source:      a.source?.name || 'Financial News',
    image:       a.urlToImage || null,
    published_at: a.publishedAt || new Date().toISOString(),
  };
}

/**
 * Get recent news for a specific stock symbol.
 * @param {string} symbol  e.g. "RELIANCE", "TCS"
 */
export async function getStockNews(symbol) {
  const key = `news:stock:${symbol.toUpperCase()}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const articles = await fetchNews({
      q: `"${symbol}" OR "${symbol} NSE" stock India`,
    });
    const normalized = articles.map(normalizeArticle).slice(0, 10);
    cache.set(key, normalized);
    return normalized;
  } catch (err) {
    console.error(`[News] getStockNews(${symbol}) failed:`, err.message);
    return cache.get(key) || [];
  }
}

/**
 * Get general Indian market news.
 */
export async function getMarketNews() {
  const key = 'news:market:IN';
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const articles = await fetchNews({
      q: 'NIFTY OR SENSEX OR NSE OR BSE OR "Indian stock market"',
      domains: 'economictimes.com,livemint.com,businessstandard.com,moneycontrol.com,financialexpress.com',
    });
    const normalized = articles.map(normalizeArticle).slice(0, 15);
    cache.set(key, normalized);
    return normalized;
  } catch (err) {
    console.error('[News] getMarketNews failed:', err.message);
    return cache.get(key) || [];
  }
}

/**
 * Get top financial news headlines (quick summary).
 */
export async function getTopHeadlines() {
  const key = 'news:headlines:IN';
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const res = await axios.get(`${BASE}/top-headlines`, {
      params: {
        category: 'business',
        country:  'in',
        pageSize: 10,
        apiKey:   apiKey(),
      },
      timeout: 8000,
    });
    const articles = (res.data?.articles || []).map(normalizeArticle);
    cache.set(key, articles);
    return articles;
  } catch (err) {
    console.error('[News] getTopHeadlines failed:', err.message);
    return cache.get(key) || [];
  }
}

export default { getStockNews, getMarketNews, getTopHeadlines };
