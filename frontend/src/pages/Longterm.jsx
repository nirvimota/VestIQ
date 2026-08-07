// C:\nirvi\vestIQ\frontend\src\pages\LongTerm.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, TrendingUp, TrendingDown, Target } from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import AmbientBackground from "../components/layout/AmbientBackground";

const INK = "#0A0F1A";
const CARD = "#111826";
const BORDER = "#1E2838";
const TEXT = "#ECEEF0";
const SUB = "#8A93A6";
const MUTE = "#4E5A70";
const TEAL = "#2ED9B8";
const BLUE = "#5B9CFF";
const PURPLE = "#B98CFF";
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

const MOCK_HOLDINGS = [
  { id: "lt_1", symbol: "RELIANCE", qty: 25, avg: 2210.5, ltp: 2945.6, boughtOn: "2023-11-14", target: 3400, spark: [2210, 2340, 2280, 2510, 2600, 2720, 2860, 2945.6] },
  { id: "lt_2", symbol: "HDFCBANK", qty: 40, avg: 1420.0, ltp: 1675.2, boughtOn: "2024-02-02", target: 1800, spark: [1420, 1455, 1480, 1510, 1560, 1590, 1640, 1675.2] },
  { id: "lt_3", symbol: "TCS", qty: 10, avg: 3450.0, ltp: 3812.4, boughtOn: "2023-06-20", target: 4200, spark: [3450, 3520, 3480, 3600, 3650, 3700, 3760, 3812.4] },
  { id: "lt_4", symbol: "INFY", qty: 18, avg: 1610.0, ltp: 1462.1, boughtOn: "2024-08-05", target: 1900, spark: [1610, 1580, 1595, 1540, 1510, 1490, 1470, 1462.1] },
];

function daysHeld(boughtOn) {
  return Math.floor((Date.now() - new Date(boughtOn).getTime()) / 86400000);
}

function cagr(avg, ltp, days) {
  const years = days / 365;
  if (years <= 0) return 0;
  return (Math.pow(ltp / avg, 1 / years) - 1) * 100;
}

const cardHover = { y: -3, borderColor: "rgba(255,255,255,0.16)" };
const cardTransition = { type: "spring", stiffness: 300, damping: 24 };

