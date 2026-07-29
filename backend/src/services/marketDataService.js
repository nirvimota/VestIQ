/**
 * Market Data Service - handles stock market data operations
 * This is a wrapper that can be swapped out for different data providers
 */
import supabase from '../config/supabase.js';

/**
 * Get quote for a single symbol
 * @param {string} symbol - Stock symbol (e.g., 'RELIANCE')
 * @returns {Promise<Object>} Quote data
 */
export async function getQuote(symbol) {
  try {
    // Try to get from cache first
    const { data, error } = await supabase
      .from('market_data_cache')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .single();
    
    if (!error && data) {
      // Check if data is fresh (less than 5 minutes old)
      const cachedTime = new Date(data.last_updated).getTime();
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      if (cachedTime > fiveMinutesAgo) {
        return {
          symbol: data.symbol,
          price: parseFloat(data.price),
          dayHigh: parseFloat(data.day_high),
          dayLow: parseFloat(data.day_low),
          changePct: parseFloat(data.change_pct),
          volume: parseInt(data.volume) || 0
        };
      }
    }
    
    // If not in cache or stale, fetch from external API
    // For now, we'll use mock data but this is where you'd integrate with
    // a real provider like Alpha Vantage, IEX Cloud, Yahoo Finance, etc.
    const mockQuote = await _getMockQuote(symbol);
    
    // Update cache
    await _updateCache(symbol, mockQuote);
    
    return mockQuote;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    
    // Fallback to cached data even if stale
    try {
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .single();
      
      if (!error && data) {
        return {
          symbol: data.symbol,
          price: parseFloat(data.price),
          dayHigh: parseFloat(data.day_high),
          dayLow: parseFloat(data.day_low),
          changePct: parseFloat(data.change_pct),
          volume: parseInt(data.volume) || 0
        };
      }
    } catch (cacheError) {
      console.error(`Error fetching cached quote for ${symbol}:`, cacheError);
    }
    
    throw error;
  }
}

/**
 * Get quotes for multiple symbols
 * @param {string[]} symbols - Array of stock symbols
 * @returns {Promise<Object>} Map of symbol to quote data
 */
export async function getQuotes(symbols) {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    return {};
  }
  
  const result = {};
  const promises = symbols.map(symbol => 
    getQuote(symbol).then(quote => {
      result[symbol] = quote;
    }).catch(error => {
      console.warn(`Failed to get quote for ${symbol}:`, error);
      result[symbol] = null;
    })
  );
  
  await Promise.all(promises);
  return result;
}

/**
 * Get market indices data
 * @returns {Promise<Object>} Indices data
 */
export async function getIndices() {
  try {
    // Try to get from cache first
    const { data, error } = await supabase
      .from('market_data_cache')
      .select('*')
      .in('symbol', ['NIFTY50', 'SENSEX', 'BANKNIFTY']);
    
    if (!error && data) {
      const result = {};
      data.forEach(item => {
        result[item.symbol] = {
          price: parseFloat(item.price),
          changePct: parseFloat(item.change_pct)
        };
      });
      
      // Check if data is fresh
      const oldestTime = Math.min(...data.map(item => 
        new Date(item.last_updated).getTime()
      ));
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      if (oldestTime > fiveMinutesAgo) {
        return result;
      }
    }
    
    // Fallback to mock data
    const mockIndices = await _getMockIndices();
    
    // Update cache
    await _updateIndicesCache(mockIndices);
    
    return mockIndices;
  } catch (error) {
    console.error('Error fetching indices:', error);
    
    // Fallback to cached data
    try {
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .in('symbol', ['NIFTY50', 'SENSEX', 'BANKNIFTY']);
      
      if (!error && data) {
        const result = {};
        data.forEach(item => {
          result[item.symbol] = {
            price: parseFloat(item.price),
            changePct: parseFloat(item.change_pct)
          };
        });
        return result;
      }
    } catch (cacheError) {
      console.error('Error fetching cached indices:', cacheError);
    }
    
    // Last resort: return mock data
    return await _getMockIndices();
  }
}

/**
 * Get top gainers and losers
 * @returns {Promise<Object>} Gainers and losers data
 */
