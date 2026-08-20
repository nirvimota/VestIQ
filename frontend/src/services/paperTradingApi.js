// src/services/paperTradingApi.js
// Thin fetch wrapper for the /api/learn/* paper trading routes.
// Attaches the current Supabase session token as a Bearer header,
// since paperTradingController's requireAuth middleware expects it.

import { supabase } from "./supabaseClient"; // adjust path if different in your project

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function authFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  // TEMP DEBUG — remove once the 401 is resolved
  console.log("[paperTradingApi] session:", session);
  console.log("[paperTradingApi] token present?", Boolean(token));

  const res = await fetch(`${BASE_URL}/api/learn${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const message = json?.message || json?.error || `Request failed (${res.status})`;
    throw Object.assign(new Error(message), { status: res.status });
  }

  // Support either { success, data } shape from `ok()`, or a bare payload
  return json?.data !== undefined ? json.data : json;
}

export const getPaperAccount = () => authFetch("/account");

export const getPaperPortfolio = () => authFetch("/portfolio");

export const getPaperHoldings = () => authFetch("/holdings");

export const getPaperOrders = () => authFetch("/orders");

export const placePaperOrder = ({ symbol, side, orderType, quantity, limitPrice }) =>
  authFetch("/orders", {
    method: "POST",
    body: JSON.stringify({ symbol, side, orderType, quantity, limitPrice }),
  });

export const resetPaperAccount = () => authFetch("/reset", { method: "POST" }); 