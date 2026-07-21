import { submitKyc } from '../services/kycService.js';
import { validateKycPayload } from '../validators/kycValidator.js';
import { ok, fail } from '../utils/apiResponse.js';

export async function submit(req, res) {
  const errors = validateKycPayload(req.body);
  if (errors.length) return fail(res, errors.join(', '), 422);

  try {
    const result = await submitKyc(req.user.id, req.body);
    return ok(res, result, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}