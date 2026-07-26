import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';

// ---------------------------------------------------------------------------
// vestIQ — Watchlist v2
// Same layout language as Portfolio.jsx: Sidebar + AmbientBackground, zinc
// surfaces, emerald/rose for up/down, framer-motion for the list and the
// sliding filter pill. Search filters by symbol/name; All/Gainers/Losers
// tabs filter the list; remove button appears on row hover.
//
// Self-contained on purpose — Sparkline / fmtINR / fmtPct / genSeries are
// defined right here instead of pulled from shared components/utils files,
// so this page has no extra files it depends on.
// ---------------------------------------------------------------------------

const RAW_WATCHLIST = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 2945.6, chg: 1.24 },
  { symbol: 'TCS', name: 'Tata Consultancy', ltp: 3812.4, chg: -0.42 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', ltp: 1675.2, chg: 0.81 },
  { symbol: 'INFY', name: 'Infosys', ltp: 1462.1, chg: -0.36 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', ltp: 1188.35, chg: -1.24 },
  { symbol: 'SBIN', name: 'State Bank of India', ltp: 824.6, chg: 2.11 },
  { symbol: 'ITC', name: 'ITC Ltd', ltp: 462.9, chg: -0.62 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', ltp: 7210.5, chg: 0.86 },
  { symbol: 'WIPRO', name: 'Wipro', ltp: 289.15, chg: -3.05 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', ltp: 12840.2, chg: 1.62 },
];

const TABS = ['All', 'Gainers', 'Losers'];

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
  const gradId = `grad-${up ? 'up' : 'down'}-${Math.round(min)}-${Math.round(max)}`;
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

function fmtPct(n) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

export default function Watchlist() {
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');

  const enriched = useMemo(
    () => RAW_WATCHLIST.map((w) => ({ ...w, up: w.chg >= 0, series: genSeries(w.symbol) })),
    []
  );

  const filtered = useMemo(() => {
    return enriched
      .filter((w) => (tab === 'Gainers' ? w.up : tab === 'Losers' ? !w.up : true))
      .filter((w) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return w.symbol.toLowerCase().includes(q) || w.name.toLowerCase().includes(q);
      });
  }, [enriched, tab, query]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex relative">
      <AmbientBackground opacity={0.1} />
      <Sidebar />

      <div className="flex-1 min-w-0 relative">
        <div className="max-w-5xl mx-auto px-5 py-8 pb-24">
          {/* Header */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-zinc-500 text-xs font-mono tracking-wide uppercase mb-1">Watchlist</p>
              <h1 className="text-2xl font-semibold tracking-tight">{filtered.length} stocks</h1>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3 py-2 transition-colors">
              <Plus size={14} /> Add stock
            </button>
          </div>

          {/* Search + tabs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search symbol or company..."
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm font-mono outline-none focus:border-zinc-600 placeholder:text-zinc-600"
              />
            </div>
            <div className="relative flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-lg p-1 self-start">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="relative px-3 py-1.5 text-xs font-mono rounded-md transition-colors"
                  style={{ color: tab === t ? '#f4f4f5' : '#71717a' }}
                >
                  {tab === t && (
                    <motion.div
                      layoutId="watchlist-tab-pill"
                      className="absolute inset-0 bg-zinc-800 rounded-md"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl divide-y divide-zinc-800 overflow-hidden">
            <AnimatePresence initial={false}>
              {filtered.map((w) => (
                <motion.div
                  key={w.symbol}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="group relative"
                >
                  <Link
                    to={`/stock/${w.symbol}`}
                    className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm">{w.symbol}</p>
                      <p className="text-zinc-500 text-[11px] truncate">{w.name}</p>
                    </div>

                    <Sparkline data={w.series} up={w.up} width={72} height={28} />

                    <div className="text-right shrink-0 w-24">
                      <p className="font-mono text-sm">₹{fmtINR(w.ltp)}</p>
                      <p className={`font-mono text-[11px] ${w.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fmtPct(w.chg)}
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={(e) => e.preventDefault()}
                    className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-rose-400 bg-zinc-950/80 rounded-md p-1"
                    aria-label={`Remove ${w.symbol} from watchlist`}
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center text-zinc-500 text-sm font-mono">
                No stocks match "{query}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}