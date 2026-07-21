const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Helper — calls the backend API with JSON body + auth header.
 */
async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Something went wrong');
  return json.data;
}

/** POST /api/auth/register */
export function registerUser({ email, password, fullName, phone }) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: { email, password, fullName, phone },
  });
}

/** POST /api/auth/login */
export function loginUser({ email, password }) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

/** GET /api/auth/me — requires Bearer token */
export function getMe(token) {
  return apiFetch('/auth/me', { token });
}
