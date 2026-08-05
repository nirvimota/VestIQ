import supabase from '../config/supabase.js';
import { Order } from '../models/Order.js';
import { Transaction } from '../models/Transaction.js';
import { PortfolioService } from './portfolioService.js';
import { MarketDataService } from './marketDataService.js';
import { RiskCheckService } from './riskCheckService.js';
import { AuditLogService } from './auditLogService.js';

/**
 * Order Service - handles all order-related operations
 */
export class OrderService {
  /**
   * Place a new order
   * @param {Object} orderData - Order details
   * @param {string} orderData.user_id - User ID
   * @param {string} orderData.symbol - Stock symbol
   * @param {'buy'|'sell'} orderData.side - Buy or sell
   * @param {'market'|'limit'|'stop-loss'} orderData.order_type - Order type
   * @param {number} orderData.quantity - Number of shares
   * @param {number|null} orderData.price - Price per share (null for market orders)
   * @returns {Promise<Order>} Created order
   */
  static async placeOrder(orderData) {
    const { user_id, symbol, side, order_type, quantity, price } = orderData;
    const uppercaseSymbol = symbol.toUpperCase();
    
    // Determine price for checks
    const effectivePrice = price || await this._getCurrentPrice(uppercaseSymbol);
    if (!effectivePrice || effectivePrice <= 0) {
      throw new Error(`Unable to determine price for stock ${uppercaseSymbol}`);
    }

    // Gather risk check parameters
    const fundsSummary = await PortfolioService.getFundsSummary(user_id);
    const availableBalance = parseFloat(fundsSummary?.available_balance || 0);

    const positions = await PortfolioService.getPositions(user_id);
    const existingPosition = positions.find(p => p.symbol === uppercaseSymbol);
    const holdingQuantity = existingPosition ? existingPosition.quantity : 0;

    const portfolioSummary = await PortfolioService.getPortfolioSummary(user_id);
    const portfolioValue = portfolioSummary?.totalMarketValue || 0;

    // Run comprehensive Pre-Trade Risk Check
    const riskCheck = await RiskCheckService.preTradeCheck({
      side,
      quantity,
      price: effectivePrice,
      availableBalance,
      holdingQuantity,
      portfolioValue
    });

    if (!riskCheck.passed) {
      throw new Error(`Risk Check Failed: ${riskCheck.reason}`);
    }
    
    // Create the order
    const order = await Order.create({
      user_id,
      symbol: uppercaseSymbol,
      side,
      order_type,
      quantity,
      price: price || null,
      status: 'pending'
    });
    
    // Log the action
    await AuditLogService.logAction(user_id, 'ORDER_PLACED', {
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      order_type: order.order_type,
      price: order.price
    });
    
    // If it's a market order, attempt immediate execution
    if (order_type === 'market') {
      await this._executeMarketOrder(order.id);
    }
    
    return order;
  }