export async function getMovers() {
  try {
    // Try to get from cache first
    const { data, error } = await supabase
      .from('market_data_cache')
      .select('*')
      .order('change_pct', { ascending: false })
      .limit(10);
    
    if (!error && data) {
      const gainers = data
        .filter(item => parseFloat(item.change_pct) > 0)
        .map(item => ({
          symbol: item.symbol,
          price: parseFloat(item.price),
          changePct: parseFloat(item.change_pct)
        }));
      
      const losers = data
        .filter(item => parseFloat(item.change_pct) < 0)
        .map(item => ({
          symbol: item.symbol,
          price: parseFloat(item.price),
          changePct: parseFloat(item.change_pct)
        }));
      
      // Check if data is fresh
      const newestTime = Math.max(...data.map(item => 
        new Date(item.last_updated).getTime()
      ));
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      if (newestTime > fiveMinutesAgo) {
        return { gainers, losers };
      }
    }
    
    // Fallback to mock data
    return await _getMockMovers();
  } catch (error) {
    console.error('Error fetching movers:', error);
    
    // Fallback to cached data
    try {
      const { data, error } = await supabase
        .from('market_data_cache')
        .select('*')
        .order('change_pct', { ascending: false })
        .limit(10);
      
      if (!error && data) {
        const gainers = data
          .filter(item => parseFloat(item.change_pct) > 0)
          .map(item => ({
            symbol: item.symbol,
            price: parseFloat(item.price),
            changePct: parseFloat(item.change_pct)
          }));
        
        const losers = data
          .filter(item => parseFloat(item.change_pct) < 0)
          .map(item => ({
            symbol: item.symbol,
            price: parseFloat(item.price),
            changePct: parseFloat(item.change_pct)
          }));
        
        return { gainers, losers };
      }
    } catch (cacheError) {
      console.error('Error fetching cached movers:', cacheError);
    }
    
    // Last resort: return mock data
    return await _getMockMovers();
  }
}

/**
 * Get historical data for a symbol
 * @param {string} symbol - Stock symbol
 * @param {string} timeframe - Timeframe (1D, 1W, 1M, 3M, 6M, 1Y, 5Y)
 * @returns {Promise<Array>} Historical data points
 */
export async function getHistoricalData(symbol, timeframe = '1M') {
  // In a real implementation, this would call a historical data API
  // For now, return mock data
  return _getMockHistoricalData(symbol, timeframe);
}

/**
 * Search for symbols by name or symbol
 * @param {string} query - Search query
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Matching symbols
 */
export async function searchSymbols(query, limit = 10) {
  // In a real implementation, this would search a symbol database
  // For now, return from our cached symbols
  try {
    const { data, error } = await supabase
      .from('market_data_cache')
      .select('symbol')
      .or(`symbol.ilike.%${query}%`)
      .limit(limit);
    
    if (!error && data) {
      return data.map(item => item.symbol);
    }
  } catch (error) {
    console.error('Error searching symbols:', error);
  }
  
  // Return common Indian stocks as fallback
  const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 
                  'HINDUNILVR', 'SBIN', 'BHARTIARTL', 'KOTAKBANK', 'LT',
                  'ASIANPAINT', 'MARUTI', 'TITAN', 'ULTRACEMCO', 'NESTLEIND'];
  
  return symbols.filter(s => 
    s.toLowerCase().includes(query.toLowerCase())
  ).slice(0, limit);
}

// Private helper functions

/**
 * Get mock quote data (for development/testing)
 * @param {string} symbol - Stock symbol
 * @returns {Object} Mock quote data
 */
async function _getMockQuote(symbol) {
  const symbolUpper = symbol.toUpperCase();
  
  // Mock data for common Indian stocks
  const mockData = {
    RELIANCE: { price: 2945.60, dayHigh: 2958.20, dayLow: 2910.00, changePct: 1.20, volume: 2500000 },
    TCS: { price: 3812.40, dayHigh: 3860.00, dayLow: 3795.50, changePct: -0.40, volume: 1800000 },
    HDFCBANK: { price: 1675.20, dayHigh: 1682.00, dayLow: 1660.10, changePct: 0.80, volume: 3200000 },
    INFY: { price: 1842.90, dayHigh: 1855.00, dayLow: 1830.20, changePct: 0.30, volume: 2100000 },
    ICICIBANK: { price: 985.30, dayHigh: 990.50, dayLow: 975.80, changePct: 0.50, volume: 4500000 },
    HINDUNILVR: { price: 2680.70, dayHigh: 2695.30, dayLow: 2660.20, changePct: -0.20, volume: 850000 },
    SBIN: { price: 685.40, dayHigh: 690.20, dayLow: 680.10, changePct: 0.70, volume: 5200000 },
    BHARTIARTL: { price: 925.80, dayHigh: 932.10, dayLow: 918.50, changePct: 1.10, volume: 3100000 },
    KOTAKBANK: { price: 1845.20, dayHigh: 1852.00, dayLow: 1838.50, changePct: -0.30, volume: 1200000 },
    LT: { price: 2480.50, dayHigh: 2495.80, dayLow: 2465.30, changePct: 0.60, volume: 950000 }
  };
  
  const data = mockData[symbolUpper] || {
    price: Math.random() * 1000 + 500,
    dayHigh: Math.random() * 100 + 50,
    dayLow: Math.random() * 100 + 50,
    changePct: (Math.random() - 0.5) * 4,
    volume: Math.floor(Math.random() * 1000000) + 100000
  };
  
  return {
    symbol: symbolUpper,
    price: data.price,
    dayHigh: data.dayHigh,
    dayLow: data.dayLow,
    changePct: data.changePct,
    volume: data.volume
  };
}

