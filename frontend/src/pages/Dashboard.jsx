import React, { useEffect, useMemo, useRef, useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import {
  Search, Bell, ArrowUpRight, ArrowDownRight, Plus, Send,
  TrendingUp, Wallet, ChevronRight, Home, LineChart, User,
} from "lucide-react";

// ---------- helpers ----------
const fmt = (n, d = 2) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const rand = (min, max) => Math.random() * (max - min) + min;

function genSeries(base, points = 24, vol = 0.01) {
  const arr = [base];
  for (let i = 1; i < points; i++) {
    const last = arr[i - 1];
    arr.push(Math.max(0.01, last * (1 + rand(-vol, vol))));
  }
  return arr.map((v, i) => ({ i, v }));
}

const SEED_WATCHLIST = [
  { symbol: "AAPL", name: "Apple Inc.", price: 231.42, base: 231.42, color: "#8B7CF6" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 268.9, base: 268.9, color: "#F97066" },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 142.15, base: 142.15, color: "#34D399" },
  { symbol: "AMZN", name: "Amazon.com", price: 198.77, base: 198.77, color: "#38BDF8" },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 452.31, base: 452.31, color: "#FBBF24" },
];

const SEED_INDICES = [
  { symbol: "S&P 500", price: 6482.13, base: 6482.13 },
  { symbol: "NASDAQ", price: 21344.88, base: 21344.88 },
  { symbol: "DOW", price: 41890.5, base: 41890.5 },
  { symbol: "RUSSELL", price: 2312.4, base: 2312.4 },
];

