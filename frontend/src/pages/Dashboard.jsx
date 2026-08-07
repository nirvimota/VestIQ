import React, { useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Bell,
  ChevronDown,
  Expand,
  Wallet,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';

// ---------------------------------------------------------------------------
// vestIQ — Dashboard v5.3
// Same as v5.2. Suggestion cards and the watchlist pick card now navigate to
// /stock/:symbol, passing `backgroundLocation` in route state so StockDetail
// can render itself as a popup on desktop and a full page on mobile.
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

const cardHover = { y: -3, borderColor: 'rgba(255,255,255,0.16)' };
const cardTransition = { type: 'spring', stiffness: 300, damping: 24 };

const SUGGESTIONS = [
  {
    symbol: 'BAJFINANCE',
    reason: 'Strong earnings momentum, low volatility',
    score: 88,
    price: 7210.5,
    changePct: 1.8,
    color: TEAL,
    spark: [40, 44, 42, 48, 52, 55, 60, 64],
  },
  {
    symbol: 'TATAMOTORS',
    reason: 'Breakout above 50-day average',
    score: 76,
    price: 968.2,
    changePct: 2.4,
    color: BLUE,
    spark: [30, 28, 34, 33, 38, 42, 40, 46],
  },
  {
    symbol: 'ITC',
    reason: 'Undervalued vs. sector peers',
    score: 64,
    price: 462.9,
    changePct: -0.6,
    color: PURPLE,
    spark: [50, 49, 47, 48, 46, 44, 45, 43],
  },
];

function SuggestionCard({ s, onOpen }) {
  const spark = useMemo(() => linePath(s.spark, 140, 40), [s.spark]);
  const up = s.changePct >= 0;
  return (
    <motion.div
      whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.16)' }}
      transition={cardTransition}
      onClick={() => onOpen(s.symbol)}
      className="rounded-xl px-4 py-3.5 flex-1 min-w-[220px] cursor-pointer"
      style={{ background: '#0E1420', border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center v5-mono text-[9px] font-bold"
            style={{ background: `${s.color}1A`, color: s.color }}
          >
            {s.symbol.slice(0, 3)}
          </div>
          <span className="v5-body text-sm" style={{ color: TEXT }}>{s.symbol}</span>
        </div>
        <span
          className="v5-mono text-[11px] px-2 py-0.5 rounded-full"
          style={{ color: s.color, background: `${s.color}1A` }}
        >
          {s.score}
        </span>
      </div>

      <p className="v5-body text-[11px] mt-2 leading-snug" style={{ color: MUTE }}>
        {s.reason}
      </p>

      <div className="mt-2 h-[32px]">
        <svg viewBox="0 0 140 40" className="w-full h-full" preserveAspectRatio="none">
          <path d={spark} fill="none" stroke={s.color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="v5-mono text-sm" style={{ color: TEXT }}>₹{s.price.toFixed(2)}</span>
          <span className="v5-mono text-[11px] ml-2" style={{ color: up ? TEAL : RED }}>
            {up ? '+' : ''}{s.changePct.toFixed(2)}%
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen(s.symbol);
          }}
          className="v5-body text-[11px] px-2.5 py-1 rounded-full"
          style={{ background: '#1A2333', color: SUB }}
        >
          View
        </button>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const openStock = (symbol) => {
    navigate(`/stock/${symbol}`, { state: { backgroundLocation: location } });
  };

  const portfolioSpark = useMemo(() => linePath([58, 62, 60, 66, 70, 68, 74, 78, 76, 83], 200, 60), []);
  const activitySpark = useMemo(() => linePath([12, 18, 14, 22, 30, 26, 35], 240, 70), []);

  const ALLOCATION = [
    { label: 'Equity', pct: 62, color: TEAL },
    { label: 'Debt', pct: 24, color: BLUE },
    { label: 'Cash', pct: 14, color: MUTE },
  ];

  const TOP_MOVERS = [
    { label: 'RELIANCE', pct: 78, color: TEAL },
    { label: 'HDFCBANK', pct: 58, color: BLUE },
    { label: 'INFY', pct: 40, color: PURPLE },
  ];

  return (
    <div className="v5-root min-h-screen flex relative" style={{ background: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body { font-family: 'Inter', sans-serif; }
        .v5-card { background: ${CARD}; border: 1px solid ${BORDER}; transition: border-color 0.2s ease; }
        .v5-icon-btn { transition: transform 0.15s ease, background 0.15s ease; }
        .v5-icon-btn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.03); }
        .v5-icon-btn:active { transform: translateY(0) scale(0.94); }
      `}</style>

      <AmbientBackground opacity={0.13} />
      <Sidebar />

      <main className="flex-1 min-w-0 relative">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-7">
          {/* top bar */}
          <div className="flex items-center justify-between">
            <h1 className="v5-display text-xl" style={{ color: TEXT }}>Dashboard</h1>
            <div className="flex items-center gap-3">
              <button className="v5-card v5-icon-btn w-9 h-9 rounded-full flex items-center justify-center" style={{ color: SUB }}>
                <Search size={15} />
              </button>
              <button className="v5-card v5-icon-btn w-9 h-9 rounded-full flex items-center justify-center" style={{ color: SUB }}>
                <Bell size={15} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center v5-mono text-[11px] font-bold" style={{ background: TEAL, color: INK }}>
                  AM
                </div>
                <div className="hidden sm:block">
                  <p className="v5-body text-xs" style={{ color: TEXT }}>Alex Morgan</p>
                  <p className="v5-body text-[10px]" style={{ color: MUTE }}>Investor</p>
                </div>
              </div>
            </div>
          </div>

          {/* bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Portfolio value */}
            <motion.div whileHover={cardHover} transition={cardTransition} className="v5-card rounded-2xl px-5 py-5">
              <div className="flex items-center justify-between">
                <p className="v5-body text-sm" style={{ color: SUB }}>Portfolio value</p>
                <Expand size={13} style={{ color: MUTE }} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="v5-display text-3xl" style={{ color: TEXT }}>₹83,007</span>
                <span className="v5-mono text-[11px] px-2 py-0.5 rounded-full" style={{ color: RED, background: `${RED}1A` }}>
                  -0.35%
                </span>
              </div>
              <div className="mt-3 h-[50px]">
                <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
                  <path d={portfolioSpark} fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <Link
                to="/portfolio"
                className="v5-body text-xs mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full hover:gap-1.5 transition-all"
                style={{ background: '#1A2333', color: SUB }}
              >
                View chart <ArrowUpRight size={12} />
              </Link>
            </motion.div>

            {/* Market activity */}
            <motion.div whileHover={cardHover} transition={cardTransition} className="v5-card rounded-2xl px-5 py-5">
              <div className="flex items-center justify-between">
                <p className="v5-body text-sm" style={{ color: SUB }}>NIFTY 50 today</p>
                <span className="v5-body text-[11px] flex items-center gap-1" style={{ color: MUTE }}>
                  View <ChevronDown size={12} />
                </span>
              </div>
              <p className="v5-display text-lg mt-1" style={{ color: TEXT }}>24,812.35</p>
              <div className="mt-2 h-[70px]">
                <svg viewBox="0 0 240 70" className="w-full h-full" preserveAspectRatio="none">
                  <path d={activitySpark} fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex justify-between mt-1">
                {['9:15', '11', '1', '3', '3:30'].map((t) => (
                  <span key={t} className="v5-mono text-[10px]" style={{ color: MUTE }}>{t}</span>
                ))}
              </div>
            </motion.div>

            {/* Allocation bar */}
            <motion.div whileHover={cardHover} transition={cardTransition} className="v5-card rounded-2xl px-5 py-5">
              <div className="flex items-center justify-between">
                <p className="v5-body text-sm" style={{ color: SUB }}>Allocation</p>
                <span className="v5-body text-[11px]" style={{ color: MUTE }}>View</span>
              </div>
              <div className="flex items-center gap-2 mt-4">
                {ALLOCATION.map((a) => (
                  <span key={a.label} className="v5-mono text-xs" style={{ color: a.color }}>
                    {a.pct}%
                  </span>
                ))}
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden flex mt-2" style={{ background: BORDER }}>
                {ALLOCATION.map((a) => (
                  <motion.div
                    key={a.label}
                    initial={{ width: 0 }}
                    animate={{ width: `${a.pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ background: a.color }}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-1.5 mt-4">
                {ALLOCATION.map((a) => (
                  <div key={a.label} className="flex items-center justify-between">
                    <span className="v5-body text-xs flex items-center gap-2" style={{ color: SUB }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                      {a.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Stock Suggestions */}
            <motion.div
              whileHover={cardHover}
              transition={cardTransition}
              className="v5-card rounded-2xl px-5 py-5 md:col-span-3"
            >
              <div className="flex items-center justify-between">
                <p className="v5-body text-sm flex items-center gap-1.5" style={{ color: SUB }}>
                  <Sparkles size={13} style={{ color: TEAL }} />
                  AI Stock suggestions
                </p>
                <span className="v5-body text-[11px] flex items-center gap-1" style={{ color: MUTE }}>
                  Refreshed today <ChevronDown size={12} />
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                {SUGGESTIONS.map((s) => (
                  <SuggestionCard key={s.symbol} s={s} onOpen={openStock} />
                ))}
              </div>
            </motion.div>

            {/* Weekly progress duo */}
            <motion.div whileHover={cardHover} transition={cardTransition} className="v5-card rounded-2xl px-5 py-5 md:col-span-1">
              <p className="v5-body text-sm" style={{ color: SUB }}>This week</p>
              <p className="v5-body text-[11px] mt-1" style={{ color: MUTE }}>4/6 orders filled</p>
              <div className="w-full h-2 rounded-full mt-2 overflow-hidden" style={{ background: BORDER }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '66%' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: TEAL }}
                />
              </div>
              <div className="flex items-center gap-6 mt-5">
                <div>
                  <p className="v5-display text-2xl" style={{ color: TEAL }}>70%</p>
                  <p className="v5-body text-[11px] mt-0.5" style={{ color: MUTE }}>Orders filled</p>
                </div>
                <div>
                  <p className="v5-display text-2xl" style={{ color: BLUE }}>32%</p>
                  <p className="v5-body text-[11px] mt-0.5" style={{ color: MUTE }}>Margin used</p>
                </div>
              </div>
              <div className="v5-body text-xs mt-4 px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: '#1A2333', color: SUB }}>
                <Wallet size={13} style={{ color: TEAL }} />
                You're well within your margin this week
              </div>
            </motion.div>

            {/* Top movers bars */}
            <motion.div whileHover={cardHover} transition={cardTransition} className="v5-card rounded-2xl px-5 py-5 md:col-span-1">
              <p className="v5-body text-sm" style={{ color: SUB }}>Top movers</p>
              <div className="flex flex-col gap-3 mt-4">
                {TOP_MOVERS.map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="v5-mono text-xs" style={{ color: TEXT }}>{m.label}</span>
                      <span className="v5-mono text-[11px]" style={{ color: m.color }}>+{m.pct - 60}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: m.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Watchlist pick card */}
            <motion.div
              whileHover={{ ...cardHover, scale: 1.01 }}
              transition={cardTransition}
              onClick={() => openStock('RELIANCE')}
              className="v5-card rounded-2xl px-5 py-5 flex flex-col items-center text-center cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center v5-mono text-sm font-bold" style={{ background: TEAL, color: INK }}>
                RIL
              </div>
              <p className="v5-body text-sm mt-3" style={{ color: TEXT }}>Reliance Industries</p>
              <p className="v5-body text-[11px]" style={{ color: MUTE }}>Highest conviction pick</p>
              <div className="flex items-center gap-4 mt-4 w-full justify-center">
                <div>
                  <p className="v5-mono text-sm" style={{ color: TEXT }}>₹2,945</p>
                  <p className="v5-body text-[10px]" style={{ color: MUTE }}>LTP</p>
                </div>
                <div>
                  <p className="v5-mono text-sm" style={{ color: TEAL }}>82</p>
                  <p className="v5-body text-[10px]" style={{ color: MUTE }}>Score</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}