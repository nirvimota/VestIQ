import {
  registerUser,
  loginUser,
  createProfile,
  getProfileById,
} from '../services/authService.js';
import { validateEmailPassword } from '../validators/authValidator.js';
import { ok, fail } from '../utils/apiResponse.js';

/**
 * POST /api/auth/register
 * Body: { email, password, fullName?, phone? }
 */
export async function register(req, res) {
  const errors = validateEmailPassword(req.body);
  if (errors.length) return fail(res, errors.join(', '), 422);

  const { email, password, fullName, phone } = req.body;

  // 1. Create Supabase Auth user
  const { data: authData, error: authError } = await registerUser(email, password);
  if (authError) return fail(res, authError.message, 400);

  // 2. Create a profile row
  const userId = authData.user?.id;
  if (userId) {
    await createProfile(userId, { fullName, phone });
  }

  return ok(res, {
    user: authData.user,
    session: authData.session,
  }, 201);
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req, res) {
  const errors = validateEmailPassword(req.body);
  if (errors.length) return fail(res, errors.join(', '), 422);

  const { email, password } = req.body;
  const { data, error } = await loginUser(email, password);
  if (error) return fail(res, error.message, 401);

  // Fetch profile alongside login
  let profile = null;
  if (data.user?.id) {
    const { data: profileData } = await getProfileById(data.user.id);
    profile = profileData;
  }

  return ok(res, {
    user: data.user,
    session: data.session,
    profile,
  });
}

/**
 * GET /api/auth/me
 * Requires: Bearer token (requireAuth middleware populates req.user)
 */
export async function getMe(req, res) {
  const { data: profile, error } = await getProfileById(req.user.id);
  if (error) return fail(res, 'Profile not found', 404);

  return ok(res, {
    user: req.user,
    profile,
  });
}