import { listNotifications } from '../services/notificationService.js';
import { ok, fail } from '../utils/apiResponse.js';

export async function list(req, res) {
  try {
    const data = await listNotifications(req.user.id);
    return ok(res, data);
  } catch (err) {
    return fail(res, err.message, 500);
  }
}