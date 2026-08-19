-- ============================================================
-- VestIQ Paper Trading — Supabase SQL Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Paper Accounts: one per user, auto-credited 100000
CREATE TABLE IF NOT EXISTS paper_accounts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance       numeric(15,2) NOT NULL DEFAULT 100000.00,
  initial_cash  numeric(15,2) NOT NULL DEFAULT 100000.00,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '11 days'),
  reset_count   int         NOT NULL DEFAULT 0,
  CONSTRAINT paper_accounts_user_id_key UNIQUE (user_id)
);

-- 2. Paper Trades: every executed order in paper mode
CREATE TABLE IF NOT EXISTS paper_trades (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid        NOT NULL REFERENCES paper_accounts(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol        text        NOT NULL,
  side          text        NOT NULL CHECK (side IN ('buy','sell')),
  quantity      int         NOT NULL CHECK (quantity > 0),
  price         numeric(12,2) NOT NULL CHECK (price > 0),
  order_type    text        NOT NULL DEFAULT 'market',
  status        text        NOT NULL DEFAULT 'filled',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 3. Indexes for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_paper_accounts_user_id ON paper_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_user_id   ON paper_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_account   ON paper_trades(account_id);
CREATE INDEX IF NOT EXISTS idx_paper_trades_symbol    ON paper_trades(symbol);

-- 4. Row-Level Security
ALTER TABLE paper_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_trades   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own paper_accounts"
  ON paper_accounts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users see own paper_trades"
  ON paper_trades FOR ALL
  USING (auth.uid() = user_id);
