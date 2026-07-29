import supabase from '../config/supabase.js';
import { Position } from '../models/Position.js';
import { Holding } from '../models/Holding.js';
import { Transaction } from '../models/Transaction.js';
import { MarketDataService } from './marketDataService.js';

/**
 * Portfolio Service - handles portfolio and position operations
 */
export class PortfolioService {
  /**
   * Get user's holdings (mutual funds, ETFs, etc.)
   * @param {string} userId - User ID
   * @returns {Promise<Holding[]>} Array of holdings
   */
  static async getHoldings(userId) {
    return await Holding.findByUserId(userId);
  }

  /**
   * Get user's positions (stocks)
   * @param {string} userId - User ID
   * @returns {Promise<Position[]>} Array of positions
   */
  static async getPositions(userId) {
    return await Position.findByUserId(userId);
  }

  /**
   * Get complete portfolio summary
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Portfolio summary
   */
  static async getPortfolioSummary(userId) {
    try {
      // Get positions and holdings in parallel
      const [positions, holdings, funds] = await Promise.all([
        this.getPositions(userId),
        this.getHoldings(userId),
        this.getFundsSummary(userId)
      ]);
      
      // Calculate total market value
      const positionsValue = positions.reduce((sum, pos) => 
        sum + (pos.market_value || 0), 0);
      
      const holdingsValue = holdings.reduce((sum, holding) => 
        sum + (holding.market_value || 0), 0);
      
      const totalMarketValue = positionsValue + holdingsValue;
      
      // Calculate total cost basis
      const positionsCost = positions.reduce((sum, pos) => 
        sum + ((pos.average_price || 0) * pos.quantity), 0);
      
      const holdingsCost = holdings.reduce((sum, holding) => 
        sum + ((holding.average_price || 0) * holding.quantity), 0);
      
      const totalCost = positionsCost + holdingsCost;
      
      // Calculate total P&L
      const totalUnrealizedPNL = positions.reduce((sum, pos) => 
        sum + (pos.unrealized_pnl || 0), 0) +
        holdings.reduce((sum, holding) => 
          sum + (holding.unrealized_pnl || 0), 0);
      
      // Get today's performance (would need historical data for accuracy)
      const todaysChange = await this._calculateTodaysChange(userId);
      
      return {
        totalMarketValue,
        totalCost,
        totalUnrealizedPNL,
        totalReturnPercent: totalCost > 0 ? 
          ((totalUnrealizedPNL / totalCost) * 100) : 0,
        todaysChange: todaysChange || 0,
        positionsCount: positions.length,
        holdingsCount: holdings.length,
        availableBalance: funds?.available_balance || 0,
        blockedMargin: funds?.blocked_margin || 0,
        totalBalance: funds?.total_balance || 0
      };
    } catch (error) {
      console.error('Error getting portfolio summary:', error);
      throw error;
    }
  }

