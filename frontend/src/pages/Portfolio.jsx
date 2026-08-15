import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';
import { getHoldings } from '../services/portfolioApi';

// ---------------------------------------------------------------------------
// vestIQ — Portfolio v3
// Same structure/layout as v2, recoloured onto the shared v5.1 token system
// (INK/CARD/BORDER/TEXT/SUB/MUTE/TEAL/RED + v5-display/v5-mono/v5-body) so it
// matches Dashboard, OrderHistory, and Intraday instead of the old zinc/
// emerald/rose Tailwind palette.
// ---------------------------------------------------------------------------

const INK = '#0A0F1A';
const CARD = '#111826';
const BORDER = '#1E2838';
const TEXT = '#ECEEF0';
const SUB = '#8A93A6';
const MUTE = '#4E5A70';
const TEAL = '#2ED9B8';
const RED = '#EF5A5A';

const HOLDINGS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', qty: 10, avg: 2780.0, ltp: 2945.6, up: true },
  { symbol: 'TCS', name: 'Tata Consultancy', qty: 5, avg: 3900.0, ltp: 3812.4, up: false },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', qty: 20, avg: 1600.0, ltp: 1675.2, up: true },
  { symbol: 'INFY', name: 'Infosys', qty: 12, avg: 1490.0, ltp: 1462.1, up: false },
];

