/**
 * Risk Check Service - handles risk management and validation
 */
export class RiskCheckService {
  /**
   * Check if user has sufficient funds for a buy order
   * @param {Object} params - Parameters
   * @param {number} params.availableBalance - Available cash balance
   * @param {number} params.quantity - Number of shares to buy
   * @param {number} params.price - Price per share
   * @param {number} [params.marginRequired=0] - Additional margin required
   * @returns {Object} Result with passed flag and message
   */
  static checkSufficientFunds({ availableBalance, quantity, price, marginRequired = 0 }) {
    if (typeof availableBalance !== 'number' || 
        typeof quantity !== 'number' || 
        typeof price !== 'number') {
      return {
        passed: false,
        reason: 'Invalid parameters: availableBalance, quantity, and price must be numbers'
      };
    }
    
    if (quantity <= 0) {
      return {
        passed: false,
        reason: 'Quantity must be greater than zero'
      };
    }
    
    if (price <= 0) {
      return {
        passed: false,
        reason: 'Price must be greater than zero'
      };
    }
    
    const stockCost = quantity * price;
    const totalCost = stockCost + marginRequired;
    
    if (totalCost > availableBalance) {
      return {
        passed: false,
        reason: `Insufficient funds. Required: ₹${totalCost.toFixed(2)} (Stocks: ₹${stockCost.toFixed(2)}, Margin: ₹${marginRequired.toFixed(2)}), Available: ₹${availableBalance.toFixed(2)}`
      };
    }
    
    return {
      passed: true,
      requiredAmount: totalCost,
      remainingBalance: availableBalance - totalCost
    };
  }

  /**
   * Check if user has sufficient shares for a sell order
   * @param {Object} params - Parameters
   * @param {number} params.holdingQuantity - Number of shares currently held
   * @param {number} params.quantity - Number of shares to sell
   * @returns {Object} Result with passed flag and message
   */
  static checkSufficientShares({ holdingQuantity, quantity }) {
    if (typeof holdingQuantity !== 'number' || 
        typeof quantity !== 'number') {
      return {
        passed: false,
        reason: 'Invalid parameters: holdingQuantity and quantity must be numbers'
      };
    }
    
    if (quantity <= 0) {
      return {
        passed: false,
        reason: 'Quantity must be greater than zero'
      };
    }
    
    if (holdingQuantity < quantity) {
      return {
        passed: false,
        reason: `Insufficient shares. Trying to sell ${quantity} shares but only holding ${holdingQuantity} shares`
      };
    }
    
    return {
      passed: true,
      remainingShares: holdingQuantity - quantity
    };
  }

  /**
   * Check if order value exceeds position limits
   * @param {Object} params - Parameters
   * @param {number} params.orderValue - Value of the order
   * @param {number} params.portfolioValue - Total portfolio value
   * @param {number} params.maxPositionPercentage - Maximum percentage allowed per position (default 20%)
   * @returns {Object} Result with passed flag and message
   */
  static checkPositionLimit({ orderValue, portfolioValue, maxPositionPercentage = 20 }) {
    if (typeof orderValue !== 'number' || 
        typeof portfolioValue !== 'number') {
      return {
        passed: false,
        reason: 'Invalid parameters: orderValue and portfolioValue must be numbers'
      };
    }
    
    if (portfolioValue <= 0) {
      // If portfolio is empty, allow the position (first investment)
      return {
        passed: true,
        positionPercentage: 0
      };
    }
    
    const positionPercentage = (orderValue / portfolioValue) * 100;
    
    if (positionPercentage > maxPositionPercentage) {
      return {
        passed: false,
        reason: `Position size exceeds limit. Position would be ${positionPercentage.toFixed(2)}% of portfolio, maximum allowed is ${maxPositionPercentage}%`
      };
    }
    
    return {
      passed: true,
      positionPercentage
    };
  }

  /**
   * Check if trade would exceed daily loss limit
   * @param {Object} params - Parameters
   * @param {number} params.dailyPnl - Current day's P&L
   * @param {number} params.potentialLoss - Potential loss from this trade
   * @param {number} params.dailyLossLimit - Maximum daily loss allowed (as positive number)
   * @returns {Object} Result with passed flag and message
   */
  static checkDailyLossLimit({ dailyPnl, potentialLoss, dailyLossLimit = 5000 }) {
    if (typeof dailyPnl !== 'number' || 
        typeof potentialLoss !== 'number') {
      return {
        passed: false,
        reason: 'Invalid parameters: dailyPnl and potentialLoss must be numbers'
      };
    }
    
    // If already at or beyond loss limit, reject
    if (dailyPnl <= -dailyLossLimit) {
      return {
        passed: false,
        reason: `Daily loss limit already reached. Today's P&L: ₹${dailyPnl.toFixed(2)}, Limit: -₹${dailyLossLimit.toFixed(2)}`
      };
    }
    
    // Check if this trade would put us over the limit
    const projectedLoss = dailyPnl - potentialLoss; // Assuming potentialLoss is positive
    if (projectedLoss < -dailyLossLimit) {
      return {
        passed: false,
        reason: `Trade would exceed daily loss limit. Projected day's P&L: ₹${projectedLoss.toFixed(2)}, Limit: -₹${dailyLossLimit.toFixed(2)}`
      };
    }
    
    return {
      passed: true,
      currentDailyPnl: dailyPnl,
      remainingLossCapacity: dailyLossLimit + Math.min(0, dailyPnl)
    };
  }

