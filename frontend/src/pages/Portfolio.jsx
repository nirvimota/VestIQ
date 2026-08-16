import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';
import { getPortfolioWithLivePrices, getStockHistory, getLiveQuotes } from '../services/portfolioApi';
import { getWatchlist } from '../services/watchlistApi';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const INK    = '#0A0F1A';
const CARD   = '#111826';
const CARD2  = '#141D2E';
const BORDER = '#1E2838';
const TEXT   = '#ECEEF0';
const SUB    = '#8A93A6';
const MUTE   = '#4E5A70';
const TEAL   = '#2ED9B8';
const RED    = '#EF5A5A';
const AMBER  = '#F59E0B';

const POLL_MS    = 15_000;  // live price refresh interval
const RANGES     = ['1D', '1W', '1M', '3M', '1Y'];

const INTERVAL_MAP = {
  '1D': { interval: '5min',  outputsize: 78  },
  '1W': { interval: '1h',    outputsize: 35  },
  '1M': { interval: '1day',  outputsize: 30  },
  '3M': { interval: '1day',  outputsize: 90  },
  '1Y': { interval: '1week', outputsize: 52  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtINR(n) {
  if (n == null || isNaN(n)) return '0.00';
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function genSyntheticSeries(symbol, points = 24) {
  const rand = seededRandom(symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  let v = 100 + rand() * 20;
  return Array.from({ length: points }, (_, i) => {
    v += (rand() - 0.48) * 6;
    return { i, v: Math.max(20, +v.toFixed(2)), datetime: '' };
  });
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, up, width = 84, height = 32 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map((d) => d.v ?? d.close ?? 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = vals.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M${points.join(' L')}`;
  const color = up ? TEAL : RED;
  const areaPath = `${path} L${width},${height} L0,${height} Z`;
  const gradId = `spark-${up ? 't' : 'r'}-${Math.round(min)}-${width}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="shrink-0 w-[190px] rounded-xl px-4 py-3"
      style={{ background: CARD, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3.5 w-20 rounded" style={{ background: BORDER, animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div className="h-2.5 w-10 rounded" style={{ background: BORDER, animation: 'pulse 1.6s ease-in-out infinite 0.2s' }} />
        </div>
        <div className="h-6 w-14 rounded" style={{ background: BORDER, animation: 'pulse 1.6s ease-in-out infinite 0.4s' }} />
      </div>
      <div className="flex items-baseline justify-between mt-3">
        <div className="h-3.5 w-16 rounded" style={{ background: BORDER, animation: 'pulse 1.6s ease-in-out infinite 0.1s' }} />
        <div className="h-3 w-10 rounded" style={{ background: BORDER, animation: 'pulse 1.6s ease-in-out infinite 0.3s' }} />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyPortfolio({ onGoToMarket }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: `${TEAL}15`, border: `1px solid ${TEAL}30` }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M6 27L13 19L18 24L25 14L30 9" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="30" cy="9" r="3" fill={TEAL} fillOpacity="0.3" stroke={TEAL} strokeWidth="1.5"/>
        </svg>
      </div>
      <h2 className="v5-display text-xl mb-2" style={{ color: TEXT }}>No holdings yet</h2>
      <p className="v5-body text-sm mb-8 max-w-xs" style={{ color: SUB }}>
        Buy stocks from the market to see them here with live prices and P&amp;L tracking.
      </p>
      <motion.button
        onClick={onGoToMarket}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="v5-body text-sm font-semibold px-6 py-2.5 rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${TEAL}22, ${TEAL}11)`,
          border: `1px solid ${TEAL}60`,
          color: TEAL,
        }}
      >
        Go to Market →
      </motion.button>
    </motion.div>
  );
}

// ─── Live Dot ─────────────────────────────────────────────────────────────────
function LiveIndicator({ isLive }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-2 h-2">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: isLive ? TEAL : MUTE,
            boxShadow: isLive ? `0 0 6px ${TEAL}` : 'none',
            animation: isLive ? 'livePulse 1.8s ease-in-out infinite' : 'none',
          }}
        />
      </div>
      <span className="v5-mono text-[10px] uppercase tracking-widest" style={{ color: isLive ? TEAL : MUTE }}>
        {isLive ? 'Live' : 'Loading'}
      </span>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomChartTooltip({ active, payload, label, symbol }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  const dt = payload[0]?.payload?.datetime || '';
  return (
    <div
      className="v5-mono text-xs px-3 py-2 rounded-lg"
      style={{ background: CARD2, border: `1px solid ${BORDER}`, color: TEXT }}
    >
      {dt && <p style={{ color: MUTE, marginBottom: 2 }}>{dt}</p>}
      <p>{symbol}: <span style={{ color: TEXT }}>₹{v != null ? v.toFixed(2) : '-'}</span></p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Portfolio() {
  const navigate = useNavigate();

  const [holdings, setHoldings]         = useState([]);
  const [watchlist, setWatchlist]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [isLive, setIsLive]             = useState(false);
  const [lastUpdated, setLastUpdated]   = useState(null);

  const [selected, setSelected]         = useState(0);
  const [range, setRange]               = useState('1M');
  const [chartData, setChartData]       = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  const token = localStorage.getItem('vestiq_token') || localStorage.getItem('token');
  const intervalRef = useRef(null);
  const mountedRef  = useRef(true);

  // ── Fetch holdings with live price enrichment ──────────────────────────────
  const fetchHoldings = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const data = await getPortfolioWithLivePrices(token);
      if (!mountedRef.current) return;
      setHoldings(Array.isArray(data) ? data : []);
      setIsLive(true);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[Portfolio] fetch failed:', err);
      if (mountedRef.current) setIsLive(false);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [token]);

  // ── Fetch watchlist with live quotes ──────────────────────────────────────
  const fetchWatchlist = useCallback(async () => {
    if (!token) return;
    try {
      const wl = await getWatchlist(token);
      if (!mountedRef.current || !Array.isArray(wl) || wl.length === 0) return;

      const symbols = wl.map((w) => w.symbol || w);
      let quotes = {};
      try { quotes = await getLiveQuotes(symbols); } catch {}

      const enriched = symbols.map((sym) => {
        const q = quotes[sym.toUpperCase()];
        const base = wl.find((w) => (w.symbol || w) === sym) || {};
        return {
          symbol: sym,
          name: q?.name || base.name || sym,
          ltp: q?.price ?? base.ltp ?? 0,
          chg: q?.change_pct ?? base.change_pct ?? 0,
        };
      });
      if (mountedRef.current) setWatchlist(enriched);
    } catch (err) {
      console.error('[Portfolio] watchlist fetch failed:', err);
    }
  }, [token]);

  // ── Polling setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    fetchHoldings();
    fetchWatchlist();

    intervalRef.current = setInterval(() => {
      fetchHoldings();
      fetchWatchlist();
    }, POLL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [fetchHoldings, fetchWatchlist]);

  // ── Enrich holdings with computed fields + sparkline ─────────────────────
  const enriched = useMemo(() =>
    holdings.map((h) => {
      const avg  = parseFloat(h.avg || h.average_price || 0);
      const ltp  = parseFloat(h.ltp || h.current_price || avg);
      const qty  = parseFloat(h.qty || h.quantity || 0);
      const up   = ltp >= avg;
      const pnl  = (ltp - avg) * qty;
      const pnlPct = avg > 0 ? ((ltp - avg) / avg) * 100 : 0;
      return {
        ...h,
        symbol: (h.symbol || '').toUpperCase(),
        name: h.name || h.symbol,
        qty,
        avg,
        ltp,
        up,
        pnl,
        pnlPct,
        value: ltp * qty,
        series: genSyntheticSeries(h.symbol || 'X'),
      };
    }),
  [holdings]);

  const totalValue  = enriched.reduce((a, h) => a + h.value, 0);
  const totalPnl    = enriched.reduce((a, h) => a + h.pnl, 0);
  const totalUp     = totalPnl >= 0;
  const totalInvest = enriched.reduce((a, h) => a + h.avg * h.qty, 0);
  const totalPct    = totalInvest > 0 ? (totalPnl / totalInvest) * 100 : 0;

  const active = enriched[selected] || enriched[0] || null;

  // ── Fetch real chart data when selection or range changes ─────────────────
  useEffect(() => {
    if (!active?.symbol) return;
    const { interval, outputsize } = INTERVAL_MAP[range] || INTERVAL_MAP['1M'];
    let cancelled = false;

    setChartLoading(true);
    getStockHistory(active.symbol, interval, outputsize)
      .then((series) => {
        if (cancelled) return;
        if (Array.isArray(series) && series.length > 0) {
          const pts = series.map((s, i) => ({
            i,
            v: parseFloat(s.close ?? s.v ?? 0),
            datetime: s.datetime || '',
          }));
          setChartData(pts);
        } else {
          setChartData(genSyntheticSeries(active.symbol + range, 40));
        }
      })
      .catch(() => {
        if (!cancelled) setChartData(genSyntheticSeries(active.symbol + range, 40));
      })
      .finally(() => { if (!cancelled) setChartLoading(false); });

    return () => { cancelled = true; };
  }, [active?.symbol, range]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="v5-root min-h-screen flex relative" style={{ background: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono    { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body    { font-family: 'Inter', sans-serif; }
        .v5-card    { background: ${CARD}; border: 1px solid ${BORDER}; transition: border-color 0.2s ease; }
        .v5-hold-btn { transition: border-color 0.15s ease, background 0.15s ease; }
        .v5-watch-row { transition: background 0.15s ease; }
        .v5-watch-row:hover { background: rgba(255,255,255,0.035); }
        .v5-add-btn { transition: border-color 0.15s ease, color 0.15s ease; }
        .v5-add-btn:hover { color: ${TEXT}; border-color: rgba(255,255,255,0.24); }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .chart-shimmer {
          background: linear-gradient(90deg, ${BORDER} 25%, ${CARD2} 50%, ${BORDER} 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
      `}</style>

      <AmbientBackground opacity={0.1} />
      <Sidebar />

      <div className="flex-1 min-w-0 relative">
        <div className="max-w-5xl mx-auto px-5 py-8 pb-24">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <p className="v5-mono text-xs tracking-wide uppercase" style={{ color: MUTE }}>My Portfolio</p>
                <LiveIndicator isLive={isLive} />
              </div>
              <h1 className="v5-display text-3xl font-bold" style={{ color: TEXT }}>
                ₹{fmtINR(totalValue)}
              </h1>
              {lastUpdated && (
                <p className="v5-mono text-[10px] mt-0.5" style={{ color: MUTE }}>
                  Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="v5-mono text-xs uppercase mb-1" style={{ color: MUTE }}>Total P&amp;L</p>
              <p className="v5-mono text-xl font-medium" style={{ color: totalUp ? TEAL : RED }}>
                {totalUp ? '+' : ''}₹{fmtINR(Math.abs(totalPnl))}
              </p>
              <p className="v5-mono text-xs mt-0.5" style={{ color: totalUp ? TEAL : RED }}>
                ({totalUp ? '+' : ''}{totalPct.toFixed(2)}%)
              </p>
            </div>
          </div>

          {/* ── Holding Cards Strip ────────────────────────────────────────── */}
          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 mb-8 -mx-1 px-1 scrollbar-none">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : enriched.length === 0 ? (
            <EmptyPortfolio onGoToMarket={() => navigate('/market')} />
          ) : (
            <>
              <div className="flex gap-3 overflow-x-auto pb-2 mb-8 -mx-1 px-1 scrollbar-none">
                <AnimatePresence>
                  {enriched.map((h, idx) => {
                    const isActive = idx === selected;
                    return (
                      <motion.button
                        key={h.symbol}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 22, delay: idx * 0.05 }}
                        onClick={() => setSelected(idx)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="v5-hold-btn v5-card shrink-0 w-[190px] text-left rounded-xl px-4 py-3"
                        style={{ borderColor: isActive ? `${TEAL}80` : BORDER }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="v5-mono text-sm font-medium" style={{ color: TEXT }}>{h.symbol}</p>
                            <p className="v5-body text-[11px]" style={{ color: MUTE }}>{h.qty} qty</p>
                          </div>
                          <Sparkline data={h.series} up={h.up} width={56} height={24} />
                        </div>
                        <div className="flex items-baseline justify-between mt-3">
                          <span className="v5-mono text-sm" style={{ color: TEXT }}>₹{fmtINR(h.ltp)}</span>
                          <span className="v5-mono text-xs" style={{ color: h.up ? TEAL : RED }}>
                            {h.up ? '+' : ''}{h.pnlPct.toFixed(2)}%
                          </span>
                        </div>
                        {/* Live tag on holding card */}
                        {h._live && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: TEAL, boxShadow: `0 0 4px ${TEAL}` }} />
                            <span className="v5-mono text-[9px] uppercase" style={{ color: TEAL }}>live</span>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* ── Main: Chart + Watchlist ─────────────────────────────────── */}
              {active && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
                  {/* Chart Panel */}
                  <div className="v5-card rounded-xl p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="v5-mono text-xs uppercase tracking-wide" style={{ color: MUTE }}>{active.name}</p>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={active.symbol}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18 }}
                            className="flex items-baseline gap-3 mt-1"
                          >
                            <h2 className="v5-mono text-2xl" style={{ color: TEXT }}>₹{fmtINR(active.ltp)}</h2>
                            <span className="v5-mono text-sm" style={{ color: active.up ? TEAL : RED }}>
                              {active.up ? '+' : ''}{active.pnlPct.toFixed(2)}%
                            </span>
                            {active.change_pct != null && (
                              <span className="v5-body text-xs px-2 py-0.5 rounded-md" style={{
                                background: (active.change_pct >= 0 ? TEAL : RED) + '18',
                                color: active.change_pct >= 0 ? TEAL : RED,
                              }}>
                                Day: {active.change_pct >= 0 ? '+' : ''}{Number(active.change_pct).toFixed(2)}%
                              </span>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Range selector */}
                      <div className="relative flex gap-1 rounded-lg p-1" style={{ background: INK, border: `1px solid ${BORDER}` }}>
                        {RANGES.map((r) => (
                          <button
                            key={r}
                            onClick={() => setRange(r)}
                            className="v5-mono relative px-2.5 py-1 text-[11px] rounded-md"
                            style={{ color: range === r ? TEXT : MUTE }}
                          >
                            {range === r && (
                              <motion.div
                                layoutId="range-active-pill"
                                className="absolute inset-0 rounded-md"
                                style={{ background: '#1A2333' }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                              />
                            )}
                            <span className="relative">{r}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chart area */}
                    <div className="h-64 relative">
                      {chartLoading && (
                        <div className="absolute inset-0 rounded-lg chart-shimmer" style={{ zIndex: 2 }} />
                      )}
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                          <defs>
                            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={active.up ? TEAL : RED} stopOpacity={0.22} />
                              <stop offset="100%" stopColor={active.up ? TEAL : RED} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke={BORDER} vertical={false} />
                          <XAxis dataKey="i" hide />
                          <YAxis
                            domain={['dataMin - 4', 'dataMax + 4']}
                            tick={{ fill: MUTE, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                          />
                          <Tooltip content={<CustomChartTooltip symbol={active.symbol} />} />
                          <Area
                            type="monotone"
                            dataKey="v"
                            stroke={active.up ? TEAL : RED}
                            strokeWidth={2}
                            fill="url(#chartFill)"
                            dot={false}
                            isAnimationActive={!chartLoading}
                            animationDuration={500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-3 mt-5 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                      <div>
                        <p className="v5-mono text-[10px] uppercase" style={{ color: MUTE }}>Avg. Price</p>
                        <p className="v5-mono text-sm mt-0.5" style={{ color: TEXT }}>₹{fmtINR(active.avg)}</p>
                      </div>
                      <div>
                        <p className="v5-mono text-[10px] uppercase" style={{ color: MUTE }}>Quantity</p>
                        <p className="v5-mono text-sm mt-0.5" style={{ color: TEXT }}>{active.qty}</p>
                      </div>
                      <div>
                        <p className="v5-mono text-[10px] uppercase" style={{ color: MUTE }}>Market Val.</p>
                        <p className="v5-mono text-sm mt-0.5" style={{ color: TEXT }}>₹{fmtINR(active.value)}</p>
                      </div>
                      <div>
                        <p className="v5-mono text-[10px] uppercase" style={{ color: MUTE }}>Unrealised P&amp;L</p>
                        <p className="v5-mono text-sm mt-0.5" style={{ color: active.up ? TEAL : RED }}>
                          {active.up ? '+' : ''}₹{fmtINR(Math.abs(active.pnl))}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Watchlist Panel */}
                  <div className="v5-card rounded-xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <p className="v5-mono text-xs uppercase tracking-wide" style={{ color: MUTE }}>Watchlist</p>
                      <button
                        onClick={() => navigate('/watchlist')}
                        className="v5-add-btn v5-mono text-[10px] px-2.5 py-1 rounded-lg"
                        style={{ color: MUTE, border: `1px solid ${BORDER}` }}
                      >
                        Manage →
                      </button>
                    </div>

                    {watchlist.length === 0 ? (
                      <div className="flex flex-col items-center justify-center flex-1 py-6 text-center">
                        <p className="v5-body text-xs" style={{ color: MUTE }}>
                          Your watchlist is empty.
                        </p>
                        <button
                          onClick={() => navigate('/watchlist')}
                          className="v5-mono text-[11px] mt-3 underline"
                          style={{ color: TEAL }}
                        >
                          Add stocks →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-0.5 overflow-y-auto scrollbar-none">
                        {watchlist.map((w) => {
                          const up = (w.chg ?? 0) >= 0;
                          return (
                            <motion.div
                              key={w.symbol}
                              whileHover={{ x: 2 }}
                              onClick={() => navigate(`/market?symbol=${w.symbol}`)}
                              className="v5-watch-row flex items-center justify-between px-2 py-2.5 rounded-lg cursor-pointer"
                            >
                              <div>
                                <p className="v5-mono text-sm" style={{ color: TEXT }}>{w.symbol}</p>
                                <p className="v5-body text-[11px]" style={{ color: MUTE }}>{w.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="v5-mono text-sm" style={{ color: TEXT }}>₹{fmtINR(w.ltp)}</p>
                                <p className="v5-mono text-[11px]" style={{ color: up ? TEAL : RED }}>
                                  {up ? '+' : ''}{Number(w.chg).toFixed(2)}%
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}