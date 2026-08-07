-- ============================================================
--  VestIQ — Watchlist Table
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Create the watchlist table
CREATE TABLE IF NOT EXISTS public.watchlist (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol      TEXT NOT NULL,
    added_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, symbol)   -- prevents duplicate entries per user
);

-- Enable Row Level Security
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Users can only see their own watchlist items
CREATE POLICY "Users can view own watchlist"
    ON public.watchlist FOR SELECT
    USING (auth.uid() = user_id);

-- Users can add to their own watchlist
CREATE POLICY "Users can insert own watchlist"
    ON public.watchlist FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete from their own watchlist
CREATE POLICY "Users can delete own watchlist"
    ON public.watchlist FOR DELETE
    USING (auth.uid() = user_id);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol  ON public.watchlist(symbol);

-- ============================================================
--  Done! Test with:
--    SELECT * FROM public.watchlist;
-- ============================================================
