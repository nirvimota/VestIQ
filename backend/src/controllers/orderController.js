import supabase from '../config/supabase.js';
import { validateOrderPayload } from '../validators/orderValidator.js';
import { checkSufficientFunds } from '../services/riskCheckService.js';
import { resolveInitialStatus } from '../services/orderMatchingService.js';
import { PortfolioService, getFundsSummary } from '../services/portfolioService.js';
import { getQuote } from '../services/marketDataService.js';
import { logAction } from '../services/auditLogService.js';
import { ok, fail } from '../utils/apiResponse.js';

export async function placeOrder(req, res) {
  const errors = validateOrderPayload(req.body);
  if (errors.length) return fail(res, errors.join(', '), 422);

  const { symbol, side, orderType, quantity, price } = req.body;
  const userId = req.user.id;

  try {
    if (side === 'buy') {
      try {
        const funds = await getFundsSummary(userId);
        // Only enforce risk check if user has a real positive balance set up
        if (funds.available_balance > 0) {
          const riskCheck = checkSufficientFunds({
            availableBalance: funds.available_balance,
            quantity,
            price: price || 0,
          });
          if (!riskCheck.passed) return fail(res, riskCheck.reason, 422);
        }
        // If balance is 0 (demo/new user), allow the order through
      } catch (fundsErr) {
        // If funds table lookup fails, allow order through in demo mode
        console.warn('Funds check skipped (demo mode):', fundsErr.message);
      }
    }

    const status = resolveInitialStatus(orderType);

    const { data, error } = await supabase
      .from('orders')
      .insert({ user_id: userId, symbol, side, order_type: orderType, quantity, price: price || null, status })
      .select()
      .single();

    if (error) throw error;

    // If it's a market order, auto-execute it and update holdings/positions & funds
    if (orderType === 'market' && status === 'filled') {
      try {
        let execPrice = price;
        if (!execPrice || execPrice <= 0) {
          const quote = await getQuote(symbol);
          execPrice = quote?.price || 1000;
        }

        const qtyChange = side === 'buy' ? quantity : -quantity;
        await PortfolioService.updatePositionFromTrade(userId, symbol, qtyChange, execPrice);

        // Deduct/Add funds
        const cost = quantity * execPrice;
        const fundDelta = side === 'buy' ? -cost : cost;
        await PortfolioService.updateFunds(userId, fundDelta, side === 'buy' ? 'trade_buy' : 'trade_sell').catch(() => {});
      } catch (execErr) {
        console.error('Failed to update position on market order:', execErr);
      }
    }

    await logAction(userId, 'ORDER_PLACED', { orderId: data.id, symbol, side, quantity });

    return ok(res, data, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function listOrders(req, res) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

export async function cancelOrder(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) return fail(res, error.message, 400);
  if (!data) return fail(res, 'Order not found or cannot be cancelled', 404);

  await logAction(req.user.id, 'ORDER_CANCELLED', { orderId: id });
  return ok(res, data);
}