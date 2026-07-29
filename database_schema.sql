-- ============================================================
--  VestIQ — Complete Database Schema
--  Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles table (already exists from previous setup, but ensuring completeness)
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT DEFAULT '',
    phone       TEXT DEFAULT '',
    avatar_url  TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 2. Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol      TEXT NOT NULL,
    side        TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    order_type  TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop-loss')),
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    price       DECIMAL(15, 4), -- NULL for market orders
    status      TEXT NOT NULL CHECK (status IN ('pending', 'filled', 'partial', 'rejected', 'cancelled')) DEFAULT 'pending',
    filled_quantity INTEGER DEFAULT 0,
    average_price DECIMAL(15, 4),
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON public.orders(symbol);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 3. Positions table
CREATE TABLE IF NOT EXISTS public.positions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol      TEXT NOT NULL,
    quantity    DECIMAL(18, 6) NOT NULL DEFAULT 0, -- Allow fractional shares
    average_price DECIMAL(15, 4) NOT NULL DEFAULT 0,
    current_price DECIMAL(15, 4),
    market_value DECIMAL(18, 2),
    unrealized_pnl DECIMAL(18, 2),
    realized_pnl DECIMAL(18, 2) DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, symbol)
);

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Policies for positions
CREATE POLICY "Users can view own positions" ON public.positions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own positions" ON public.positions
    FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for positions
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON public.positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON public.positions(symbol);

-- 4. Holdings table (for mutual funds, ETFs, etc. - similar to positions but different handling)
CREATE TABLE IF NOT EXISTS public.holdings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol      TEXT NOT NULL,
    quantity    DECIMAL(18, 6) NOT NULL DEFAULT 0,
    average_price DECIMAL(15, 4) NOT NULL DEFAULT 0,
    current_price DECIMAL(15, 4),
    market_value DECIMAL(18, 2),
    unrealized_pnl DECIMAL(18, 2),
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, symbol)
);

ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

-- Policies for holdings
CREATE POLICY "Users can view own holdings" ON public.holdings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings" ON public.holdings
    FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for holdings
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON public.holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON public.holdings(symbol);

-- 5. Watchlist table
CREATE TABLE IF NOT EXISTS public.watchlist (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol      TEXT NOT NULL,
    added_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, symbol)
);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Policies for watchlist
CREATE POLICY "Users can view own watchlist" ON public.watchlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist" ON public.watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist" ON public.watchlist
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for watchlist
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON public.watchlist(symbol);

-- 6. Alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol      TEXT NOT NULL,
    condition   TEXT NOT NULL CHECK (condition IN ('above', 'below', 'equals')),
    target_price DECIMAL(15, 4) NOT NULL CHECK (target_price > 0),
    is_active   BOOLEAN DEFAULT true,
    triggered_at TIMESTAMPTZ NULL,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Policies for alerts
CREATE POLICY "Users can view own alerts" ON public.alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON public.alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON public.alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for alerts
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON public.alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(is_active) WHERE is_active = true;

-- 7. Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id    UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    type        TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'deposit', 'withdrawal', 'dividend', 'fee')),
    symbol      TEXT,
    quantity    DECIMAL(18, 6),
    price       DECIMAL(15, 4),
    amount      DECIMAL(18, 2) NOT NULL,
    fees        DECIMAL(18, 2) DEFAULT 0,
    net_amount  DECIMAL(18, 2),
    status      TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'completed',
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- 8. KYC Submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT NOT NULL,
    date_of_birth DATE,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'India',
    pan_number TEXT,
    aadhar_number TEXT,
    document_type TEXT NOT NULL CHECK (document_type IN ('pan', 'aadhar', 'passport', 'driving_license')),
    document_number TEXT NOT NULL,
    document_front_url TEXT, -- URL to uploaded document in Supabase storage
    document_back_url TEXT,  -- URL to uploaded document in Supabase storage (if applicable)
    selfie_url TEXT,         -- URL to selfie with document
    status      TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')) DEFAULT 'pending',
    rejected_reason TEXT,
    reviewed_by UUID REFERENCES auth.users(id), -- Admin who reviewed
    reviewed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for KYC submissions
CREATE POLICY "Users can view own KYC submissions" ON public.kyc_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC submissions" ON public.kyc_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own KYC submissions" ON public.kyc_submissions
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies (service role bypasses RLS, but explicit policies for clarity)
CREATE POLICY "Admins can view all KYC submissions" ON public.kyc_submissions
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Admins can update KYC submissions" ON public.kyc_submissions
    FOR UPDATE USING (auth.role() = 'service_role');

-- Indexes for KYC
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON public.kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON public.kyc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_kyc_pan ON public.kyc_submissions(pan_number);
CREATE INDEX IF NOT EXISTS idx_kyc_aadhar ON public.kyc_submissions(aadhar_number);

