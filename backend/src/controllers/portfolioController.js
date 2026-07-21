import { getHoldings, getFundsSummary } from '../services/portfolioService.js';
import { ok, fail } from '../utils/apiResponse.js';

export async function holdings(req, res) {
  try {
    const data = await getHoldings(req.user.id);
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}

export async function funds(req, res) {
  try {
    const data = await getFundsSummary(req.user.id);
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}