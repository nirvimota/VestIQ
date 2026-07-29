import { ORDER_STATUS } from '../utils/constants.js';

/**
 * Order Matching Service - handles order execution logic
 * In a production system, this would interface with a real matching engine
 */
export class OrderMatchingService {
  /**
   * Determine initial status for a new order based on order type
   * @param {'market'|'limit'|'stop-loss'} orderType - Order type
   * @returns {string} Initial order status
   */
  static resolveInitialStatus(orderType) {
    // Market orders are typically filled immediately (or rejected if no liquidity)
    // Limit orders start as pending until price conditions are met
    // Stop-loss orders start as pending until trigger price is reached
    return orderType === 'market' ? ORDER_STATUS.FILLED : ORDER_STATUS.PENDING;
  }

  /**
   * Check if a limit order should be executed based on current price
   * @param {Object} order - Order object
   * @param {number} currentPrice - Current market price
   * @returns {boolean} True if order should be executed
   */
  static shouldExecuteLimitOrder(order, currentPrice) {
    if (!order || typeof currentPrice !== 'number') return false;
    
    // For buy limit orders: execute when market price <= limit price
    if (order.side === 'buy' && order.order_type === 'limit') {
      return currentPrice <= order.price;
    }
    
    // For sell limit orders: execute when market price >= limit price
    if (order.side === 'sell' && order.order_type === 'limit') {
      return currentPrice >= order.price;
    }
    
    return false;
  }

  /**
   * Check if a stop-loss order should be triggered based on current price
   * @param {Object} order - Order object
   * @param {number} currentPrice - Current market price
   * @returns {boolean} True if stop-loss should be triggered
   */
  static shouldTriggerStopLossOrder(order, currentPrice) {
    if (!order || typeof currentPrice !== 'number') return false;
    
    // For buy stop-loss: execute when market price >= stop price
    // (used to limit losses on short positions or enter long positions)
    if (order.side === 'buy' && order.order_type === 'stop-loss') {
      return currentPrice >= order.price;
    }
    
    // For sell stop-loss: execute when market price <= stop price
    // (used to limit losses on long positions)
    if (order.side === 'sell' && order.order_type === 'stop-loss') {
      return currentPrice <= order.price;
    }
    
    return false;
  }

