/**
 * paperTradingService.js
 * Core business logic for the Learn section paper-trading sandbox.
 *
 * Rules:
 *   • Every user gets ₹1,00,000 virtual cash on first call to getOrCreateAccount().
 *   • The account expires 11 days after creation.
 *   • All money & positions are stored in paper_accounts / paper_trades (never touches
 *     the real funds / orders / positions tables).
 *   • Prices are fetched via the existing getQuote() from marketDataService.
 */

import supabase from '../config/supabase.js';
import { getQuote } from './marketDataService.js';

const INITIAL_CASH   = 100000;          // ₹1,00,000
const EXPIRY_DAYS    = 11;              // virtual account lifetime in days

// ── Helpers ──────────────────────────────────────────────────────────────────


function daysRemaining(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function isExpired(account) {
  return new Date(account.expires_at) <= new Date();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get (or auto-create) the paper account for a user.
 * @returns {Object} account + derived fields
 */
export async function getOrCreateAccount(userId) {
  // Try to fetch existing account
  const { data: existing, error: fetchErr } = await supabase
    .from('paper_accounts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;

  if (existing) {
    return {
      ...existing,
      expired:       isExpired(existing),
      days_remaining: daysRemaining(existing.expires_at),
    };
  }

  // First visit — create a fresh account
  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: created, error: createErr } = await supabase
    .from('paper_accounts')
    .insert({
      user_id:      userId,
      balance:      INITIAL_CASH,
      initial_cash: INITIAL_CASH,
      expires_at:   expiresAt,
    })
    .select()
    .single();

  if (createErr) throw createErr;

  return {
    ...created,
    expired:        false,
    days_remaining: EXPIRY_DAYS,
  };
}

/**
 * Reset (wipe + re-credit) a user's paper account.
 * Deletes all trades, restores balance to ₹1L, resets the 11-day timer.
 */
export async function resetPaperAccount(userId) {
  // Fetch current account
  const { data: account, error: fetchErr } = await supabase
    .from('paper_accounts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!account) return getOrCreateAccount(userId);

  // Delete all trades for this account
  await supabase.from('paper_trades').delete().eq('account_id', account.id);

  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: updated, error: updateErr } = await supabase
    .from('paper_accounts')
    .update({
      balance:     INITIAL_CASH,
      expires_at:  expiresAt,
      reset_count: (account.reset_count || 0) + 1,
    })
    .eq('id', account.id)
    .select()
    .single();

  if (updateErr) throw updateErr;

  return {
    ...updated,
    expired:        false,
    days_remaining: EXPIRY_DAYS,
  };
}

/**
 * Place a paper market/limit order.
 * @param {string} userId
 * @param {{ symbol, side, orderType, quantity, limitPrice? }} payload
 * @returns {{ trade, account }} — executed trade + updated account snapshot
 */
export async function placePaperOrder(userId, { symbol, side, orderType = 'market', quantity, limitPrice }) {
  if (!symbol || !side || !quantity || quantity <= 0) {
    throw Object.assign(new Error('Invalid order payload'), { status: 422 });
  }

  // 1. Fetch account and enforce expiry
  const { data: account, error: accErr } = await supabase
    .from('paper_accounts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (accErr) throw accErr;

  if (isExpired(account)) {
    throw Object.assign(new Error('Your paper trading account has expired. Please reset to continue.'), { status: 403 });
  }

  // 2. Resolve execution price
  let execPrice;
  if (orderType === 'limit' && limitPrice && limitPrice > 0) {
    execPrice = parseFloat(limitPrice);
  } else {
    const quote = await getQuote(symbol.toUpperCase());
    execPrice   = parseFloat(quote.price);
    if (!execPrice || execPrice <= 0) {
      throw Object.assign(new Error(`Could not fetch live price for ${symbol}`), { status: 502 });
    }
  }

  const tradeValue = execPrice * quantity;

  // 3. Validate buy — check balance
  if (side === 'buy') {
    const available = parseFloat(account.balance);
    if (available < tradeValue) {
      throw Object.assign(
        new Error(`Insufficient paper balance. Need ₹${tradeValue.toFixed(2)}, have ₹${available.toFixed(2)}`),
        { status: 422 }
      );
    }
  }

  // 4. Validate sell — check that user holds enough quantity
  if (side === 'sell') {
    const holdings = await getPaperHoldings(userId);
    const position = holdings.find(h => h.symbol === symbol.toUpperCase());
    const held     = position?.quantity || 0;
    if (held < quantity) {
      throw Object.assign(
        new Error(`Insufficient paper shares. You hold ${held} of ${symbol}, trying to sell ${quantity}`),
        { status: 422 }
      );
    }
  }

  // 5. Insert trade
  const { data: trade, error: tradeErr } = await supabase
    .from('paper_trades')
    .insert({
      account_id: account.id,
      user_id:    userId,
      symbol:     symbol.toUpperCase(),
      side,
      quantity:   parseInt(quantity, 10),
      price:      execPrice,
      order_type: orderType,
      status:     'filled',
    })
    .select()
    .single();

  if (tradeErr) throw tradeErr;

  // 6. Update balance (buy → deduct, sell → credit)
  const balanceDelta = side === 'buy' ? -tradeValue : tradeValue;
  const newBalance   = parseFloat(account.balance) + balanceDelta;

  const { data: updatedAccount, error: balErr } = await supabase
    .from('paper_accounts')
    .update({ balance: newBalance })
    .eq('id', account.id)
    .select()
    .single();

  if (balErr) throw balErr;

  return {
    trade,
    account: {
      ...updatedAccount,
      expired:        false,
      days_remaining: daysRemaining(updatedAccount.expires_at),
    },
  };
}

/**
 * Aggregate paper_trades into current open positions with live P&L.
 * @returns {Array<{ symbol, quantity, avg_price, current_price, invested, market_value, pnl, pnl_pct }>}
 */
export async function getPaperHoldings(userId) {
  const { data: account, error: accErr } = await supabase
    .from('paper_accounts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (accErr) throw accErr;
  if (!account) return [];

  const { data: trades, error: tErr } = await supabase
    .from('paper_trades')
    .select('symbol, side, quantity, price')
    .eq('account_id', account.id)
    .eq('status', 'filled');

  if (tErr) throw tErr;
  if (!trades?.length) return [];

  // Aggregate net positions per symbol using FIFO queue
  const posMap = {};
  for (const t of trades) {
    const sym = t.symbol;
    if (!posMap[sym]) posMap[sym] = { lots: [] };

    if (t.side === 'buy') {
      posMap[sym].lots.push({ qty: t.quantity, price: parseFloat(t.price) });
    } else {
      let qtyToSell = t.quantity;
      while (qtyToSell > 0 && posMap[sym].lots.length > 0) {
        const firstLot = posMap[sym].lots[0];
        if (firstLot.qty <= qtyToSell) {
          qtyToSell -= firstLot.qty;
          posMap[sym].lots.shift();
        } else {
          firstLot.qty -= qtyToSell;
          qtyToSell = 0;
        }
      }
    }
  }

  // Calculate remaining open position totalQty and totalCost
  const openSymbols = Object.entries(posMap)
    .map(([sym, p]) => {
      const totalQty = p.lots.reduce((sum, lot) => sum + lot.qty, 0);
      const totalCost = p.lots.reduce((sum, lot) => sum + lot.qty * lot.price, 0);
      return { symbol: sym, totalQty, totalCost };
    })
    .filter(p => p.totalQty > 0);

  if (!openSymbols.length) return [];

  // Fetch live prices concurrently (best-effort)
  const priceResults = await Promise.allSettled(
    openSymbols.map(p => getQuote(p.symbol))
  );

  return openSymbols.map((pos, i) => {
    const avgPrice     = pos.totalCost / pos.totalQty;
    const livePrice    = priceResults[i].status === 'fulfilled'
      ? parseFloat(priceResults[i].value.price) : avgPrice;
    const invested     = pos.totalCost;
    const marketValue  = livePrice * pos.totalQty;
    const pnl          = marketValue - invested;
    const pnlPct       = invested > 0 ? (pnl / invested) * 100 : 0;

    return {
      symbol:        pos.symbol,
      quantity:      pos.totalQty,
      avg_price:     parseFloat(avgPrice.toFixed(2)),
      current_price: parseFloat(livePrice.toFixed(2)),
      invested:      parseFloat(invested.toFixed(2)),
      market_value:  parseFloat(marketValue.toFixed(2)),
      pnl:           parseFloat(pnl.toFixed(2)),
      pnl_pct:       parseFloat(pnlPct.toFixed(2)),
    };
  });
}

/**
 * Fetch all paper orders for the user (most recent first).
 */
export async function getPaperOrders(userId) {
  const { data: account, error: accErr } = await supabase
    .from('paper_accounts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (accErr) throw accErr;
  if (!account) return [];

  const { data, error } = await supabase
    .from('paper_trades')
    .select('*')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

/**
 * Full portfolio summary for the paper account.
 */
export async function getPaperPortfolioSummary(userId) {
  const [account, holdings] = await Promise.all([
    getOrCreateAccount(userId),
    getPaperHoldings(userId),
  ]);

  const investedValue  = holdings.reduce((s, h) => s + h.invested, 0);
  const marketValue    = holdings.reduce((s, h) => s + h.market_value, 0);
  const totalPnl       = holdings.reduce((s, h) => s + h.pnl, 0);
  const cashBalance    = parseFloat(account.balance);
  const totalPortfolio = cashBalance + marketValue;
  const overallReturn  = account.initial_cash > 0
    ? ((totalPortfolio - account.initial_cash) / account.initial_cash) * 100 : 0;

  return {
    account_id:       account.id,
    balance:          cashBalance,
    initial_cash:     parseFloat(account.initial_cash),
    invested_value:   parseFloat(investedValue.toFixed(2)),
    market_value:     parseFloat(marketValue.toFixed(2)),
    total_pnl:        parseFloat(totalPnl.toFixed(2)),
    total_portfolio:  parseFloat(totalPortfolio.toFixed(2)),
    overall_return:   parseFloat(overallReturn.toFixed(2)),
    created_at:       account.created_at,
    expires_at:       account.expires_at,
    days_remaining:   account.days_remaining,
    expired:          account.expired,
    reset_count:      account.reset_count,
    holdings_count:   holdings.length,
  };
}
