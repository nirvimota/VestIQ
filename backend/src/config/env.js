import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // Market Data — Twelve Data
  twelveDataApiKey: process.env.TWELVE_DATA_API_KEY,

  // Company Fundamentals — Alpha Vantage
  alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,

  // News — NewsAPI
  newsApiKey: process.env.NEWS_API_KEY,

  // AI — xAI Grok 4.5
  grokApiKey: process.env.GROK_API_KEY,
  grokBaseUrl: process.env.GROK_BASE_URL || 'https://api.x.ai/v1',
  grokModel: process.env.GROK_MODEL || 'grok-4-5',

  // Cache TTL (seconds)
  quoteCacheTtl: parseInt(process.env.QUOTE_CACHE_TTL || '15', 10),
  newsCacheTtl: parseInt(process.env.NEWS_CACHE_TTL || '600', 10),
  indexCacheTtl: parseInt(process.env.INDEX_CACHE_TTL || '30', 10),
};
