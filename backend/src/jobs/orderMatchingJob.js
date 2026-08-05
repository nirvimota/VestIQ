/**
 * orderMatchingJob.js
 * Background job to evaluate and execute pending limit & stop-loss orders.
 */

import { OrderMatchingService } from '../services/orderMatchingService.js';

export async function runOrderMatchingCheck() {
  try {
    const results = await OrderMatchingService.processPendingOrders();
    if (results.length > 0) {
      console.log(`[OrderMatchingJob] Processed and filled ${results.length} orders.`);
    }
  } catch (err) {
    console.error('[OrderMatchingJob] Error running matching cycle:', err.message);
  }
}

/**
 * Start periodic order matching scheduler
 * @param {number} intervalMs  Execution frequency in milliseconds (default: 5000ms)
 * @returns {NodeJS.Timeout} Timer reference
 */
export function startOrderMatchingScheduler(intervalMs = 5000) {
  console.log(`[OrderMatchingJob] Order matching scheduler started (interval: ${intervalMs}ms)`);
  
  // Run initial check
  runOrderMatchingCheck();

  return setInterval(() => {
    runOrderMatchingCheck();
  }, intervalMs);
}

export default { runOrderMatchingCheck, startOrderMatchingScheduler };
