import { ORDER_TYPES, ORDER_SIDES } from '../utils/constants.js';

export function validateOrderPayload(body) {
  const errors = [];
  const { symbol, side, orderType, quantity, price } = body;

  if (!symbol) errors.push('symbol is required');
  if (!ORDER_SIDES.includes(side)) errors.push(`side must be one of: ${ORDER_SIDES.join(', ')}`);
  if (!ORDER_TYPES.includes(orderType)) errors.push(`orderType must be one of: ${ORDER_TYPES.join(', ')}`);
  if (!quantity || quantity <= 0) errors.push('quantity must be a positive number');
  if (orderType !== 'market' && (!price || price <= 0)) errors.push('price is required for limit/stop-loss orders');

  return errors;
}