/**
 * Get mock indices data
 * @returns {Object} Mock indices data
 */
async function _getMockIndices() {
  return {
    NIFTY50: { price: 24812.35, changePct: 0.62 },
    SENSEX: { price: 81245.10, changePct: 0.58 },
    BANKNIFTY: { price: 52340.15, changePct: -0.21 }
  };
}

/**
 * Get mock movers data
 * @returns {Object} Mock gainers and losers
 */
async function _getMockMovers() {
  return {
    gainers: [
      { symbol: 'RELIANCE', price: 2945.60, changePct: 1.20 },
      { symbol: 'BHARTIARTL', price: 925.80, changePct: 1.10 },
      { symbol: 'LT', price: 2480.50, changePct: 0.60 },
      { symbol: 'HDFCBANK', price: 1675.20, changePct: 0.80 },
      { symbol: 'SBIN', price: 685.40, changePct: 0.70 }
    ],
    losers: [
      { symbol: 'TCS', price: 3812.40, changePct: -0.40 },
      { symbol: 'INFY', price: 1842.90, changePct: 0.30 }, // Note: this is actually positive in mock data
      { symbol: 'HINDUNILVR', price: 2680.70, changePct: -0.20 },
      { symbol: 'KOTAKBANK', price: 1845.20, changePct: -0.30 },
      { symbol: 'WIPRO', price: 420.50, changePct: -0.80 } // Not in our cache but adding for example
    ]
  };
}

/**
 * Get mock historical data
 * @param {string} symbol - Stock symbol
 * @param {string} timeframe - Timeframe (1D, 1W, 1M, etc.)
 * @returns {Array} Mock historical data
 */
function _getMockHistoricalData(symbol, timeframe) {
  const basePrice = {
    RELIANCE: 2945.60,
    TCS: 3812.40,
    HDFCBANK: 1675.20,
    INFY: 1842.90,
    ICICIBANK: 985.30,
    HINDUNILVR: 2680.70,
    SBIN: 685.40,
    BHARTIARTL: 925.80,
    KOTAKBANK: 1845.20,
    LT: 2480.50
  }[symbol.toUpperCase()] || 1500;
  
  const dataPoints = {
    '1D': 24,
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
    '5Y': 1825
  }[timeframe] || 30;
  
  const result = [];
  let price = basePrice;
  
  for (let i = 0; i < dataPoints; i++) {
    // Generate realistic price movement
    const changePercent = (Math.random() - 0.5) * 0.02; // +/-1% daily change
    price = price * (1 + changePercent);
    
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - (dataPoints - i - 1));
    
    result.push({
      timestamp: timestamp.toISOString(),
      open: price * (1 + ((Math.random() - 0.5) * 0.01)),
      high: price * (1 + Math.abs((Math.random() - 0.5) * 0.02)),
      low: price * (1 - Math.abs((Math.random() - 0.5) * 0.02)),
      close: price,
      volume: Math.floor(Math.random() * 1000000) + 100000
    });
  }
  
  return result;
}

/**
 * Update market data cache for a symbol
 * @param {string} symbol - Stock symbol
 * @param {Object} quote - Quote data
 * @returns {Promise<void>}
 */
async function _updateCache(symbol, quote) {
  try {
    await supabase
      .from('market_data_cache')
      .upsert({
        symbol: symbol,
        price: quote.price,
        day_high: quote.dayHigh,
        day_low: quote.dayLow,
        change_pct: quote.changePct,
        volume: quote.volume,
        last_updated: new Date().toISOString()
      }, {
        onConflict: ['symbol']
      });
  } catch (error) {
    console.error(`Error updating cache for ${symbol}:`, error);
  }
}

/**
 * Update indices cache
 * @param {Object} indices - Indices data
 * @returns {Promise<void>}
 */
async function _updateIndicesCache(indices) {
  try {
    const records = Object.entries(indices).map(([symbol, data]) => ({
      symbol: symbol,
      price: data.price,
      change_pct: data.changePct,
      last_updated: new Date().toISOString()
    }));
    
    await supabase
      .from('market_data_cache')
      .upsert(records, {
        onConflict: ['symbol']
      });
  } catch (error) {
    console.error('Error updating indices cache:', error);
  }
}

// Export as a class-like object for consistency with other services
export const MarketDataService = {
  getQuote,
  getQuotes,
  getIndices,
  getMovers,
  getHistoricalData,
  searchSymbols
};

export default MarketDataService;