const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json.data;
}

export function getNotifications(token) {
  return apiFetch('/notifications', { token });
}
