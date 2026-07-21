import { ORDER_STATUS } from '../utils/constants.js';

export function resolveInitialStatus(orderType) {
  return orderType === 'market' ? ORDER_STATUS.FILLED : ORDER_STATUS.PENDING;
}