  /**
   * Check if order size is reasonable (not too small or too large)
   * @param {Object} params - Parameters
   * @param {number} params.quantity - Order quantity
   * @param {number} params.price - Share price
   * @param {number} [params.minOrderValue=100] - Minimum order value in currency
   * @param {number} [params.maxOrderValue=1000000] - Maximum order value in currency
   * @returns {Object} Result with passed flag and message
   */
  static checkOrderSize({ quantity, price, minOrderValue = 100, maxOrderValue = 1000000 }) {
    if (typeof quantity !== 'number' || 
        typeof price !== 'number') {
      return {
        passed: false,
        reason: 'Invalid parameters: quantity and price must be numbers'
      };
    }
    
    if (quantity <= 0) {
      return {
        passed: false,
        reason: 'Quantity must be greater than zero'
      };
    }
    
    if (price <= 0) {
      return {
        passed: false,
        reason: 'Price must be greater than zero'
      };
    }
    
    const orderValue = quantity * price;
    
    if (orderValue < minOrderValue) {
      return {
        passed: false,
        reason: `Order value too small. Minimum order value is ₹${minOrderValue}, but order value is ₹${orderValue.toFixed(2)}`
      };
    }
    
    if (orderValue > maxOrderValue) {
      return {
        passed: false,
        reason: `Order value too large. Maximum order value is ₹${maxOrderValue}, but order value is ₹${orderValue.toFixed(2)}`
      };
    }
    
    return {
      passed: true,
      orderValue
    };
  }

  /**
   * Check for pattern day trader rules (simplified)
   * @param {Object} params - Parameters
   * @param {number} params.dayTradeCount - Number of day trades today
   * @param {number} params.equity - Account equity
   * @param {number} [params.maxDayTrades=3] - Maximum day trades allowed
   * @param {number} [params.minEquity=25000] - Minimum equity for day trading
   * @returns {Object} Result with passed flag and message
   */
  static checkPatternDayTrader({ dayTradeCount, equity, maxDayTrades = 3, minEquity = 25000 }) {
    if (typeof dayTradeCount !== 'number' || 
        typeof equity !== 'number') {
      return {
        passed: false,
        reason: 'Invalid parameters: dayTradeCount and equity must be numbers'
      };
    }
    
    // Only apply if equity is below minimum threshold
    if (equity < minEquity) {
      if (dayTradeCount >= maxDayTrades) {
        return {
          passed: false,
          reason: `Pattern Day Trader rule violation. Account equity (₹${equity.toFixed(2)}) is below minimum (₹${minEquity.toFixed(2)}) and you've executed ${dayTradeCount} day trades today (limit: ${maxDayTrades})`
        };
      }
    }
    
    return {
      passed: true,
      dayTradeCount: dayTradeCount,
      remainingDayTrades: Math.max(0, maxDayTrades - dayTradeCount)
    };
  }

  /**
   * Comprehensive pre-trade risk check
   * @param {Object} params - All parameters needed for various checks
   * @returns {Object} Combined result
   */
  static async preTradeCheck(params) {
    // Run all applicable checks
    const checks = [];
    
    // Always run these basic checks
    checks.push(this.checkOrderSize({
      quantity: params.quantity,
      price: params.price || 0
    }));
    
    if (params.side === 'buy') {
      checks.push(this.checkSufficientFunds({
        availableBalance: params.availableBalance || 0,
        quantity: params.quantity,
        price: params.price || 0,
        marginRequired: params.marginRequired || 0
      }));
      
      // Position limit check
      if (params.portfolioValue) {
        checks.push(this.checkPositionLimit({
          orderValue: params.quantity * (params.price || 0),
          portfolioValue: params.portfolioValue
        }));
      }
    } else if (params.side === 'sell') {
      checks.push(this.checkSufficientShares({
        holdingQuantity: params.holdingQuantity || 0,
        quantity: params.quantity
      }));
    }
    
    // Daily loss limit check
    if (params.dailyPnl !== undefined && params.potentialLoss !== undefined) {
      checks.push(this.checkDailyLossLimit({
        dailyPnl: params.dailyPnl,
        potentialLoss: params.potentialLoss
      }));
    }
    
    // Pattern day trader check (if applicable)
    if (params.dayTradeCount !== undefined && params.equity !== undefined) {
      checks.push(this.checkPatternDayTrader({
        dayTradeCount: params.dayTradeCount,
        equity: params.equity
      }));
    }
    
    // Combine results
    let allPassed = true;
    let firstFailedReason = '';
    
    for (const check of checks) {
      if (!check.passed) {
        allPassed = false;
        if (!firstFailedReason) {
          firstFailedReason = check.reason;
        }
      }
    }
    
    return {
      passed: allPassed,
      reason: firstFailedReason,
      details: checks // Include all individual check results for debugging
    };
  }
}

export default RiskCheckService;

// Named function export used by orderController
export const checkSufficientFunds = (params) => RiskCheckService.checkSufficientFunds(params);