  /**
   * Get funds summary (available balance, margin, etc.)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Funds data
   */
  static async getFundsSummary(userId) {
    const { data, error } = await supabase
      .from('funds')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // If no funds record exists, create one with zero balance
      if (error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('funds')
          .insert({
            user_id: userId,
            available_balance: 0,
            blocked_margin: 0
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newData;
      }
      throw error;
    }
    
    return data;
  }

  /**
   * Update user's funds (deposit/withdrawal)
   * @param {string} userId - User ID
   * @param {number} amount - Amount to add (positive) or subtract (negative)
   * @param {string} type - Transaction type ('deposit' or 'withdrawal')
   * @returns {Promise<Object>} Updated funds
   */
  static async updateFunds(userId, amount, type) {
    // Get current funds
    const funds = await this.getFundsSummary(userId);
    
    let newAvailableBalance = parseFloat(funds.available_balance) + amount;
    
    // Ensure balance doesn't go negative
    if (newAvailableBalance < 0) {
      throw new Error('Insufficient funds');
    }
    
    // Update funds
    const { data, error } = await supabase
      .from('funds')
      .update({
        available_balance: newAvailableBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Create transaction record
    await Transaction.create({
      user_id: userId,
      type: type,
      amount: Math.abs(amount),
      net_amount: amount, // For deposits/withdrawals, net amount is the amount itself
      status: 'completed'
    });
    
    return data;
  }

  /**
   * Update position from a trade
   * @param {string} userId - User ID
   * @param {string} symbol - Stock symbol
   * @param {number} quantityChange - Change in quantity (+ for buy, - for sell)
   * @param {number} tradePrice - Price per share of the trade
   * @returns {Promise<Position>} Updated position
   */
  static async updatePositionFromTrade(userId, symbol, quantityChange, tradePrice) {
    return await Position.updateFromTrade(userId, symbol, quantityChange, tradePrice);
  }

  /**
   * Update holding from a transaction
   * @param {string} userId - User ID
   * @param {string} symbol - Fund symbol
   * @param {number} quantityChange - Change in quantity (+ for buy, - for sell)
   * @param {number} transactionPrice - Price per unit of the transaction
   * @returns {Promise<Holding>} Updated holding
   */
  static async updateHoldingFromTransaction(userId, symbol, quantityChange, transactionPrice) {
    return await Holding.updateFromTransaction(userId, symbol, quantityChange, transactionPrice);
  }

  /**
   * Update current market prices for all positions
   * @param {string} userId - User ID
   * @returns {Promise<Position[]>} Updated positions
   */
  static async updatePositionPrices(userId) {
    // Get current positions
    const positions = await this.getPositions(userId);
    
    if (positions.length === 0) {
      return [];
    }
    
    // Extract symbols
    const symbols = positions.map(pos => pos.symbol);
    
    // Get current prices
    const prices = await MarketDataService.getQuotes(symbols);
    
    // Update each position
    const updatePromises = positions.map(position => {
      const price = prices[position.symbol]?.price;
      if (price) {
        return Position.updateMarketPrice(position.id, price);
      }
      return Promise.resolve(position); // Return unchanged if no price data
    });
    
    return await Promise.all(updatePromises);
  }

  /**
   * Update current market prices/NAV for all holdings
   * @param {string} userId - User ID
   * @returns {Promise<Holding[]>} Updated holdings
   */
  static async updateHoldingPrices(userId) {
    // Get current holdings
    const holdings = await this.getHoldings(userId);
    
    if (holdings.length === 0) {
      return [];
    }
    
    // Extract symbols
    const symbols = holdings.map(holding => holding.symbol);
    
    // Get current prices (assuming same service works for funds/ETFs)
    const prices = await MarketDataService.getQuotes(symbols);
    
    // Update each holding
    const updatePromises = holdings.map(holding => {
      const price = prices[holding.symbol]?.price;
      if (price) {
        return Holding.updateMarketPrice(holding.id, price);
      }
      return Promise.resolve(holding); // Return unchanged if no price data
    });
    
    return await Promise.all(updatePromises);
  }

  /**
   * Calculate today's profit/loss for portfolio
   * @param {string} userId - User ID
   * @returns {Promise<number>} Today's P&L in currency units
   */
  static async _calculateTodaysChange(userId) {
    try {
      // Get transactions from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      const todayEndISO = todayEnd.toISOString();
      
      const transactions = await Transaction.findByUserId(userId, {
        startDate: todayStart,
        endDate: todayEndISO
      });
      
      // Sum up the net amounts for today's trades
      return transactions.reduce((sum, tx) => 
        sum + (tx.net_amount || 0), 0);
    } catch (error) {
      console.warn('Could not calculate todays change:', error);
      return 0; // Return 0 if we can't calculate
    }
  }

  /**
   * Get asset allocation breakdown
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Allocation by sector/asset type
   */
  static async getAssetAllocation(userId) {
    try {
      const [positions, holdings] = await Promise.all([
        this.getPositions(userId),
        this.getHoldings(userId)
      ]);
      
      // For simplicity, we'll categorize by broad types
      // In a real system, you'd have sector/industry data for each symbol
      
      const allocation = {
        stocks: 0,
        funds: 0,
        cash: 0
      };
      
      // Calculate stock value
      const stocksValue = positions.reduce((sum, pos) => 
        sum + (pos.market_value || 0), 0);
      
      // Calculate funds value
      const fundsValue = holdings.reduce((sum, holding) => 
        sum + (holding.market_value || 0), 0);
      
      // Get cash balance
      const fundsData = await this.getFundsSummary(userId);
      const cashValue = parseFloat(fundsData.available_balance) || 0;
      
      const totalValue = stocksValue + fundsValue + cashValue;
      
      if (totalValue > 0) {
        allocation.stocks = (stocksValue / totalValue) * 100;
        allocation.funds = (fundsValue / totalValue) * 100;
        allocation.cash = (cashValue / totalValue) * 100;
      }
      
      return allocation;
    } catch (error) {
      console.error('Error calculating asset allocation:', error);
      return { stocks: 0, funds: 0, cash: 0 };
    }
  }

  /**
   * Get portfolio performance over time
   * @param {string} userId - User ID
   * @param {string} period - Time period (1M, 3M, 6M, 1Y)
   * @returns {Promise<Array>} Performance data points
   */
  static async getPerformanceHistory(userId, period = '1M') {
    // This would typically calculate portfolio value over time
    // based on historical prices and transactions
    // For now, return mock data
    return this._getMockPerformanceData(period);
  }

  /**
   * Get dividend income
   * @param {string} userId - User ID
   * @param {string} period - Time period (1M, 3M, 6M, 1Y, YTD)
   * @returns {Promise<Object>} Dividend information
   */
  static async getDividendIncome(userId, period = '1Y') {
    try {
      // Get user's symbols
      const [positions, holdings] = await Promise.all([
        this.getPositions(userId),
        this.getHoldings(userId)
      ]);
      
      const symbols = [
        ...positions.map(p => p.symbol),
        ...holdings.map(h => h.symbol)
      ];
      
      if (symbols.length === 0) {
        return { total: 0, bySymbol: [] };
      }
      
      // In a real implementation, we'd query a dividends table
      // For now, return mock data
      return this._getMockDividendData(symbols, period);
    } catch (error) {
      console.error('Error getting dividend income:', error);
      return { total: 0, bySymbol: [] };
    }
  }

  // Private helper methods

  /**
   * Get mock performance data
   * @param {string} period - Time period
   * @returns {Array} Mock performance data
   */
  static _getMockPerformanceData(period) {
    const days = {
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365
    }[period] || 30;
    
    const result = [];
    let value = 100000; // Starting value
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      
      // Random walk for portfolio value
      const dailyChange = (Math.random() - 0.5) * 0.02; // +/-1% daily
      value = value * (1 + dailyChange);
      
      result.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value * 100) / 100,
        dailyReturn: ((dailyChange * 100) || 0)
      });
    }
    
    return result;
  }

  /**
   * Get mock dividend data
   * @param {string[]} symbols - List of symbols
   * @param {string} period - Time period
   * @returns {Object} Dividend data
   */
  static _getMockDividendData(symbols, period) {
    const total = Math.random() * 5000; // Random dividend income
    
    const bySymbol = symbols.map(symbol => ({
      symbol,
      amount: Math.random() * (total / symbols.length),
      exDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));
    
    return {
      total: Math.round(total * 100) / 100,
      bySymbol
    };
  }
}

export default PortfolioService;

// Named function exports used by portfolioController
export const getHoldings = (userId) => PortfolioService.getHoldings(userId);
export const getFundsSummary = (userId) => PortfolioService.getFundsSummary(userId);