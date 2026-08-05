import supabase from '../config/supabase.js';

/**
 * Transaction model - represents a financial transaction (trade, deposit, withdrawal, etc.)
 * Maps to public.transactions table
 */
export class Transaction {
  /**
   * @param {Object} data - Transaction data
   * @param {string} data.id - Transaction ID
   * @param {string} data.user_id - User ID
   * @param {string|null} data.order_id - Related order ID (if applicable)
   * @param {'buy'|'sell'|'deposit'|'withdrawal'|'dividend'|'fee'} data.type - Transaction type
   * @param {string|null} data.symbol - Stock symbol (if applicable)
   * @param {number|null} data.quantity - Quantity of shares (if applicable)
   * @param {number|null} data.price - Price per share (if applicable)
   * @param {number} data.amount - Total transaction amount
   * @param {number} data.fees - Associated fees
   * @param {number} data.net_amount - Net amount after fees
   * @param {'pending'|'completed'|'failed'} data.status - Transaction status
   * @param {string} data.created_at - Transaction timestamp
   */
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.order_id = data.order_id;
    this.type = data.type;
    this.symbol = data.symbol;
    this.quantity = data.quantity ? parseFloat(data.quantity) : null;
    this.price = data.price ? parseFloat(data.price) : null;
    this.amount = parseFloat(data.amount) || 0;
    this.fees = parseFloat(data.fees) || 0;
    this.net_amount = parseFloat(data.net_amount) || 0;
    this.status = data.status;
    this.created_at = data.created_at;
  }

  /**
   * Get transactions for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters (type, startDate, endDate, etc.)
   * @param {number} limit - Limit results
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Transaction[]>} Array of transactions
   */
  static async findByUserId(userId, filters = {}, limit = 50, offset = 0) {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    
    if (filters.symbol) {
      query = query.eq('symbol', filters.symbol.toUpperCase());
    }
    
    // Apply pagination
    if (limit) {
      query = query.limit(limit);
    }
    if (offset > 0) {
      query = query.offset(offset);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data.map(tx => new Transaction(tx));
  }

  /**
   * Get transaction by ID
   * @param {string} transactionId - Transaction ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Transaction>} Transaction instance
   */
  static async findById(transactionId, userId) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return new Transaction(data);
  }

  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Transaction>} Created transaction
   */
  static async create(transactionData) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: transactionData.user_id,
        order_id: transactionData.order_id || null,
        type: transactionData.type,
        symbol: transactionData.symbol ? transactionData.symbol.toUpperCase() : null,
        quantity: transactionData.quantity,
        price: transactionData.price,
        amount: transactionData.amount,
        fees: transactionData.fees || 0,
        net_amount: transactionData.net_amount,
        status: transactionData.status || 'completed'
      })
      .select()
      .single();
    
    if (error) throw error;
    return new Transaction(data);
  }

  /**
   * Update transaction status
   * @param {string} transactionId - Transaction ID
   * @param {string} userId - User ID (for authorization)
   * @param {string} status - New status
   * @returns {Promise<Transaction>} Updated transaction
   */
  static async updateStatus(transactionId, userId, status) {
    const { data, error } = await supabase
      .from('transactions')
      .update({ status })
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return new Transaction(data);
  }

  /**
   * Get transaction summary for a user (total invested, fees paid, etc.)
   * @param {string} userId - User ID
   * @param {Object} dateRange - Optional date range { startDate, endDate }
   * @returns {Promise<Object>} Summary statistics
   */
  static async getSummary(userId, dateRange = {}) {
    let query = supabase
      .from('transactions')
      .select('type, amount, fees, net_amount')
      .eq('user_id', userId);
    
    // Apply date filter if provided
    if (dateRange.startDate) {
      query = query.gte('created_at', dateRange.startDate);
    }
    if (dateRange.endDate) {
      query = query.lte('created_at', dateRange.endDate);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Calculate summary
    const summary = {
      total_invested: 0,
      total_withdrawn: 0,
      total_fees: 0,
      net_invested: 0,
      buy_count: 0,
      sell_count: 0,
      deposit_count: 0,
      withdrawal_count: 0
    };
    
    data.forEach(tx => {
      switch (tx.type) {
        case 'buy':
          summary.total_invested += Math.abs(tx.amount);
          summary.buy_count++;
          break;
        case 'sell':
          summary.total_withdrawn += Math.abs(tx.amount);
          summary.sell_count++;
          break;
        case 'deposit':
          summary.total_invested += tx.amount;
          summary.deposit_count++;
          break;
        case 'withdrawal':
          summary.total_withdrawn += Math.abs(tx.amount);
          summary.withdrawal_count++;
          break;
      }
      
      summary.total_fees += Math.abs(tx.fees);
    });
    
    summary.net_invested = summary.total_invested - summary.total_withdrawn;
    
    return summary;
  }
}