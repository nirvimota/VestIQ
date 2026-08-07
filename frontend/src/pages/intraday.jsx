// C:\nirvi\vestIQ\frontend\src\pages\Intraday.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, TrendingUp, TrendingDown, X } from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import AmbientBackground from "../components/layout/AmbientBackground";

const INK = "#0A0F1A";
const CARD = "#111826";
const BORDER = "#1E2838";
const TEXT = "#ECEEF0";
const SUB = "#8A93A6";
const MUTE = "#4E5A70";
const TEAL = "#2ED9B8";
const RED = "#EF5A5A";

function linePath(values, w, h, pad = 4) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * step;
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const MOCK_POSITIONS = [
  { id: "pos_1", symbol: "RELIANCE", type: "BUY", qty: 20, avg: 2932.4, ltp: 2945.1, spark: [2930, 2925, 2938, 2933, 2940, 2936, 2945.1] },
  { id: "pos_2", symbol: "HDFCBANK", type: "SELL", qty: 30, avg: 1649.0, ltp: 1642.3, spark: [1650, 1655, 1648, 1652, 1646, 1644, 1642.3] },
  { id: "pos_3", symbol: "INFY", type: "BUY", qty: 12, avg: 1502.75, ltp: 1497.2, spark: [1502, 1498, 1500, 1495, 1499, 1494, 1497.2] },
  { id: "pos_4", symbol: "TCS", type: "BUY", qty: 8, avg: 3861.5, ltp: 3890.1, spark: [3862, 3868, 3859, 3871, 3880, 3875, 3890.1] },
];

function pnlFor(p) {
  const dir = p.type === "BUY" ? 1 : -1;
  const diff = (p.ltp - p.avg) * dir;
  const amount = diff * p.qty;
  const pct = (diff / p.avg) * 100;
  return { amount, pct };
}

function useSquareOffCountdown() {
  return useMemo(() => {
    const now = new Date();
    const target = new Date(now);
    target.setHours(15, 20, 0, 0);
    let diff = target - now;
    if (diff < 0) diff += 24 * 60 * 60 * 1000;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  }, []);
}

const cardHover = { y: -3, borderColor: "rgba(255,255,255,0.16)" };
const cardTransition = { type: "spring", stiffness: 300, damping: 24 };