export default function TradingDashboard() {
  const [watchlist, setWatchlist] = useState(() =>
    SEED_WATCHLIST.map((s) => ({ ...s, change: 0, series: genSeries(s.base) }))
  );
  const [indices, setIndices] = useState(() =>
    SEED_INDICES.map((s) => ({ ...s, change: rand(-0.8, 0.9), series: genSeries(s.base, 20, 0.004) }))
  );
  const [portfolioSeries, setPortfolioSeries] = useState(() => genSeries(84213, 30, 0.006));
  const [now, setNow] = useState(new Date());

  // live tick simulation
  useEffect(() => {
    const id = setInterval(() => {
      setWatchlist((prev) =>
        prev.map((s) => {
          const delta = rand(-0.012, 0.013);
          const price = Math.max(0.5, s.price * (1 + delta));
          const series = [...s.series.slice(1), { i: s.series.length, v: price }];
          const change = ((price - s.base) / s.base) * 100;
          return { ...s, price, series, change };
        })
      );
      setIndices((prev) =>
        prev.map((s) => {
          const delta = rand(-0.003, 0.0035);
          const price = Math.max(1, s.price * (1 + delta));
          const series = [...s.series.slice(1), { i: s.series.length, v: price }];
          const change = ((price - s.base) / s.base) * 100;
          return { ...s, price, series, change };
        })
      );
      setPortfolioSeries((prev) => {
        const last = prev[prev.length - 1].v;
        const next = Math.max(1000, last * (1 + rand(-0.004, 0.005)));
        return [...prev.slice(1), { i: prev.length, v: next }];
      });
      setNow(new Date());
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const portfolioValue = portfolioSeries[portfolioSeries.length - 1].v;
  const portfolioStart = portfolioSeries[0].v;
  const portfolioChangePct = ((portfolioValue - portfolioStart) / portfolioStart) * 100;
  const portfolioUp = portfolioChangePct >= 0;

  const quickActions = useMemo(
    () => [
      { icon: Send, label: "Trade" },
      { icon: Search, label: "Search" },
      { icon: Bell, label: "Alerts" },
      { icon: Plus, label: "Add" },
    ],
    []
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#07070d] text-white font-sans">
      {/* ambient animated glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,124,246,0.08),transparent_60%)]" />
      </div>

      <style>{`
        .orb { position: absolute; border-radius: 9999px; filter: blur(70px); opacity: 0.55; }
        .orb-a {
          width: 320px; height: 320px; top: -80px; left: -60px;
          background: radial-gradient(circle, #8B7CF6 0%, #4C3ADB 60%, transparent 75%);
          animation: floatA 14s ease-in-out infinite;
        }
        .orb-b {
          width: 280px; height: 280px; top: 220px; right: -100px;
          background: radial-gradient(circle, #38BDF8 0%, #1E6FE0 60%, transparent 75%);
          animation: floatB 18s ease-in-out infinite;
        }
        .orb-c {
          width: 260px; height: 260px; bottom: -60px; left: 60px;
          background: radial-gradient(circle, #F472B6 0%, #C026D3 60%, transparent 75%);
          animation: floatC 16s ease-in-out infinite;
        }
        @keyframes floatA {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(40px, 60px) scale(1.15); }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-50px, -30px) scale(1.1); }
        }
        @keyframes floatC {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(30px, -50px) scale(1.2); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.85; }
        }
        .glass {
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
        }
        .glass-strong {
          background: linear-gradient(135deg, rgba(139,124,246,0.16), rgba(56,189,248,0.08));
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(20px);
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="relative z-10 mx-auto max-w-md px-5 pb-28 pt-8">
        {/* header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50">Good evening</p>
            <h1 className="text-lg font-semibold tracking-tight">Alex Morgan</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="glass grid h-10 w-10 place-items-center rounded-full">
              <Bell size={17} className="text-white/80" />
            </button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400" />
          </div>
        </div>

        {/* portfolio summary */}
        <div className="glass-strong mt-6 rounded-3xl p-5" style={{ animation: "pulseGlow 6s ease-in-out infinite" }}>
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs text-white/60">
              <Wallet size={13} /> Portfolio value
            </p>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-white/60">
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <h2 className="text-3xl font-semibold tabular-nums tracking-tight">
              ${fmt(portfolioValue, 2)}
            </h2>
            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                portfolioUp ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"
              }`}
            >
              {portfolioUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {fmt(Math.abs(portfolioChangePct), 2)}%
            </div>
          </div>
          <div className="mt-3 h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioSeries}>
                <defs>
                  <linearGradient id="pf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={portfolioUp ? "#34D399" : "#FB7185"} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={portfolioUp ? "#34D399" : "#FB7185"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={portfolioUp ? "#34D399" : "#FB7185"}
                  strokeWidth={2}
                  fill="url(#pf)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* quick actions */}
        <div className="mt-6 grid grid-cols-4 gap-3">
          {quickActions.map(({ icon: Icon, label }) => (
            <button key={label} className="glass flex flex-col items-center gap-2 rounded-2xl py-3.5 active:scale-95 transition-transform">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500/30 to-sky-400/30">
                <Icon size={16} className="text-white" />
              </div>
              <span className="text-[11px] text-white/70">{label}</span>
            </button>
          ))}
        </div>

        {/* market indices - horizontal scroll */}
        <div className="mt-7 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/90">Market indices</h3>
          <ChevronRight size={15} className="text-white/40" />
        </div>
        <div className="scrollbar-none mt-3 flex gap-3 overflow-x-auto">
          {indices.map((idx) => {
            const up = idx.change >= 0;
            return (
              <div key={idx.symbol} className="glass min-w-[132px] rounded-2xl p-3.5">
                <p className="text-[11px] text-white/50">{idx.symbol}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">{fmt(idx.price, 0)}</p>
                <div className="mt-2 h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={idx.series}>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={up ? "#34D399" : "#FB7185"}
                        strokeWidth={1.5}
                        fill="transparent"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className={`mt-1 text-[11px] font-medium ${up ? "text-emerald-300" : "text-rose-300"}`}>
                  {up ? "+" : ""}
                  {fmt(idx.change, 2)}%
                </p>
              </div>
            );
          })}
        </div>

        {/* top movers */}
        <div className="mt-7 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white/90">
            <TrendingUp size={14} className="text-emerald-300" /> Top movers
          </h3>
          <ChevronRight size={15} className="text-white/40" />
        </div>
        <div className="scrollbar-none mt-3 flex gap-3 overflow-x-auto">
          {[...watchlist]
            .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
            .slice(0, 4)
            .map((s) => {
              const up = s.change >= 0;
              return (
                <div key={s.symbol} className="glass min-w-[110px] rounded-2xl p-3.5">
                  <div
                    className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold"
                    style={{ background: `${s.color}33`, color: s.color }}
                  >
                    {s.symbol.slice(0, 2)}
                  </div>
                  <p className="mt-2 text-[11px] text-white/50">{s.symbol}</p>
                  <p className="text-sm font-semibold tabular-nums">${fmt(s.price)}</p>
                  <p className={`text-[11px] font-medium ${up ? "text-emerald-300" : "text-rose-300"}`}>
                    {up ? "+" : ""}
                    {fmt(s.change, 2)}%
                  </p>
                </div>
              );
            })}
        </div>

        {/* live watchlist */}
        <div className="mt-7 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/90">Live watchlist</h3>
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
          </span>
        </div>
        <div className="glass mt-3 divide-y divide-white/[0.06] rounded-2xl">
          {watchlist.map((s) => {
            const up = s.change >= 0;
            return (
              <div key={s.symbol} className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                  style={{ background: `${s.color}2a`, color: s.color }}
                >
                  {s.symbol.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.symbol}</p>
                  <p className="truncate text-[11px] text-white/45">{s.name}</p>
                </div>
                <div className="h-9 w-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={s.series}>
                      <defs>
                        <linearGradient id={`g-${s.symbol}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={up ? "#34D399" : "#FB7185"} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={up ? "#34D399" : "#FB7185"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={up ? "#34D399" : "#FB7185"}
                        strokeWidth={1.5}
                        fill={`url(#g-${s.symbol})`}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-20 shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">${fmt(s.price)}</p>
                  <p className={`text-[11px] font-medium ${up ? "text-emerald-300" : "text-rose-300"}`}>
                    {up ? "+" : ""}
                    {fmt(s.change, 2)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* bottom nav */}
      <div className="fixed bottom-4 left-1/2 z-20 w-[92%] max-w-md -translate-x-1/2">
        <div className="glass flex items-center justify-around rounded-full px-6 py-3.5">
          <Home size={19} className="text-white" />
          <LineChart size={19} className="text-white/40" />
          <button className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-sky-400 -mt-6 shadow-lg shadow-violet-500/30">
            <Send size={17} className="text-white" />
          </button>
          <Search size={19} className="text-white/40" />
          <User size={19} className="text-white/40" />
        </div>
      </div>
    </div>
  );
}