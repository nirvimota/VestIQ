/**
 * Order model - represents a buy/sell order
 * Maps to public.orders table
 */
export class Order {
  /**
   * @param {Object} data - Order data
   * @param {string} data.id - Order ID
   * @param {string} data.user_id - User ID
   * @param {string} data.symbol - Stock symbol (e.g., 'RELIANCE')
   * @param {'buy'|'sell'} data.side - Buy or sell
   * @param {'market'|'limit'|'stop-loss'} data.order_type - Order type
   * @param {number} data.quantity - Number of shares
   * @param {number|null} data.price - Price per share (null for market orders)
   * @param {'pending'|'filled'|'partial'|'rejected'|'cancelled'} data.status - Order status
   * @param {number} data.filled_quantity - Quantity already filled
   * @param {number|null} data.average_price - Average fill price
   * @param {string} data.created_at - Order creation timestamp
   * @param {string} data.updated_at - Last update timestamp
   */
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.symbol = data.symbol;
    this.side = data.side;
    this.order_type = data.order_type;
    this.quantity = data.quantity;
    this.price = data.price;
    this.status = data.status;
    this.filled_quantity = data.filled_quantity || 0;
    this.average_price = data.average_price;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise<Order>} Created order instance
   */
  static async create(orderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: orderData.user_id,
        symbol: orderData.symbol,
        side: orderData.side,
        order_type: orderData.order_type,
        quantity: orderData.quantity,
        price: orderData.price || null,
        status: orderData.status || 'pending',
        filled_quantity: orderData.filled_quantity || 0,
        average_price: orderData.average_price || null
      })
      .select()
      .single();
    
    if (error) throw error;
    return new Order(data);
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Order>} Order instance
   */
  static async findById(orderId, userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return new Order(data);
  }

  /**
   * Get orders for a user with optional filtering
   * @param {string} userId - User ID
   * @param {Object} filters - Filter criteria
   * @param {number} limit - Limit results
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Order[]>} Array of orders
   */
  static async findByUserId(userId, filters = {}, limit = 50, offset = 0) {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.symbol) {
      query = query.eq('symbol', filters.symbol);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
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
    return data.map(order => new Order(order));
  }

  /**
   * Update order status
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} updates - Fields to update
   * @returns {Promise<Order>} Updated order
   */
  static async update(orderId, userId, updates) {
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return new Order(data);
  }

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Order>} Cancelled order
   */
  static async cancel(orderId, userId) {
    return this.update(orderId, userId, { status: 'cancelled' });
  }

  /**
   * Update fill information for partial/full fills
   * @param {string} orderId - Order ID
   * @param {number} filledQuantity - New filled quantity
   * @param {number} averagePrice - Average price of fills
   * @returns {Promise<Order>} Updated order
   */
  static async updateFill(orderId, filledQuantity, averagePrice) {
    // Determine new status based on fill status
    let newStatus = 'partial';
    if (filledQuantity >= this.quantity) {
      newStatus = 'filled';
    } else if (filledQuantity > 0) {
      newStatus = 'partial';
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        filled_quantity: filledQuantity,
        average_price: averagePrice,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    return new Order(data);
  }
}