// src/pages/market.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';
import { searchStocks, getStockQuote, getStockQuotes } from '../services/stockApi';
import { addToWatchlist, removeFromWatchlist, getWatchlist } from '../services/watchlistApi';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Plus,
  Check,
  Loader2,
  LayoutGrid,
  Clock,
  CalendarDays,
  Target,
  X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// vestIQ — Live Market v2
// Same live-data Overview as before, now with an internal pill tab switch
// (Overview / Intraday / Long-term) so Market itself gives a quick read on
// today's positions and long-term holdings without leaving the page.
// Intraday.jsx and LongTerm.jsx remain separate full pages/routes for the
// dedicated views — these are compact summaries of the same mock data.
// ---------------------------------------------------------------------------

const INK = '#0A0F1A';
const CARD = '#111826';
const BORDER = '#1E2838';
const TEXT = '#ECEEF0';
const SUB = '#8A93A6';
const MUTE = '#4E5A70';
const TEAL = '#2ED9B8';
const BLUE = '#5B9CFF';
const PURPLE = '#B98CFF';
const RED = '#EF5A5A';

function linePath(values, w, h, pad = 4) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * step;
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

const DEFAULT_SYMBOLS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries' },
  { symbol: 'TCS', name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'INFY', name: 'Infosys' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'ITC', name: 'ITC Ltd' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors' },
];

