import { registerUser, loginUser } from '../services/authService.js';
import { validateEmailPassword } from '../validators/authValidator.js';
import { ok, fail } from '../utils/apiResponse.js';

export async function register(req, res) {
  const errors = validateEmailPassword(req.body);
  if (errors.length) return fail(res, errors.join(', '), 422);

  const { email, password } = req.body;
  const { data, error } = await registerUser(email, password);
  if (error) return fail(res, error.message, 400);
  return ok(res, data, 201);
}

export async function login(req, res) {
  const errors = validateEmailPassword(req.body);
  if (errors.length) return fail(res, errors.join(', '), 422);

  const { email, password } = req.body;
  const { data, error } = await loginUser(email, password);
  if (error) return fail(res, error.message, 401);
  return ok(res, data);
}