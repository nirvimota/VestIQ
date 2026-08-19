/**
 * paperTradingController.js
 * HTTP layer for the paper trading feature.
 * All routes are protected by requireAuth middleware.
 */

import {
  getOrCreateAccount,
  resetPaperAccount,
  placePaperOrder,
  getPaperHoldings,
  getPaperOrders,
  getPaperPortfolioSummary,
} from '../services/paperTradingService.js';
import { ok, fail } from '../utils/apiResponse.js';

/** GET /api/learn/account */
export async function getAccount(req, res) {
  try {
    const account = await getOrCreateAccount(req.user.id);
    return ok(res, account);
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

/** GET /api/learn/portfolio */
export async function getPortfolio(req, res) {
  try {
    const summary = await getPaperPortfolioSummary(req.user.id);
    return ok(res, summary);
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

/** GET /api/learn/holdings */
export async function getHoldings(req, res) {
  try {
    const holdings = await getPaperHoldings(req.user.id);
    return ok(res, holdings);
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

/** GET /api/learn/orders */
export async function getOrders(req, res) {
  try {
    const orders = await getPaperOrders(req.user.id);
    return ok(res, orders);
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

/** POST /api/learn/orders */
export async function placeOrder(req, res) {
  const { symbol, side, orderType, quantity, limitPrice } = req.body;

  // Basic field validation
  if (!symbol || typeof symbol !== 'string') {
    return fail(res, 'symbol is required', 422);
  }
  if (!['buy', 'sell'].includes(side)) {
    return fail(res, "side must be 'buy' or 'sell'", 422);
  }
  const qty = parseInt(quantity, 10);
  if (!qty || qty <= 0) {
    return fail(res, 'quantity must be a positive integer', 422);
  }

  try {
    const result = await placePaperOrder(req.user.id, {
      symbol,
      side,
      orderType: orderType || 'market',
      quantity:  qty,
      limitPrice,
    });
    return ok(res, result, 201);
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}

/** POST /api/learn/reset */
export async function resetAccount(req, res) {
  try {
    const account = await resetPaperAccount(req.user.id);
    return ok(res, account);
  } catch (err) {
    return fail(res, err.message, err.status || 500);
  }
}