  /**
   * Execute a market order against available liquidity
   * This is a simplified version - real matching would be more complex
   * @param {Object} order - Market order to execute
   * @param {number} marketPrice - Current market price
   * @returns {Object} Execution result
   */
  static async executeMarketOrder(order, marketPrice) {
    if (!order || order.order_type !== 'market') {
      throw new Error('Invalid order type for market execution');
    }
    
    // In a real system is simplified - assume we can fill at market price
    // In reality, this would check order book depth and liquidity
    
    const quantity = order.quantity;
    const price = marketPrice;
    const commission = quantity * price * 0.0005; // 0.05% commission
    
    return {
      executedQuantity: quantity,
      executionPrice: price,
      commission,
      totalCost: quantity * price + commission,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute a limit order
   * @param {Object} order - Limit order to execute
   * @param {number} executionPrice - Price at which to execute
   * @returns {Object} Execution result
   */
  static async executeLimitOrder(order, executionPrice) {
    if (!order || order.order_type !== 'limit') {
      throw new Error('Invalid order type for limit execution');
    }
    
    // Validate that execution price meets limit conditions
    const canExecute = this.shouldExecuteLimitOrder(order, executionPrice);
    if (!canExecute) {
      throw new Error('Execution price does not meet limit order criteria');
    }
    
    const quantity = order.quantity;
    const commission = quantity * executionPrice * 0.0005; // 0.05% commission
    
    return {
      executedQuantity: quantity,
      executionPrice: executionPrice,
      commission,
      totalCost: quantity * executionPrice + (order.side === 'buy' ? commission : -commission),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute a stop-loss order
   * @param {Object} order - Stop-loss order to execute
   * @param {number} executionPrice - Price at which to execute
   * @returns {Object} Execution result
   */
  static async executeStopLossOrder(order, executionPrice) {
    if (!order || order.order_type !== 'stop-loss') {
      throw new Error('Invalid order type for stop-loss execution');
    }
    
    // Validate that execution price triggers the stop-loss
    const shouldTrigger = this.shouldTriggerStopLossOrder(order, executionPrice);
    if (!shouldTrigger) {
      throw new Error('Execution price does not trigger stop-loss order');
    }
    
    // When stop-loss triggers, it becomes a market order
    // In reality, there might be slippage
    const slippage = Math.random() * 0.005; // Up to 0.5% slippage
    const executionPriceWithSlippage = order.side === 'sell' 
      ? executionPrice * (1 - slippage) 
      : executionPrice * (1 + slippage);
    
    const quantity = order.quantity;
    const commission = quantity * executionPriceWithSlippage * 0.0005; // 0.05% commission
    
    return {
      executedQuantity: quantity,
      executionPrice: executionPriceWithSlippage,
      commission,
      totalCost: quantity * executionPriceWithSlippage + (order.side === 'buy' ? commission : -commission),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate order value
   * @param {Object} order - Order object
   * @returns {number} Order value (quantity * price)
   */
  static calculateOrderValue(order) {
    if (!order) return 0;
    
    // For market orders, we need current price to calculate value
    // This function is mainly useful for limit/stop-loss orders
    if (order.order_type === 'market') {
      // Would need current price - returning 0 as placeholder
      return 0;
    }
    
    return order.quantity * (order.price || 0);
  }

  /**
   * Check if order can be cancelled based on its status
   * @param {string} status - Order status
   * @returns {boolean} True if order can be cancelled
   */
  static canCancelOrder(status) {
    return ['pending', 'partially_filled'].includes(status);
  }

  /**
   * Process order execution results and update order status
   * @param {Object} order - Order object
   * @param {Object} executionResult - Result from execution function
   * @returns {Object} Updated order fields
   */
  static processExecutionResult(order, executionResult) {
    const { executedQuantity, executionPrice, commission } = executionResult;
    
    // Calculate new filled quantity
    const newFilledQuantity = (order.filled_quantity || 0) + executedQuantity;
    
    // Calculate new average price
    const oldValue = (order.average_price || 0) * (order.filled_quantity || 0);
    const newValue = executedQuantity * executionPrice;
    const totalQuantity = order.quantity;
    const totalFilledQuantity = newFilledQuantity;
    
    let newAveragePrice = order.average_price || 0;
    if (totalFilledQuantity > 0) {
      newAveragePrice = (oldValue + newValue) / totalFilledQuantity;
    }
    
    // Determine new status
    let newStatus = order.status;
    if (totalFilledQuantity >= totalQuantity) {
      newStatus = ORDER_STATUS.FILLED;
    } else if (totalFilledQuantity > 0) {
      newStatus = ORDER_STATUS.PARTIALLY_FILLED;
    }
    // If still 0 filled, remains PENDING (unless rejected/cancelled elsewhere)
    
    return {
      filled_quantity: newFilledQuantity,
      average_price: newAveragePrice,
      status: newStatus,
      // Note: In a real system, you'd also update commission paid, etc.
      last_execution_price: executionPrice,
      last_execution_time: new Date().toISOString()
    };
  }

  /**
   * Cancel an order
   * @param {Object} order - Order object
   * @returns {Object} Update data for order cancellation
   */
  static cancelOrder(order) {
    if (!this.canCancelOrder(order.status)) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }
    
    return {
      status: ORDER_STATUS.CANCELLED,
      cancelled_at: new Date().toISOString()
    };
  }

  /**
   * Reject an order
   * @param {string} reason - Reason for rejection
   * @returns {Object} Update data for order rejection
   */
  static rejectOrder(reason = 'Unknown reason') {
    return {
      status: ORDER_STATUS.REJECTED,
      rejected_reason: reason,
      rejected_at: new Date().toISOString()
    };
  }

  /**
   * Get best bid/ask for a symbol from open orders
   * This is a simplified version - real implementation would need order book
   * @param {string} symbol - Stock symbol
   * @returns {Object} Best bid and ask prices
   */
  static async getBestBidAsk(symbol) {
    // In a real implementation, this would query the order book
    // For now, we'll return null to indicate we don't have this data
    // This would be implemented by querying open orders and calculating
    // the highest buy price and lowest sell price
    return {
      bid: null,
      ask: null,
      spread: null
    };
  }

  /**
   * Calculate order book depth
   * @param {string} symbol - Stock symbol
   * @returns {Object} Order book depth data
   */
  static async getOrderBookDepth(symbol) {
    // Similar to getBidAsk, this would require querying open orders
    // and grouping by price levels
    return {
      bids: [], // Array of [price, quantity]
      asks: []  // Array of [price, quantity]
    };
  }
}

export default OrderMatchingService;

// Named function export used by orderController
export const resolveInitialStatus = (orderType) =>
  OrderMatchingService.resolveInitialStatus(orderType);