function fmt(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StockSkeleton() {
  return (
    <div className="v5-card rounded-2xl px-5 py-4 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl" style={{ background: BORDER }} />
        <div className="space-y-2">
          <div className="h-3 w-24 rounded" style={{ background: BORDER }} />
          <div className="h-2 w-36 rounded" style={{ background: BORDER }} />
        </div>
      </div>
      <div className="space-y-2 text-right">
        <div className="h-3 w-20 rounded" style={{ background: BORDER }} />
        <div className="h-2 w-14 rounded ml-auto" style={{ background: BORDER }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Intraday tab — compact mock summary, mirrors Intraday.jsx's data shape
// ---------------------------------------------------------------------------
const MOCK_POSITIONS = [
  { id: 'pos_1', symbol: 'RELIANCE', type: 'BUY', qty: 20, avg: 2932.4, ltp: 2945.1, spark: [2930, 2925, 2938, 2933, 2940, 2936, 2945.1] },
  { id: 'pos_2', symbol: 'HDFCBANK', type: 'SELL', qty: 30, avg: 1649.0, ltp: 1642.3, spark: [1650, 1655, 1648, 1652, 1646, 1644, 1642.3] },
  { id: 'pos_3', symbol: 'INFY', type: 'BUY', qty: 12, avg: 1502.75, ltp: 1497.2, spark: [1502, 1498, 1500, 1495, 1499, 1494, 1497.2] },
  { id: 'pos_4', symbol: 'TCS', type: 'BUY', qty: 8, avg: 3861.5, ltp: 3890.1, spark: [3862, 3868, 3859, 3871, 3880, 3875, 3890.1] },
];

function pnlFor(p) {
  const dir = p.type === 'BUY' ? 1 : -1;
  const diff = (p.ltp - p.avg) * dir;
  return { amount: diff * p.qty, pct: (diff / p.avg) * 100 };
}

function IntradaySection({ onOpenStock }) {
  const positions = useMemo(() => MOCK_POSITIONS.map((p) => ({ ...p, pnl: pnlFor(p) })), []);
  const totalPnl = positions.reduce((sum, p) => sum + p.pnl.amount, 0);
  const totalInvested = positions.reduce((sum, p) => sum + p.avg * p.qty, 0);
  const totalPnlPct = (totalPnl / totalInvested) * 100;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="v5-card rounded-2xl px-5 py-4">
          <p className="v5-body text-xs" style={{ color: SUB }}>Today's P&amp;L</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="v5-display text-xl" style={{ color: totalPnl >= 0 ? TEAL : RED }}>
              {totalPnl >= 0 ? '+' : '-'}₹{Math.abs(totalPnl).toFixed(2)}
            </span>
            <span className="v5-mono text-[10px]" style={{ color: totalPnl >= 0 ? TEAL : RED }}>
              ({totalPnlPct.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="v5-card rounded-2xl px-5 py-4">
          <p className="v5-body text-xs" style={{ color: SUB }}>Invested</p>
          <p className="v5-display text-xl mt-1" style={{ color: TEXT }}>
            ₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="v5-card rounded-2xl px-5 py-4">
          <p className="v5-body text-xs" style={{ color: SUB }}>Open positions</p>
          <p className="v5-display text-xl mt-1" style={{ color: TEXT }}>{positions.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {positions.map((p) => {
          const spark = linePath(p.spark, 100, 32);
          const up = p.pnl.amount >= 0;
          return (
            <motion.div
              key={p.id}
              whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.16)' }}
              onClick={() => onOpenStock(p.symbol)}
              className="v5-card rounded-xl px-4 py-3 flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center v5-mono text-[9px] font-bold shrink-0"
                  style={{ background: p.type === 'BUY' ? `${TEAL}1A` : `${RED}1A`, color: p.type === 'BUY' ? TEAL : RED }}
                >
                  {p.symbol.slice(0, 3)}
                </div>
                <div className="min-w-0">
                  <p className="v5-body text-sm font-medium truncate" style={{ color: TEXT }}>{p.symbol}</p>
                  <p className="v5-mono text-[10px] mt-0.5" style={{ color: MUTE }}>
                    {p.type} {p.qty} @ ₹{p.avg.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="hidden sm:block h-[32px] w-[100px] shrink-0">
                <svg viewBox="0 0 100 32" className="w-full h-full" preserveAspectRatio="none">
                  <path d={spark} fill="none" stroke={up ? TEAL : RED} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              <div className="text-right shrink-0">
                <p className="v5-mono text-sm" style={{ color: TEXT }}>₹{p.ltp.toFixed(2)}</p>
                <p className="v5-mono text-[11px] mt-0.5" style={{ color: up ? TEAL : RED }}>
                  {up ? '+' : '-'}₹{Math.abs(p.pnl.amount).toFixed(2)}
                </p>
              </div>

              <button
                onClick={(e) => e.stopPropagation()}
                className="v5-body text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-full shrink-0"
                style={{ color: RED, border: `1px solid ${RED}40` }}
              >
                <X size={10} /> Exit
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Long-term tab — compact mock summary, mirrors LongTerm.jsx's data shape
// ---------------------------------------------------------------------------
const MOCK_HOLDINGS = [
  { id: 'lt_1', symbol: 'RELIANCE', qty: 25, avg: 2210.5, ltp: 2945.6, boughtOn: '2023-11-14', target: 3400, spark: [2210, 2340, 2280, 2510, 2600, 2720, 2860, 2945.6] },
  { id: 'lt_2', symbol: 'HDFCBANK', qty: 40, avg: 1420.0, ltp: 1675.2, boughtOn: '2024-02-02', target: 1800, spark: [1420, 1455, 1480, 1510, 1560, 1590, 1640, 1675.2] },
  { id: 'lt_3', symbol: 'TCS', qty: 10, avg: 3450.0, ltp: 3812.4, boughtOn: '2023-06-20', target: 4200, spark: [3450, 3520, 3480, 3600, 3650, 3700, 3760, 3812.4] },
  { id: 'lt_4', symbol: 'INFY', qty: 18, avg: 1610.0, ltp: 1462.1, boughtOn: '2024-08-05', target: 1900, spark: [1610, 1580, 1595, 1540, 1510, 1490, 1470, 1462.1] },
];

function daysHeld(boughtOn) {
  return Math.floor((Date.now() - new Date(boughtOn).getTime()) / 86400000);
}

function LongTermSection({ onOpenStock }) {
  const holdings = useMemo(
    () =>
      MOCK_HOLDINGS.map((h) => {
        const days = daysHeld(h.boughtOn);
        const gainAmount = (h.ltp - h.avg) * h.qty;
        const gainPct = ((h.ltp - h.avg) / h.avg) * 100;
        const progressToTarget = Math.min(100, Math.max(0, ((h.ltp - h.avg) / (h.target - h.avg)) * 100));
        return { ...h, days, gainAmount, gainPct, progressToTarget };
      }),
    []
  );

  const totalInvested = holdings.reduce((sum, h) => sum + h.avg * h.qty, 0);
  const totalValue = holdings.reduce((sum, h) => sum + h.ltp * h.qty, 0);
  const totalGain = totalValue - totalInvested;
  const totalGainPct = (totalGain / totalInvested) * 100;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="v5-card rounded-2xl px-5 py-4">
          <p className="v5-body text-xs" style={{ color: SUB }}>Current value</p>
          <p className="v5-display text-xl mt-1" style={{ color: TEXT }}>
            ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="v5-card rounded-2xl px-5 py-4">
          <p className="v5-body text-xs" style={{ color: SUB }}>Overall gain</p>
          <p className="v5-display text-xl mt-1" style={{ color: totalGain >= 0 ? TEAL : RED }}>
            {totalGain >= 0 ? '+' : '-'}₹{Math.abs(totalGain).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            <span className="v5-mono text-[11px] ml-1.5">({totalGainPct.toFixed(2)}%)</span>
          </p>
        </div>
        <div className="v5-card rounded-2xl px-5 py-4">
          <p className="v5-body text-xs" style={{ color: SUB }}>Holdings</p>
          <p className="v5-display text-xl mt-1" style={{ color: TEXT }}>{holdings.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {holdings.map((h) => {
          const spark = linePath(h.spark, 100, 32);
          const up = h.gainAmount >= 0;
          return (
            <motion.div
              key={h.id}
              whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.16)' }}
              onClick={() => onOpenStock(h.symbol)}
              className="v5-card rounded-xl px-4 py-3 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center v5-mono text-[9px] font-bold shrink-0"
                    style={{ background: `${PURPLE}1A`, color: PURPLE }}
                  >
                    {h.symbol.slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <p className="v5-body text-sm font-medium truncate" style={{ color: TEXT }}>{h.symbol}</p>
                    <p className="v5-mono text-[10px] mt-0.5" style={{ color: MUTE }}>
                      {h.qty} qty · held {h.days}d
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block h-[32px] w-[100px] shrink-0">
                  <svg viewBox="0 0 100 32" className="w-full h-full" preserveAspectRatio="none">
                    <path d={spark} fill="none" stroke={up ? TEAL : RED} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="text-right shrink-0">
                  <p className="v5-mono text-sm" style={{ color: TEXT }}>₹{h.ltp.toFixed(2)}</p>
                  <p className="v5-mono text-[11px] mt-0.5" style={{ color: up ? TEAL : RED }}>
                    {up ? '+' : '-'}₹{Math.abs(h.gainAmount).toFixed(0)} ({h.gainPct.toFixed(2)}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2.5">
                <Target size={10} style={{ color: MUTE }} />
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${h.progressToTarget}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: TEAL }}
                  />
                </div>
                <span className="v5-mono text-[10px] shrink-0" style={{ color: MUTE }}>
                  Target ₹{h.target.toFixed(0)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'intraday', label: 'Intraday', icon: Clock },
  { key: 'longterm', label: 'Long-term', icon: CalendarDays },
];

export default function LiveMarket() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const token = session?.access_token;

  const [tab, setTab] = useState('overview');

  const [stocks, setStocks] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [watchedSet, setWatchedSet] = useState(new Set());
  const [watchlistLoading, setWatchlistLoading] = useState(new Set());

  useEffect(() => {
    if (!token) return;
    getWatchlist(token)
      .then((items) => {
        const syms = (items || []).map((i) => i.symbol);
        setWatchedSet(new Set(syms));
      })
      .catch((err) => console.error('Watchlist load failed:', err));
  }, [token]);

  useEffect(() => {
    setLoadingPrices(true);
    setStocks(DEFAULT_SYMBOLS.map((s) => ({ ...s, price: null, change_pct: null, _loading: true })));

    const fetchPrices = async () => {
      try {
        const symbolList = DEFAULT_SYMBOLS.map((s) => s.symbol);
        const quotesMap = await getStockQuotes(symbolList);
        setStocks(
          DEFAULT_SYMBOLS.map((s) => ({
            ...s,
            ...(quotesMap[s.symbol] || {}),
            _loading: false,
            _error: !quotesMap[s.symbol] || quotesMap[s.symbol]._unavailable,
          }))
        );
      } catch (err) {
        console.error('Batch quote fetch failed, falling back to individual calls:', err);
        const results = await Promise.allSettled(
          DEFAULT_SYMBOLS.map((s) => getStockQuote(s.symbol).then((q) => ({ ...s, ...q, _loading: false })))
        );
        setStocks(results.map((r, i) => (r.status === 'fulfilled' ? r.value : { ...DEFAULT_SYMBOLS[i], _loading: false, _error: true })));
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPrices();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchStocks(searchQuery);
        setSearchResults(results || []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleWatchlist = useCallback(
    async (symbol, e) => {
      e.stopPropagation();
      if (!token) {
        navigate('/login');
        return;
      }
      if (watchlistLoading.has(symbol)) return;

      setWatchlistLoading((prev) => new Set(prev).add(symbol));
      try {
        if (watchedSet.has(symbol)) {
          await removeFromWatchlist(symbol, token);
          setWatchedSet((prev) => {
            const n = new Set(prev);
            n.delete(symbol);
            return n;
          });
        } else {
          await addToWatchlist(symbol, token);
          setWatchedSet((prev) => new Set(prev).add(symbol));
        }
      } catch (err) {
        console.error('Watchlist toggle failed:', err);
      } finally {
        setWatchlistLoading((prev) => {
          const n = new Set(prev);
          n.delete(symbol);
          return n;
        });
      }
    },
    [token, watchedSet, watchlistLoading, navigate]
  );

  // shared: every sub-section opens StockDetail as a popup on desktop /
  // full page on mobile, same pattern as Dashboard/Intraday/LongTerm pages
  const handleStockClick = (symbol) => {
    navigate(`/stock/${symbol}`, { state: { backgroundLocation: location } });
  };

  return (
    <div className="v5-root min-h-screen flex relative" style={{ background: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body { font-family: 'Inter', sans-serif; }
        .v5-card { background: ${CARD}; border: 1px solid ${BORDER}; transition: border-color 0.2s ease; }
      `}</style>

      <AmbientBackground opacity={0.12} />
      <Sidebar />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-8 pb-20 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="v5-display text-2xl" style={{ color: TEXT }}>Live Market</h1>
          <span className="v5-mono inline-flex items-center gap-1.5 text-xs" style={{ color: TEAL }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: TEAL }} /> NSE LIVE
          </span>
        </div>
        <p className="v5-body text-xs mb-5" style={{ color: SUB }}>
          Real-time NSE prices, your day positions, and long-term holdings — all in one place.
        </p>

        {/* Pill tab switch — Overview / Intraday / Long-term, all inside /Market */}
        <div className="relative flex items-center gap-1 v5-card rounded-full p-1 w-fit mb-6 ">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="v5-body relative text-xs px-4 py-2 rounded-full flex items-center gap-1.5"
                style={{ color: active ? INK : SUB }}
              >
                {active && (
                  <motion.div
                    layoutId="market-tab-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: TEAL }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <Icon size={13} />
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {/* Search */}
              <div className="relative mb-6">
                <Search size={18} className="absolute left-4 top-3.5" style={{ color: SUB }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search NSE stock (e.g. RELIANCE, TCS, INFY, TATAMOTORS)..."
                  className="v5-body w-full rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition-colors"
                  style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }}
                />

                {searchQuery.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-14 rounded-xl overflow-hidden z-30 max-h-72 overflow-y-auto" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                    {isSearching ? (
                      <div className="v5-mono p-4 text-xs flex items-center gap-2" style={{ color: SUB }}>
                        <Loader2 size={13} className="animate-spin" /> Searching NSE market...
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((item) => (
                        <div
                          key={item.symbol}
                          className="p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                          style={{ borderBottom: `1px solid ${BORDER}` }}
                        >
                          <div onClick={() => handleStockClick(item.symbol)} className="flex-1">
                            <span className="v5-mono text-sm font-bold" style={{ color: TEAL }}>{item.symbol}</span>
                            <p className="v5-body text-xs" style={{ color: SUB }}>{item.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="v5-mono text-[10px] px-2 py-0.5 rounded" style={{ color: MUTE, background: INK, border: `1px solid ${BORDER}` }}>
                              {item.exchange || 'NSE'}
                            </span>
                            {token && (
                              <button
                                onClick={(e) => toggleWatchlist(item.symbol, e)}
                                disabled={watchlistLoading.has(item.symbol)}
                                className="p-1.5 rounded-lg transition-colors"
                                style={
                                  watchedSet.has(item.symbol)
                                    ? { background: `${TEAL}33`, color: TEAL }
                                    : { background: BORDER, color: SUB }
                                }
                              >
                                {watchlistLoading.has(item.symbol) ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : watchedSet.has(item.symbol) ? (
                                  <Check size={13} />
                                ) : (
                                  <Plus size={13} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="v5-body p-4 text-xs" style={{ color: SUB }}>
                        No results found. Try the full symbol e.g. <span className="v5-mono" style={{ color: TEAL }}>HDFCBANK</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stock list */}
              <div className="space-y-3">
                {loadingPrices
                  ? DEFAULT_SYMBOLS.map((s) => <StockSkeleton key={s.symbol} />)
                  : stocks.map((s) => {
                    const up = (s.change_pct ?? 0) >= 0;
                    const watched = watchedSet.has(s.symbol);
                    const toggling = watchlistLoading.has(s.symbol);

                    return (
                      <div key={s.symbol} className="v5-card rounded-2xl px-5 py-4 flex items-center justify-between">
                        <div onClick={() => handleStockClick(s.symbol)} className="flex-1 cursor-pointer flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center v5-mono text-xs font-bold" style={{ background: INK, border: `1px solid ${BORDER}`, color: TEAL }}>
                            {s.symbol.substring(0, 3)}
                          </div>
                          <div>
                            <p className="v5-mono text-sm font-bold" style={{ color: TEXT }}>{s.symbol}</p>
                            <p className="v5-body text-xs truncate" style={{ color: SUB }}>{s.name}</p>
                          </div>
                        </div>

                        <div className="text-right mr-4 cursor-pointer" onClick={() => handleStockClick(s.symbol)}>
                          {s._loading ? (
                            <div className="animate-pulse space-y-1">
                              <div className="h-3 w-20 rounded" style={{ background: BORDER }} />
                              <div className="h-2 w-12 rounded ml-auto" style={{ background: BORDER }} />
                            </div>
                          ) : s._error || s.price == null ? (
                            <p className="v5-body text-xs" style={{ color: MUTE }}>Unavailable</p>
                          ) : (
                            <>
                              <p className="v5-mono text-sm font-semibold" style={{ color: TEXT }}>₹{fmt(s.price)}</p>
                              <p className="v5-mono text-xs flex items-center justify-end gap-0.5" style={{ color: up ? TEAL : RED }}>
                                {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                {up ? '+' : ''}{(s.change_pct ?? 0).toFixed(2)}%
                              </p>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {token && (
                            <button
                              onClick={(e) => toggleWatchlist(s.symbol, e)}
                              disabled={toggling}
                              title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                              className="p-2 rounded-xl transition-all"
                              style={
                                watched
                                  ? { background: `${TEAL}33`, color: TEAL, border: `1px solid ${TEAL}66` }
                                  : { background: BORDER, color: SUB, border: '1px solid transparent' }
                              }
                            >
                              {toggling ? <Loader2 size={14} className="animate-spin" /> : watched ? <Check size={14} /> : <Plus size={14} />}
                            </button>
                          )}

                          <button
                            onClick={() => handleStockClick(s.symbol)}
                            className="v5-body px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1 transition-colors"
                            style={{ background: BORDER, color: TEXT }}
                          >
                            <Sparkles size={13} /> AI
                          </button>

                          <button
                            onClick={() => navigate(`/order/${s.symbol}?side=buy`)}
                            className="v5-body px-4 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-90"
                            style={{ background: TEAL, color: INK }}
                          >
                            Buy
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}

          {tab === 'intraday' && (
            <motion.div key="intraday" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <IntradaySection onOpenStock={handleStockClick} />
            </motion.div>
          )}

          {tab === 'longterm' && (
            <motion.div key="longterm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <LongTermSection onOpenStock={handleStockClick} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}