import supabase from '../config/supabase.js';

/**
 * Watchlist model - represents a user's watchlist items
 * Maps to public.watchlist table
 */
export class WatchlistItem {
  /**
   * @param {Object} data - Watchlist item data
   * @param {string} data.id - Watchlist item ID
   * @param {string} data.user_id - User ID
   * @param {string} data.symbol - Stock symbol
   * @param {string} data.added_at - Timestamp when added to watchlist
   */
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.symbol = data.symbol;
    this.added_at = data.added_at;
  }

  /**
   * Check if a symbol is in user's watchlist
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @returns {Promise<boolean>} True if in watchlist
   */
  static async exists(userId, symbol) {
    const { count, error } = await supabase
      .from('watchlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase());
    
    if (error) throw error;
    return (count || 0) > 0;
  }

  /**
   * Get all watchlist items for a user
   * @param {string} userId - User ID
   * @returns {Promise<WatchlistItem[]>} Array of watchlist items
   */
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });
    
    if (error) throw error;
    return data.map(item => new WatchlistItem(item));
  }

  /**
   * Add a symbol to user's watchlist
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @returns {Promise<WatchlistItem>} Created watchlist item
   */
  static async add(userId, symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    // Check if already exists
    const exists = await this.exists(userId, symbolUpper);
    if (exists) {
      // Return existing item
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol', symbolUpper)
        .single();
      
      if (error) throw error;
      return new WatchlistItem(data);
    }
    
    // Add new item
    const { data, error } = await supabase
      .from('watchlist')
      .insert({
        user_id: userId,
        symbol: symbolUpper
      })
      .select()
      .single();
    
    if (error) throw error;
    return new WatchlistItem(data);
  }

  /**
   * Remove a symbol from user's watchlist
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @returns {Promise<boolean>} True if removed
   */
  static async remove(userId, symbol) {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase());
    
    if (error) throw error;
    return true;
  }

  /**
   * Clear user's entire watchlist
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of items removed
   */
  static async clear(userId) {
    const { count, error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
    return count || 0;
  }
}