export default function Intraday() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState("open");
  const countdown = useSquareOffCountdown();

  // opens StockDetail as a popup on desktop, a full page on mobile — same
  // pattern as Dashboard's suggestion cards
  const openStock = (symbol) => {
    navigate(`/stock/${symbol}`, { state: { backgroundLocation: location } });
  };

  const positions = MOCK_POSITIONS.map((p) => ({ ...p, pnl: pnlFor(p) }));
  const totalPnl = positions.reduce((sum, p) => sum + p.pnl.amount, 0);
  const totalInvested = positions.reduce((sum, p) => sum + p.avg * p.qty, 0);
  const totalPnlPct = (totalPnl / totalInvested) * 100;

  return (
    <div className="v5-root min-h-screen flex relative" style={{ background: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body { font-family: 'Inter', sans-serif; }
        .v5-card { background: ${CARD}; border: 1px solid ${BORDER}; transition: border-color 0.2s ease; }
        .v5-tab { transition: color 0.15s ease, background 0.15s ease; }
        .v5-exit-btn { transition: transform 0.15s ease, background 0.15s ease; }
        .v5-exit-btn:hover { background: ${RED}1A; }
        .v5-exit-btn:active { transform: scale(0.94); }
      `}</style>

      <AmbientBackground opacity={0.13} />
      <Sidebar />

      <main className="flex-1 min-w-0 relative">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-7">
          <div className="flex items-center justify-between">
            <h1 className="v5-display text-xl" style={{ color: TEXT }}>Intraday</h1>
            <div className="v5-card rounded-full px-3 py-1.5 flex items-center gap-2" style={{ color: SUB }}>
              <Clock size={13} style={{ color: TEAL }} />
              <span className="v5-body text-[11px]">
                Auto square-off in <span className="v5-mono" style={{ color: TEXT }}>{countdown}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <motion.div whileHover={cardHover} transition={cardTransition} className="v5-card rounded-2xl px-5 py-5 md:col-span-2">
              <p className="v5-body text-sm" style={{ color: SUB }}>Today's P&amp;L</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="v5-display text-3xl" style={{ color: totalPnl >= 0 ? TEAL : RED }}>
                  {totalPnl >= 0 ? "+" : "-"}₹{Math.abs(totalPnl).toFixed(2)}
                </span>
                <span
                  className="v5-mono text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ color: totalPnl >= 0 ? TEAL : RED, background: totalPnl >= 0 ? `${TEAL}1A` : `${RED}1A` }}
                >
                  {totalPnl >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {totalPnlPct.toFixed(2)}%
                </span>
              </div>
              <p className="v5-body text-[11px] mt-3" style={{ color: MUTE }}>
                Across {positions.length} open positions today
              </p>
            </motion.div>

            <motion.div whileHover={cardHover} transition={cardTransition} className="v5-card rounded-2xl px-5 py-5">
              <p className="v5-body text-sm" style={{ color: SUB }}>Invested</p>
              <p className="v5-display text-xl mt-2" style={{ color: TEXT }}>
                ₹{totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p className="v5-body text-[11px] mt-3" style={{ color: MUTE }}>Intraday margin blocked</p>
            </motion.div>

            <motion.div whileHover={cardHover} transition={cardTransition} className="v5-card rounded-2xl px-5 py-5">
              <p className="v5-body text-sm" style={{ color: SUB }}>Open positions</p>
              <p className="v5-display text-xl mt-2" style={{ color: TEXT }}>{positions.length}</p>
              <p className="v5-body text-[11px] mt-3" style={{ color: MUTE }}>2 buy · 2 sell</p>
            </motion.div>
          </div>

          <div className="flex items-center gap-1 mt-8 v5-card rounded-full p-1 w-fit">
            {["open", "closed"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="v5-tab v5-body text-xs px-4 py-1.5 rounded-full capitalize"
                style={{ color: tab === t ? INK : SUB, background: tab === t ? TEAL : "transparent" }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 mt-4">
            {tab === "closed" ? (
              <p className="v5-body text-sm mt-4" style={{ color: MUTE }}>
                No positions squared off yet today.
              </p>
            ) : (
              positions.map((p) => {
                const spark = linePath(p.spark, 120, 36);
                const up = p.pnl.amount >= 0;
                return (
                  <motion.div
                    key={p.id}
                    whileHover={cardHover}
                    transition={cardTransition}
                    onClick={() => openStock(p.symbol)}
                    className="v5-card rounded-xl px-4 py-3 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center v5-mono text-[10px] font-bold shrink-0"
                        style={{ background: p.type === "BUY" ? `${TEAL}1A` : `${RED}1A`, color: p.type === "BUY" ? TEAL : RED }}
                      >
                        {p.symbol.slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <p className="v5-body text-sm font-medium truncate" style={{ color: TEXT }}>{p.symbol}</p>
                        <p className="v5-mono text-[11px] mt-0.5" style={{ color: MUTE }}>
                          {p.type} {p.qty} @ ₹{p.avg.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:block h-[36px] w-[120px] shrink-0">
                      <svg viewBox="0 0 120 36" className="w-full h-full" preserveAspectRatio="none">
                        <path d={spark} fill="none" stroke={up ? TEAL : RED} strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="v5-mono text-sm" style={{ color: TEXT }}>₹{p.ltp.toFixed(2)}</p>
                      <p className="v5-mono text-[11px] mt-0.5" style={{ color: up ? TEAL : RED }}>
                        {up ? "+" : "-"}₹{Math.abs(p.pnl.amount).toFixed(2)} ({p.pnl.pct.toFixed(2)}%)
                      </p>
                    </div>

                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="v5-exit-btn v5-body text-[11px] flex items-center gap-1 px-3 py-1.5 rounded-full shrink-0"
                      style={{ color: RED, border: `1px solid ${RED}40` }}
                    >
                      <X size={11} /> Exit
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}