import supabase from '../config/supabase.js';
import { WatchlistItem } from '../models/Watchlist.js';
import { MarketDataService } from './marketDataService.js';

/**
 * Watchlist Service - handles watchlist operations
 */
export class WatchlistService {
  /**
   * Get user's watchlist with current prices
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Watchlist items with current prices
   */
  static async getUserWatchlist(userId) {
    // Get watchlist items
    const watchlistItems = await WatchlistItem.findByUserId(userId);
    
    if (watchlistItems.length === 0) {
      return [];
    }
    
    // Extract symbols
    const symbols = watchlistItems.map(item => item.symbol);
    
    // Get current prices for all symbols
    const prices = await MarketDataService.getQuotes(symbols);
    
    // Combine watchlist items with current prices
    return watchlistItems.map(item => ({
      id: item.id,
      symbol: item.symbol,
      addedAt: item.added_at,
      ...(prices[item.symbol] || {})
    }));
  }

  /**
   * Add a symbol to user's watchlist
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Added item with current price
   */
  static async addToWatchlist(userId, symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    // Add to watchlist
    const watchlistItem = await WatchlistItem.add(userId, symbolUpper);
    
    // Get current price
    const quote = await MarketDataService.getQuote(symbolUpper);
    
    return {
      id: watchlistItem.id,
      symbol: watchlistItem.symbol,
      addedAt: watchlistItem.added_at,
      ...(quote || {})
    };
  }

  /**
   * Remove a symbol from user's watchlist
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @returns {Promise<boolean>} True if removed
   */
  static async removeFromWatchlist(userId, symbol) {
    return await WatchlistItem.remove(userId, symbol);
  }

  /**
   * Check if symbol is in user's watchlist
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @returns {Promise<boolean>} True if in watchlist
   */
  static async isInWatchlist(userId, symbol) {
    return await WatchlistItem.exists(userId, symbol);
  }

  /**
   * Get multiple quotes for watchlist symbols
   * @param {string} userId - User ID
   * @param {Array<string>} symbols - Symbols to get quotes for
   * @returns {Promise<Object>} Map of symbol to quote data
   */
  static async getQuotesForSymbols(userId, symbols) {
    // Verify user owns these watchlist items
    const userWatchlist = await this.getUserWatchlist(userId);
    const userSymbols = userWatchlist.map(item => item.symbol);
    
    // Filter to only symbols user actually has in watchlist
    const validSymbols = symbols.filter(symbol => userSymbols.includes(symbol.toUpperCase()));
    
    if (validSymbols.length === 0) {
      return {};
    }
    
    return await MarketDataService.getQuotes(validSymbols);
  }

  /**
   * Get watchlist count for user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of items in watchlist
   */
  static async getWatchlistCount(userId) {
    const watchlist = await this.getUserWatchlist(userId);
    return watchlist.length;
  }

  /**
   * Clear user's entire watchlist
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of items removed
   */
  static async clearWatchlist(userId) {
    return await WatchlistItem.clear(userId);
  }
}

export default WatchlistService;