export default function LongTerm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sortBy, setSortBy] = useState("gain");

  const openStock = (symbol) => {
    navigate(`/stock/${symbol}`, { state: { backgroundLocation: location } });
  };

  const holdings = useMemo(() => {
    const enriched = MOCK_HOLDINGS.map((h) => {
      const days = daysHeld(h.boughtOn);
      const gainAmount = (h.ltp - h.avg) * h.qty;
      const gainPct = ((h.ltp - h.avg) / h.avg) * 100;
      const invested = h.avg * h.qty;
      const value = h.ltp * h.qty;
      const progressToTarget = Math.min(100, Math.max(0, ((h.ltp - h.avg) / (h.target - h.avg)) * 100));
      return { ...h, days, gainAmount, gainPct, invested, value, cagrPct: cagr(h.avg, h.ltp, days), progressToTarget };
    });
    const sorters = {
      gain: (a, b) => b.gainPct - a.gainPct,
      days: (a, b) => b.days - a.days,
      cagr: (a, b) => b.cagrPct - a.cagrPct,
    };
    return enriched.sort(sorters[sortBy]);
  }, [sortBy]);

  const totalInvested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalGain = totalValue - totalInvested;
  const totalGainPct = (totalGain / totalInvested) * 100;
  const avgDays = Math.round(holdings.reduce((sum, h) => sum + h.days, 0) / holdings.length);

  return (
    <div className="v5-root min-h-screen flex relative" style={{ background: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body { font-family: 'Inter', sans-serif; }
        .v5-card { background: ${CARD}; border: 1px solid ${BORDER}; transition: border-color 0.2s ease; }
        .v5-sort-tab { transition: color 0.15s ease, background 0.15s ease; }
      `}</style>

      <AmbientBackground opacity={0.13} />
      <Sidebar />

      <main className="flex-1 min-w-0 relative">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-7">
          <div className="flex items-center justify-between">
            <h1 className="v5-display text-xl" style={{ color: TEXT }}>Long-Term</h1>
            <div className="v5-card rounded-full px-3 py-1.5 flex items-center gap-2" style={{ color: SUB }}>
              <CalendarDays size={13} style={{ color: BLUE }} />
              <span className="v5-body text-[11px]">
                Avg. holding <span className="v5-mono" style={{ color: TEXT }}>{avgDays}d</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <motion.div whileHover={cardHover} transition={cardTransition} className="v5-card rounded-2xl px-5 py-5 md:col-span-2">
              <p className="v5-body text-sm" style={{ color: SUB }}>Current value</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="v5-display text-3xl" style={{ color: TEXT }}>
                  ₹{totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </span>
                <span
                  className="v5-mono text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ color: totalGain >= 0 ? TEAL : RED, background: totalGain >= 0 ? `${TEAL}1A` : `${RED}1A` }}
                >
                  {totalGain >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {totalGainPct.toFixed(2)}%
                </span>
              </div>
              <p className="v5-body text-[11px] mt-3" style={{ color: MUTE }}>
                {totalGain >= 0 ? "+" : "-"}₹{Math.abs(totalGain).toLocaleString("en-IN", { maximumFractionDigits: 0 })} overall gain across {holdings.length} holdings
              </p>
            </motion.div>

            <motion.div whileHover={cardHover} transition={cardTransition} className="v5-card rounded-2xl px-5 py-5">
              <p className="v5-body text-sm" style={{ color: SUB }}>Invested</p>
              <p className="v5-display text-xl mt-2" style={{ color: TEXT }}>
                ₹{totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p className="v5-body text-[11px] mt-3" style={{ color: MUTE }}>Total cost basis</p>
            </motion.div>

            <motion.div whileHover={cardHover} transition={cardTransition} className="v5-card rounded-2xl px-5 py-5">
              <p className="v5-body text-sm" style={{ color: SUB }}>Holdings</p>
              <p className="v5-display text-xl mt-2" style={{ color: TEXT }}>{holdings.length}</p>
              <p className="v5-body text-[11px] mt-3" style={{ color: MUTE }}>
                {holdings.filter((h) => h.gainPct >= 0).length} in profit
              </p>
            </motion.div>
          </div>

          <div className="flex items-center gap-1 mt-8 v5-card rounded-full p-1 w-fit">
            {[
              { key: "gain", label: "Top gainers" },
              { key: "days", label: "Longest held" },
              { key: "cagr", label: "CAGR" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setSortBy(t.key)}
                className="v5-sort-tab v5-body text-xs px-4 py-1.5 rounded-full"
                style={{ color: sortBy === t.key ? INK : SUB, background: sortBy === t.key ? TEAL : "transparent" }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 mt-4">
            {holdings.map((h) => {
              const spark = linePath(h.spark, 120, 36);
              const up = h.gainAmount >= 0;
              return (
                <motion.div
                  key={h.id}
                  whileHover={cardHover}
                  transition={cardTransition}
                  onClick={() => openStock(h.symbol)}
                  className="v5-card rounded-xl px-4 py-3.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center v5-mono text-[10px] font-bold shrink-0"
                        style={{ background: `${PURPLE}1A`, color: PURPLE }}
                      >
                        {h.symbol.slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <p className="v5-body text-sm font-medium truncate" style={{ color: TEXT }}>{h.symbol}</p>
                        <p className="v5-mono text-[11px] mt-0.5" style={{ color: MUTE }}>
                          {h.qty} qty · avg ₹{h.avg.toFixed(2)} · held {h.days}d
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:block h-[36px] w-[120px] shrink-0">
                      <svg viewBox="0 0 120 36" className="w-full h-full" preserveAspectRatio="none">
                        <path d={spark} fill="none" stroke={up ? TEAL : RED} strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="v5-mono text-sm" style={{ color: TEXT }}>₹{h.ltp.toFixed(2)}</p>
                      <p className="v5-mono text-[11px] mt-0.5" style={{ color: up ? TEAL : RED }}>
                        {up ? "+" : "-"}₹{Math.abs(h.gainAmount).toFixed(0)} ({h.gainPct.toFixed(2)}%)
                      </p>
                    </div>

                    <div className="text-right shrink-0 hidden md:block">
                      <p className="v5-mono text-sm" style={{ color: BLUE }}>{h.cagrPct.toFixed(1)}%</p>
                      <p className="v5-body text-[10px] mt-0.5" style={{ color: MUTE }}>CAGR</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Target size={11} style={{ color: MUTE }} />
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${h.progressToTarget}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
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
      </main>
    </div>
  );
}