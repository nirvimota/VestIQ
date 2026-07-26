import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';

// ---------------------------------------------------------------------------
// vestIQ — Portfolio v2
// Fixes a layout bug from the previous pass: the root wrapper used
// `grid grid-rows-2`, which stacked the sidebar and content into separate
// rows instead of placing them side by side — the sidebar ended up squashed
// into the top half of the screen. Now a plain flex row like every other
// page. Also swapped the duplicated inline sidebar for the shared one (which
// fixes the same undeclared-`location` bug described there), added the
// shared ambient background, and layered in motion: the price chart redraws
// with a smooth path animation on stock/range switch, holding cards lift on
// hover, and the range tabs get a sliding active pill.
// ---------------------------------------------------------------------------

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
  const color = up ? '#34d399' : '#fb7185';
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

  const enriched = useMemo(
    () =>
      HOLDINGS.map((h) => ({
        ...h,
        series: genSeries(h.symbol),
        pnl: (h.ltp - h.avg) * h.qty,
        pnlPct: ((h.ltp - h.avg) / h.avg) * 100,
        value: h.ltp * h.qty,
      })),
    []
  );

  const totalValue = enriched.reduce((a, h) => a + h.value, 0);
  const totalPnl = enriched.reduce((a, h) => a + h.pnl, 0);
  const totalUp = totalPnl >= 0;

  const active = enriched[selected];
  const chartData = useMemo(() => genSeries(active.symbol + range, 30), [active.symbol, range]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex relative">
      <AmbientBackground opacity={0.1} />
      <Sidebar />

      <div className="flex-1 min-w-0 relative">
        <div className="max-w-5xl mx-auto px-5 py-8 pb-24">
          {/* Header */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-zinc-500 text-xs font-mono tracking-wide uppercase mb-1">My Portfolio</p>
              <h1 className="text-2xl font-semibold tracking-tight">₹{fmtINR(totalValue)}</h1>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs font-mono uppercase mb-1">Total P&amp;L</p>
              <p className={`font-mono text-lg ${totalUp ? 'text-emerald-400' : 'text-rose-400'}`}>
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
                  className={`shrink-0 w-[190px] text-left rounded-xl border px-4 py-3 transition-colors
                    ${isActive ? 'bg-zinc-900 border-emerald-400/50' : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm font-medium">{h.symbol}</p>
                      <p className="text-zinc-500 text-[11px]">{h.qty} qty</p>
                    </div>
                    <Sparkline data={h.series} up={h.up} width={56} height={24} />
                  </div>
                  <div className="flex items-baseline justify-between mt-3">
                    <span className="font-mono text-sm">₹{fmtINR(h.ltp)}</span>
                    <span className={`font-mono text-xs ${h.up ? 'text-emerald-400' : 'text-rose-400'}`}>
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
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-mono text-xs text-zinc-500 uppercase tracking-wide">{active.name}</p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active.symbol}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-baseline gap-2 mt-1"
                    >
                      <h2 className="font-mono text-2xl">₹{fmtINR(active.ltp)}</h2>
                      <span className={`font-mono text-sm ${active.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {active.up ? '+' : ''}
                        {active.pnlPct.toFixed(2)}%
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="relative flex gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                  {RANGES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRange(r)}
                      className="relative px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors"
                      style={{ color: range === r ? '#f4f4f5' : '#71717a' }}
                    >
                      {range === r && (
                        <motion.div
                          layoutId="range-active-pill"
                          className="absolute inset-0 bg-zinc-800 rounded-md"
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
                        <stop offset="0%" stopColor={active.up ? '#34d399' : '#fb7185'} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={active.up ? '#34d399' : '#fb7185'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#27272a" vertical={false} />
                    <XAxis dataKey="i" hide />
                    <YAxis
                      domain={['dataMin - 4', 'dataMax + 4']}
                      tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: 8,
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                      labelFormatter={() => active.symbol}
                      formatter={(v) => [`₹${v.toFixed(2)}`, 'Price']}
                    />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={active.up ? '#34d399' : '#fb7185'}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive
                      animationDuration={500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-zinc-800">
                <div>
                  <p className="text-zinc-500 text-[11px] font-mono uppercase">Avg. price</p>
                  <p className="font-mono text-sm mt-0.5">₹{fmtINR(active.avg)}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[11px] font-mono uppercase">Quantity</p>
                  <p className="font-mono text-sm mt-0.5">{active.qty}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[11px] font-mono uppercase">Unrealised P&amp;L</p>
                  <p className={`font-mono text-sm mt-0.5 ${active.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {active.up ? '+' : ''}₹{fmtINR(Math.abs(active.pnl))}
                  </p>
                </div>
              </div>
            </div>

            {/* Watchlist */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-xs text-zinc-500 uppercase tracking-wide">Watchlist</p>
                <button className="text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 text-sm leading-none w-6 h-6 rounded-md border border-zinc-800 flex items-center justify-center transition-colors">
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
                      className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="font-mono text-sm">{w.symbol}</p>
                        <p className="text-zinc-500 text-[11px]">{w.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">₹{fmtINR(w.ltp)}</p>
                        <p className={`font-mono text-[11px] ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
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