/**
 * Holding model - represents a user's holding (mutual funds, ETFs, etc.)
 * Maps to public.holdings table
 */
export class Holding {
  /**
   * @param {Object} data - Holding data
   * @param {string} data.id - Holding ID
   * @param {string} data.user_id - User ID
   * @param {string} data.symbol - Fund/symbol identifier
   * @param {number} data.quantity - Number of units
   * @param {number} data.average_price - Average purchase price per unit
   * @param {number} data.current_price - Current NAV/market price per unit
   * @param {number} data.market_value - Current market value
   * @param {number} data.unrealized_pnl - Unrealized profit/loss
   * @param {string} data.created_at - Holding creation timestamp
   * @param {string} data.updated_at - Last update timestamp
   */
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.symbol = data.symbol;
    this.quantity = parseFloat(data.quantity) || 0;
    this.average_price = parseFloat(data.average_price) || 0;
    this.current_price = parseFloat(data.current_price) || 0;
    this.market_value = parseFloat(data.market_value) || 0;
    this.unrealized_pnl = parseFloat(data.unrealized_pnl) || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Get holding by user ID and symbol
   * @param {string} userId - User ID
   * @param {string} symbol - Fund symbol
   * @returns {Promise<Holding>} Holding instance
   */
  static async findByUserIdAndSymbol(userId, symbol) {
    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase())
      .single();
    
    if (error) {
      // If no holding found, return null instead of throwing
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return new Holding(data);
  }

  /**
   * Get all holdings for a user
   * @param {string} userId - User ID
   * @returns {Promise<Holding[]>} Array of holdings
   */
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', userId)
      .neq('quantity', 0); // Only return holdings with non-zero quantity
    
    if (error) throw error;
    return data.map(holding => new Holding(holding));
  }

  /**
   * Create a new holding
   * @param {Object} holdingData - Holding data
   * @returns {Promise<Holding>} Created holding
   */
  static async create(holdingData) {
    const { data, error } = await supabase
      .from('holdings')
      .upsert({
        user_id: holdingData.user_id,
        symbol: holdingData.symbol.toUpperCase(),
        quantity: holdingData.quantity,
        average_price: holdingData.average_price,
        current_price: holdingData.current_price,
        market_value: holdingData.market_value,
        unrealized_pnl: holdingData.unrealized_pnl
      })
      .select()
      .single();
    
    if (error) throw error;
    return new Holding(data);
  }

  /**
   * Update holding after a transaction
   * @param {string} userId - User ID
   * @param {string} symbol - Fund symbol
   * @param {number} quantityChange - Change in quantity (+ for buy, - for sell)
   * @param {number} transactionPrice - Price per unit of the transaction
   * @returns {Promise<Holding>} Updated holding
   */
  static async updateFromTransaction(userId, symbol, quantityChange, transactionPrice) {
    const symbolUpper = symbol.toUpperCase();
    
    // Get existing holding
    let holding = await this.findByUserIdAndSymbol(userId, symbolUpper);
    
    if (!holding) {
      // Create new holding if none exists
      holding = await this.create({
        user_id: userId,
        symbol: symbolUpper,
        quantity: quantityChange,
        average_price: transactionPrice,
        current_price: transactionPrice, // Will be updated separately
        market_value: quantityChange * transactionPrice,
        unrealized_pnl: 0
      });
      return holding;
    }

    // Calculate new average price using weighted average
    const oldValue = holding.quantity * holding.average_price;
    const newValue = quantityChange * transactionPrice;
    const newQuantity = holding.quantity + quantityChange;
    
    let newAveragePrice = holding.average_price;
    
    if (newQuantity !== 0) {
      newAveragePrice = (oldValue + newValue) / newQuantity;
    } else {
      newAveragePrice = 0;
    }

    // Update holding
    const { data, error } = await supabase
      .from('holdings')
      .update({
        quantity: newQuantity,
        average_price: newAveragePrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', holding.id)
      .select()
      .single();
    
    if (error) throw error;
    return new Holding(data);
  }

  /**
   * Update current market price/NAV for holding
   * @param {string} holdingId - Holding ID
   * @param {number} currentPrice - Current market price/NAV per unit
   * @returns {Promise<Holding>} Updated holding
   */
  static async updateMarketPrice(holdingId, currentPrice) {
    // First get the holding to calculate values
    const { data: holdingData, error: fetchError } = await supabase
      .from('holdings')
      .select('*')
      .eq('id', holdingId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const holding = new Holding(holdingData);
    
    const { data, error } = await supabase
      .from('holdings')
      .update({
        current_price: currentPrice,
        market_value: holding.quantity * currentPrice,
        unrealized_pnl: holding.quantity * (currentPrice - holding.average_price),
        updated_at: new Date().toISOString()
      })
      .eq('id', holdingId)
      .select()
      .single();
    
    if (error) throw error;
    return new Holding(data);
  }

  /**
   * Update market prices for all holdings of a user
   * @param {string} userId - User ID
   * @param {Object} prices - Map of symbol to price
   * @returns {Promise<Holding[]>} Updated holdings
   */
  static async updateAllMarketPrices(userId, prices) {
    const holdings = await this.findByUserId(userId);
    const updates = [];
    
    for (const holding of holdings) {
      if (prices[holding.symbol]) {
        updates.push(this.updateMarketPrice(holding.id, prices[holding.symbol]));
      }
    }
    
    return Promise.all(updates);
  }
}