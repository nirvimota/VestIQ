/**
 * Position model - represents a user's stock position
 * Maps to public.positions table
 */
export class Position {
  /**
   * @param {Object} data - Position data
   * @param {string} data.id - Position ID
   * @param {string} data.user_id - User ID
   * @param {string} data.symbol - Stock symbol
   * @param {number} data.quantity - Number of shares (can be fractional)
   * @param {number} data.average_price - Average purchase price
   * @param {number} data.current_price - Current market price
   * @param {number} data.market_value - Current market value (quantity * current_price)
   * @param {number} data.unrealized_pnl - Unrealized profit/loss
   * @param {number} data.realized_pnl - Realized profit/loss from closed positions
   * @param {string} data.created_at - Position creation timestamp
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
    this.realized_pnl = parseFloat(data.realized_pnl) || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Get position by user ID and symbol
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Position>} Position instance
   */
  static async findByUserIdAndSymbol(userId, symbol) {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase())
      .single();
    
    if (error) {
      // If no position found, return null instead of throwing
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return new Position(data);
  }

  /**
   * Get all positions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Position[]>} Array of positions
   */
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .neq('quantity', 0); // Only return positions with non-zero quantity
    
    if (error) throw error;
    return data.map(position => new Position(position));
  }

  /**
   * Create a new position
   * @param {Object} positionData - Position data
   * @returns {Promise<Position>} Created position
   */
  static async create(positionData) {
    const { data, error } = await supabase
      .from('positions')
      .upsert({
        user_id: positionData.user_id,
        symbol: positionData.symbol.toUpperCase(),
        quantity: positionData.quantity,
        average_price: positionData.average_price,
        current_price: positionData.current_price,
        market_value: positionData.market_value,
        unrealized_pnl: positionData.unrealized_pnl,
        realized_pnl: positionData.realized_pnl
      })
      .select()
      .single();
    
    if (error) throw error;
    return new Position(data);
  }

  /**
   * Update position after a trade
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @param {number} quantityChange - Change in quantity (+ for buy, - for sell)
   * @param {number} tradePrice - Price of the trade
   * @returns {Promise<Position>} Updated position
   */
  static async updateFromTrade(userId, symbol, quantityChange, tradePrice) {
    const symbolUpper = symbol.toUpperCase();
    
    // Get existing position
    let position = await this.findByUserIdAndSymbol(userId, symbolUpper);
    
    if (!position) {
      // Create new position if none exists
      position = await this.create({
        user_id: userId,
        symbol: symbolUpper,
        quantity: quantityChange,
        average_price: tradePrice,
        current_price: tradePrice, // Will be updated separately
        market_value: quantityChange * tradePrice,
        unrealized_pnl: 0,
        realized_pnl: 0
      });
      return position;
    }

    // Calculate new average price using weighted average
    const oldValue = position.quantity * position.average_price;
    const newValue = quantityChange * tradePrice;
    const newQuantity = position.quantity + quantityChange;
    
    let newAveragePrice = position.average_price;
    let realizedPnl = 0;
    
    if (newQuantity === 0) {
      // Position closed - calculate realized P&L
      realizedPnl = (tradePrice - position.average_price) * quantityChange;
      newAveragePrice = 0;
    } else if ((position.quantity > 0 && quantityChange > 0) || 
               (position.quantity < 0 && quantityChange < 0)) {
      // Same direction - average down/up
      newAveragePrice = (oldValue + newValue) / newQuantity;
    } else {
      // Opposite direction - partial or full close
      const closedQuantity = Math.min(Math.abs(position.quantity), Math.abs(quantityChange));
      realizedPnl = (tradePrice - position.average_price) * closedQuantity * 
                   (position.quantity > 0 ? 1 : -1);
                   
      if (Math.abs(newQuantity) < Math.abs(position.quantity)) {
        // Partially closed - keep same average price
        newAveragePrice = position.average_price;
      } else if (newQuantity === 0) {
        // Fully closed
        newAveragePrice = 0;
      } else {
        // Reversed position
        newAveragePrice = tradePrice;
      }
    }

    // Update position
    const { data, error } = await supabase
      .from('positions')
      .update({
        quantity: newQuantity,
        average_price: newAveragePrice,
        realized_pnl: position.realized_pnl + realizedPnl,
        updated_at: new Date().toISOString()
      })
      .eq('id', position.id)
      .select()
      .single();
    
    if (error) throw error;
    return new Position(data);
  }

  /**
   * Update current market price for position
   * @param {string} positionId - Position ID
   * @param {number} currentPrice - Current market price
   * @returns {Promise<Position>} Updated position
   */
  static async updateMarketPrice(positionId, currentPrice) {
    const { data, error } = await supabase
      .from('positions')
      .update({
        current_price: currentPrice,
        market_value: this.quantity * currentPrice,
        unrealized_pnl: this.quantity * (currentPrice - this.average_price),
        updated_at: new Date().toISOString()
      })
      .eq('id', positionId)
      .select()
      .single();
    
    if (error) throw error;
    return new Position(data);
  }

  /**
   * Update market prices for all positions of a user
   * @param {string} userId - User ID
   * @param {Object} prices - Map of symbol to price
   * @returns {Promise<Position[]>} Updated positions
   */
  static async updateAllMarketPrices(userId, prices) {
    const positions = await this.findByUserId(userId);
    const updates = [];
    
    for (const position of positions) {
      if (prices[position.symbol]) {
        updates.push(this.updateMarketPrice(position.id, prices[position.symbol]));
      }
    }
    
    return Promise.all(updates);
  }
}