import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import {
  Bell,
  Home,
  Settings,
  LineChart as LineChartIcon,
  ListChecks,
  ShieldCheck,
  Send
} from 'lucide-react';
/**
 * Design tokens — mirrors the existing ink/bone/surface/border/teal/coral/slate
 * system from the current codebase. If your tailwind.config.js already defines
 * these as custom colors, swap the zinc/emerald/rose utility classes below for
 * bg-ink / text-bone / bg-surface / border-border / text-teal / text-coral /
 * text-slate directly — the class names are chosen to map 1:1.
 *
 *   ink     -> zinc-950  (#09090b)
 *   surface -> zinc-900  (#18181b)
 *   border  -> zinc-800  (#27272a)
 *   bone    -> zinc-100  (#f4f4f5)
 *   slate   -> zinc-500  (#71717a)
 *   teal    -> emerald-400 (#34d399)
 *   coral   -> rose-400    (#fb7185)
 */
const NAV_ITEMS = [
  { label: 'Overview', icon: Home, to: '/dashboard' },
  { label: 'Portfolio', icon: LineChartIcon, to: '/portfolio' },
  { label: 'Watchlist', icon: ListChecks, to: '/watchlist' },
  { label: 'Orders', icon: Send, to: '/orders' },
  { label: 'Alerts', icon: Bell, to: '/alerts' },
  { label: 'KYC', icon: ShieldCheck, to: '/kyc' },
];

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

const HOLDINGS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', qty: 10, avg: 2780.0, ltp: 2945.6, up: true },
  { symbol: 'TCS', name: 'Tata Consultancy', qty: 5, avg: 3900.0, ltp: 3812.4, up: false },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', qty: 20, avg: 1600.0, ltp: 1675.2, up: true },
  { symbol: 'INFY', name: 'Infosys', qty: 12, avg: 1490.0, ltp: 1462.1, up: false },
];

const WATCHLIST = [
  { symbol: 'ICICIBANK', name: 'ICICI Bank', ltp: 1188.35, chg: -1.24 },
  { symbol: 'SBIN', name: 'State Bank of India', qty: null, ltp: 824.6, chg: 2.11 },
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
    <div className="h-full bg-zinc-950 text-zinc-100 font-sans grid grid-rows-2">

      <aside className="flex-col w-56 shrink-0 justify-center px-4 py-6" style={{ borderRight: `1px solid ${BORDER}` }}>
        <Link to="/dashboard" className="v5-display text-lg tracking-tight px-2 flex items-center gap-2" style={{ color: TEXT }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: TEAL, color: INK }}>
            V
          </span>
          vest<span style={{ color: '#e8b84b' }}>IQ</span>
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl v5-body text-sm transition-colors"
                style={{ color: active ? INK : SUB, background: active ? TEAL : 'transparent' }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl v5-body text-sm" style={{ color: SUB }}>
            <Settings size={16} />
            Settings
          </Link>
        </div>
      </aside>
      <div></div>
      <div className="max-w-5xl mx-auto px-5 py-8 pb-24">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-zinc-500 text-xs font-mono tracking-wide uppercase mb-1">My Portfolio</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              ₹{fmtINR(totalValue)}
            </h1>
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
              <button
                key={h.symbol}
                onClick={() => setSelected(idx)}
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
              </button>
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
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="font-mono text-2xl">₹{fmtINR(active.ltp)}</h2>
                  <span className={`font-mono text-sm ${active.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {active.up ? '+' : ''}
                    {active.pnlPct.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="flex gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors
                      ${range === r ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {r}
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
              <button className="text-zinc-500 hover:text-zinc-200 text-sm leading-none w-6 h-6 rounded-md border border-zinc-800 flex items-center justify-center">
                +
              </button>
            </div>
            <div className="space-y-1">
              {WATCHLIST.map((w) => {
                const up = w.chg >= 0;
                return (
                  <div
                    key={w.symbol}
                    className="flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}