-- 9. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    message     TEXT,
    kind        TEXT NOT NULL CHECK (kind IN ('info', 'warning', 'error', 'success', 'order', 'kyc', 'alert', 'market')),
    is_read     BOOLEAN DEFAULT false,
    data        JSONB, -- For additional structured data
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 10. Funds table (for user balances and margins)
CREATE TABLE IF NOT EXISTS public.funds (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    available_balance DECIMAL(18, 2) NOT NULL DEFAULT 0,
    blocked_margin  DECIMAL(18, 2) NOT NULL DEFAULT 0,
    total_balance   DECIMAL(18, 2) GENERATED ALWAYS AS (available_balance + blocked_margin) STORED,
    currency        TEXT DEFAULT 'INR',
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;

-- Policies for funds
CREATE POLICY "Users can view own funds" ON public.funds
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own funds" ON public.funds
    FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for funds
CREATE INDEX IF NOT EXISTS idx_funds_user_id ON public.funds(user_id);

-- 11. Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    metadata    JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Policies for audit logs (only inserts, no selects/update/delete for regular users)
CREATE POLICY "Anyone can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (auth.role() = 'service_role');

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 12. Market Data Cache table (for storing recent quotes)
CREATE TABLE IF NOT EXISTS public.market_data_cache (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol      TEXT NOT NULL,
    price       DECIMAL(15, 4) NOT NULL,
    day_high    DECIMAL(15, 4),
    day_low     DECIMAL(15, 4),
    change_pct  DECIMAL(8, 4),
    volume      BIGINT,
    last_updated TIMESTAMPTZ DEFAULT now(),
    UNIQUE(symbol)
);

-- Indexes for market data cache
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON public.market_data_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_market_data_updated ON public.market_data_cache(last_updated);

-- 13. Dividends table (for tracking dividends)
CREATE TABLE IF NOT EXISTS public.dividends (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol      TEXT NOT NULL,
    amount_per_share DECIMAL(10, 4) NOT NULL,
    announcement_date DATE NOT NULL,
    record_date DATE NOT NULL,
    payment_date DATE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes for dividends
CREATE INDEX IF NOT EXISTS idx_dividends_symbol ON public.dividends(symbol);
CREATE INDEX IF NOT EXISTS idx_dividends_payment_date ON public.dividends(payment_date);

-- ============================================================
--  Updated Trigger Functions for updated_at columns
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
DO $$
DECLARE
    tables CURSOR FOR
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'orders', 'positions', 'holdings', 'watchlist', 'alerts', 'kyc_submissions', 'notifications', 'funds', 'market_data_cache');
BEGIN
    FOR table_record IN tables LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS update_%I_updated_at ON %I; ' ||
            'CREATE TRIGGER update_%I_updated_at ' ||
            'BEFORE UPDATE ON %I FOR EACH ROW ' ||
            'EXECUTE FUNCTION public.update_updated_at_column();',
            table_record.tablename, table_record.tablename,
            table_record.tablename, table_record.tablename
        );
    END LOOP;
END $$;

-- ============================================================
--  Initial Data (Reference Data)
-- ============================================================

-- Insert some common Indian stocks for initial reference
INSERT INTO public.market_data_cache (symbol, price, day_high, day_low, change_pct, volume) VALUES
    ('RELIANCE', 2945.60, 2958.20, 2910.00, 1.20, 2500000),
    ('TCS', 3812.40, 3860.00, 3795.50, -0.40, 1800000),
    ('HDFCBANK', 1675.20, 1682.00, 1660.10, 0.80, 3200000),
    ('INFY', 1842.90, 1855.00, 1830.20, 0.30, 2100000),
    ('ICICIBANK', 985.30, 990.50, 975.80, 0.50, 4500000),
    ('HINDUNILVR', 2680.70, 2695.30, 2660.20, -0.20, 850000),
    ('SBIN', 685.40, 690.20, 680.10, 0.70, 5200000),
    ('BHARTIARTL', 925.80, 932.10, 918.50, 1.10, 3100000),
    ('KOTAKBANK', 1845.20, 1852.00, 1838.50, -0.30, 1200000),
    ('LT', 2480.50, 2495.80, 2465.30, 0.60, 950000)
ON CONFLICT (symbol) DO UPDATE SET
    price = EXCLUDED.price,
    day_high = EXCLUDED.day_high,
    day_low = EXCLUDED.day_low,
    change_pct = EXCLUDED.change_pct,
    volume = EXCLUDED.volume,
    last_updated = now();

-- ============================================================
--  Completed!
-- ============================================================
-- Test by running:
-- SELECT * FROM public.profiles LIMIT 1;
-- SELECT * FROM public.orders LIMIT 1;
-- etc.
-- ============================================================