const WATCHLIST = [
  { symbol: 'ICICIBANK', name: 'ICICI Bank', ltp: 1188.35, chg: -1.24 },
  { symbol: 'SBIN', name: 'State Bank of India', ltp: 824.6, chg: 2.11 },
  { symbol: 'ITC', name: 'ITC Ltd', ltp: 462.9, chg: -0.62 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', ltp: 7210.5, chg: 0.86 },
  { symbol: 'WIPRO', name: 'Wipro', ltp: 289.15, chg: -3.05 },
];

const RANGES = ['1D', '1W', '1M', '3M', '1Y'];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function genSeries(symbol, points = 24) {
  const rand = seededRandom(symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  let v = 100 + rand() * 20;
  const out = [];
  for (let i = 0; i < points; i++) {
    v += (rand() - 0.48) * 6;
    out.push({ i, v: Math.max(20, v) });
  }
  return out;
}

function Sparkline({ data, up, width = 84, height = 32 }) {
  const vals = data.map((d) => d.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d.v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M${points.join(' L')}`;
  const color = up ? TEAL : RED;
  const areaPath = `${path} L${width},${height} L0,${height} Z`;
  const gradId = `grad-${up ? 'up' : 'down'}-${Math.round(min)}`;
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

function fmtINR(n) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Portfolio() {
  const [selected, setSelected] = useState(0);
  const [range, setRange] = useState('1W');
  const [realHoldings, setRealHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchHoldings() {
      try {
        const token = localStorage.getItem('vestiq_token') || localStorage.getItem('token');
        if (!token) {
          setRealHoldings(HOLDINGS);
          setLoading(false);
          return;
        }

        const data = await getHoldings(token);
        if (isMounted) {
          if (data && data.length > 0) {
            setRealHoldings(data);
          } else {
            setRealHoldings([]);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch real holdings:', err);
        if (isMounted) {
          setRealHoldings(HOLDINGS);
          setLoading(false);
        }
      }
    }

    fetchHoldings();
    const interval = setInterval(fetchHoldings, 10000); // 10s live refresh
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const displayHoldings = realHoldings.length > 0 ? realHoldings : (loading ? [] : HOLDINGS);

  const enriched = useMemo(
    () =>
      displayHoldings.map((h) => {
        const avg = h.avg || h.average_price || 1000;
        const ltp = h.ltp || h.current_price || avg;
        const qty = h.qty || h.quantity || 1;
        const up = ltp >= avg;
        const pnl = (ltp - avg) * qty;
        const pnlPct = avg ? ((ltp - avg) / avg) * 100 : 0;
        return {
          ...h,
          symbol: h.symbol,
          name: h.name || h.symbol,
          qty,
          avg,
          ltp,
          up,
          series: genSeries(h.symbol),
          pnl,
          pnlPct,
          value: ltp * qty,
        };
      }),
    [displayHoldings]
  );

  const totalValue = enriched.reduce((a, h) => a + h.value, 0);
  const totalPnl = enriched.reduce((a, h) => a + h.pnl, 0);
  const totalUp = totalPnl >= 0;

  const active = enriched[selected] || enriched[0] || {
    symbol: 'N/A',
    name: 'No Holdings',
    qty: 0,
    avg: 0,
    ltp: 0,
    up: true,
    pnl: 0,
    pnlPct: 0,
  };
  const chartData = useMemo(() => genSeries((active.symbol || 'N/A') + range, 30), [active.symbol, range]);

  return (
    <div className="v5-root min-h-screen flex relative" style={{ background: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body { font-family: 'Inter', sans-serif; }
        .v5-card { background: ${CARD}; border: 1px solid ${BORDER}; transition: border-color 0.2s ease; }
        .v5-hold-btn { transition: border-color 0.15s ease, background 0.15s ease; }
        .v5-watch-row { transition: background 0.15s ease; }
        .v5-watch-row:hover { background: rgba(255,255,255,0.03); }
        .v5-add-btn { transition: border-color 0.15s ease, color 0.15s ease; }
        .v5-add-btn:hover { color: ${TEXT}; border-color: rgba(255,255,255,0.24); }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>

      <AmbientBackground opacity={0.1} />
      <Sidebar />

      <div className="flex-1 min-w-0 relative">
        <div className="max-w-5xl mx-auto px-5 py-8 pb-24">
          {/* Header */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="v5-mono text-xs tracking-wide uppercase mb-1" style={{ color: MUTE }}>My Portfolio</p>
              <h1 className="v5-display text-2xl" style={{ color: TEXT }}>₹{fmtINR(totalValue)}</h1>
            </div>
            <div className="text-right">
              <p className="v5-mono text-xs uppercase mb-1" style={{ color: MUTE }}>Total P&amp;L</p>
              <p className="v5-mono text-lg" style={{ color: totalUp ? TEAL : RED }}>
                {totalUp ? '+' : ''}₹{fmtINR(Math.abs(totalPnl))}
              </p>
            </div>
          </div>

          {/* Holding cards — horizontal strip */}
          <div className="flex gap-3 overflow-x-auto pb-2 mb-8 -mx-1 px-1 scrollbar-none">
            {enriched.map((h, idx) => {
              const isActive = idx === selected;
              return (
                <motion.button
                  key={h.symbol}
                  onClick={() => setSelected(idx)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
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
                      {h.up ? '+' : ''}
                      {h.pnlPct.toFixed(2)}%
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Main area: chart + watchlist */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            {/* Chart panel */}
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
                      className="flex items-baseline gap-2 mt-1"
                    >
                      <h2 className="v5-mono text-2xl" style={{ color: TEXT }}>₹{fmtINR(active.ltp)}</h2>
                      <span className="v5-mono text-sm" style={{ color: active.up ? TEAL : RED }}>
                        {active.up ? '+' : ''}
                        {active.pnlPct.toFixed(2)}%
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>
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

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={active.up ? TEAL : RED} stopOpacity={0.25} />
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
                    <Tooltip
                      contentStyle={{
                        background: CARD,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 8,
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: TEXT }}
                      itemStyle={{ color: TEXT }}
                      labelFormatter={() => active.symbol}
                      formatter={(v) => [`₹${v.toFixed(2)}`, 'Price']}
                    />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={active.up ? TEAL : RED}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive
                      animationDuration={500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                <div>
                  <p className="v5-mono text-[11px] uppercase" style={{ color: MUTE }}>Avg. price</p>
                  <p className="v5-mono text-sm mt-0.5" style={{ color: TEXT }}>₹{fmtINR(active.avg)}</p>
                </div>
                <div>
                  <p className="v5-mono text-[11px] uppercase" style={{ color: MUTE }}>Quantity</p>
                  <p className="v5-mono text-sm mt-0.5" style={{ color: TEXT }}>{active.qty}</p>
                </div>
                <div>
                  <p className="v5-mono text-[11px] uppercase" style={{ color: MUTE }}>Unrealised P&amp;L</p>
                  <p className="v5-mono text-sm mt-0.5" style={{ color: active.up ? TEAL : RED }}>
                    {active.up ? '+' : ''}₹{fmtINR(Math.abs(active.pnl))}
                  </p>
                </div>
              </div>
            </div>

            {/* Watchlist */}
            <div className="v5-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="v5-mono text-xs uppercase tracking-wide" style={{ color: MUTE }}>Watchlist</p>
                <button
                  className="v5-add-btn text-sm leading-none w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ color: MUTE, border: `1px solid ${BORDER}` }}
                >
                  +
                </button>
              </div>
              <div className="space-y-1">
                {WATCHLIST.map((w) => {
                  const up = w.chg >= 0;
                  return (
                    <motion.div
                      key={w.symbol}
                      whileHover={{ x: 2 }}
                      className="v5-watch-row flex items-center justify-between px-2 py-2.5 rounded-lg cursor-pointer"
                    >
                      <div>
                        <p className="v5-mono text-sm" style={{ color: TEXT }}>{w.symbol}</p>
                        <p className="v5-body text-[11px]" style={{ color: MUTE }}>{w.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="v5-mono text-sm" style={{ color: TEXT }}>₹{fmtINR(w.ltp)}</p>
                        <p className="v5-mono text-[11px]" style={{ color: up ? TEAL : RED }}>
                          {up ? '+' : ''}
                          {w.chg.toFixed(2)}%
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}