  /**
   * Get orders for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @param {number} limit - Limit results
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Order[]>} Array of orders
   */
  static async getUserOrders(userId, filters = {}, limit = 50, offset = 0) {
    return await Order.findByUserId(userId, filters, limit, offset);
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Order>} Order
   */
  static async getOrderById(orderId, userId) {
    return await Order.findById(orderId, userId);
  }

  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Order>} Cancelled order
   */
  static async cancelOrder(orderId, userId) {
    // First get the order to verify it can be cancelled
    const order = await Order.findById(orderId, userId);
    
    if (!['pending', 'partially_filled'].includes(order.status)) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }
    
    const updatedOrder = await Order.update(orderId, userId, { status: 'cancelled' });
    
    // Log the action
    await AuditLogService.logAction(userId, 'ORDER_CANCELLED', {
      orderId: updatedOrder.id,
      symbol: updatedOrder.symbol
    });
    
    return updatedOrder;
  }

  /**
   * Get open orders for a user
   * @param {string} userId - User ID
   * @returns {Promise<Order[]>} Open orders
   */
  static async getOpenOrders(userId) {
    return await Order.findByUserId(userId, { status: ['pending', 'partially_filled'] });
  }

  /**
   * Get order statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Order statistics
   */
  static async getOrderStats(userId) {
    const orders = await Order.findByUserId(userId);
    
    const stats = {
      total: orders.length,
      pending: 0,
      filled: 0,
      cancelled: 0,
      rejected: 0
    };
    
    orders.forEach(order => {
      if (order.status === 'pending') stats.pending++;
      else if (order.status === 'filled') stats.filled++;
      else if (order.status === 'cancelled') stats.cancelled++;
      else if (order.status === 'rejected') stats.rejected++;
    });
    
    return stats;
  }

  /**
   * Private: Check if user has sufficient funds for a buy order
   * @param {string} userId - User ID
   * @param {number} quantity - Number of shares
   * @param {number} price - Price per share
   * @returns {Object} Result with sufficient flag and message
   */
  static async _checkFundsForBuy(userId, quantity, price) {
    const totalCost = quantity * price;
    
    // Get user's available balance
    const { data: fundsData, error: fundsError } = await supabase
      .from('funds')
      .select('available_balance')
      .eq('user_id', userId)
      .single();
    
    if (fundsError) throw fundsError;
    
    const availableBalance = parseFloat(fundsData.available_balance) || 0;
    
    if (totalCost > availableBalance) {
      return {
        sufficient: false,
        message: `Insufficient funds. Required: ₹${totalCost.toFixed(2)}, Available: ₹${availableBalance.toFixed(2)}`
      };
    }
    
    return { sufficient: true };
  }

  /**
   * Private: Get current price for a symbol
   * @param {string} symbol - Stock symbol
   * @returns {Promise<number>} Current price
   */
  static async _getCurrentPrice(symbol) {
    try {
      const quote = await MarketDataService.getQuote(symbol);
      return quote ? quote.price : 0;
    } catch (error) {
      console.warn(`Failed to get quote for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Private: Execute a market order by matching against opposite orders
   * @param {string} orderId - Order ID to execute
   * @returns {Promise<void>}
   */
  static async _executeMarketOrder(orderId) {
    // This would typically be handled by a matching engine
    // For now, we'll implement a simple version that tries to fill immediately
    // In a real system, this would be handled by a separate matching service
    
    const order = await Order.findById(orderId); // Need to modify findById to not require userId for internal use
    
    if (!order) return;
    
    // For simplicity in this implementation, we'll mark market orders as filled immediately
    // with the current market price
    // A real implementation would involve order book matching
    
    try {
      const currentPrice = await this._getCurrentPrice(order.symbol);
      if (currentPrice > 0) {
        await Order.updateFill(
          orderId, 
          order.quantity, 
          currentPrice
        );
        
        // Update user's position/holdings
        await PortfolioService.updatePositionFromTrade(
          order.user_id,
          order.symbol,
          order.side === 'buy' ? order.quantity : -order.quantity,
          currentPrice
        );
        
        // Create transaction record
        await this._createTransactionFromOrder(order, currentPrice);
      }
    } catch (error) {
      console.error(`Failed to execute market order ${orderId}:`, error);
      // Mark order as rejected if execution fails
      await Order.update(orderId, order.user_id, { status: 'rejected' });
    }
  }

  /**
   * Private: Create transaction record from executed order
   * @param {Order} order - Executed order
   * @param {number} price - Execution price
   * @returns {Promise<void>}
   */
  static async _createTransactionFromOrder(order, price) {
    const amount = order.quantity * price;
    const estimatedFees = amount * 0.0005; // Example: 0.05% fee
    
    await Transaction.create({
      user_id: order.user_id,
      order_id: order.id,
      type: order.side === 'buy' ? 'buy' : 'sell',
      symbol: order.symbol,
      quantity: order.quantity,
      price: price,
      amount: amount,
      fees: estimatedFees,
      net_amount: order.side === 'buy' ? -(amount + estimatedFees) : (amount - estimatedFees)
    });
  }
}

// Export default instance
export default OrderService;