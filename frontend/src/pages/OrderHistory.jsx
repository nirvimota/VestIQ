// C:\nirvi\vestIQ\frontend\src\pages\OrderHistory.jsx
import { useContext, useMemo } from "react";
import { motion } from "framer-motion";
import { TradingContext } from "../context/TradingContext";
import Sidebar from "../components/layout/Sidebar";
import AmbientBackground from "../components/layout/AmbientBackground";

// ---------------------------------------------------------------------------
// Design tokens — kept in sync with Dashboard v5.1
// ---------------------------------------------------------------------------
const INK = "#0A0F1A";
const CARD = "#111826";
const BORDER = "#1E2838";
const TEXT = "#ECEEF0";
const SUB = "#8A93A6";
const MUTE = "#4E5A70";
const TEAL = "#2ED9B8";
const RED = "#EF5A5A";

// existing hardcoded mock — kept as fallback/seed data
const MOCK_ORDERS = [
  { id: "ord_1", symbol: "RELIANCE", type: "BUY", qty: 10, price: 2456.75, timestamp: "2026-07-20T09:32:00Z" },
  { id: "ord_2", symbol: "TCS", type: "SELL", qty: 5, price: 3890.10, timestamp: "2026-07-22T11:05:00Z" },
  { id: "ord_3", symbol: "HDFCBANK", type: "BUY", qty: 15, price: 1642.30, timestamp: "2026-07-24T14:12:00Z" },
];

const cardHover = { y: -3, borderColor: "rgba(255,255,255,0.16)" };
const cardTransition = { type: "spring", stiffness: 300, damping: 24 };

export default function OrderHistory() {
  const { transactions } = useContext(TradingContext);

  // merge: context transactions first (newest), then mock, de-duped by id
  const allOrders = useMemo(() => {
    const seen = new Set();
    const merged = [...transactions, ...MOCK_ORDERS].filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
    return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [transactions]);

  return (
    <div className="v5-root min-h-screen flex relative" style={{ background: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body { font-family: 'Inter', sans-serif; }
        .v5-card { background: ${CARD}; border: 1px solid ${BORDER}; transition: border-color 0.2s ease; }
      `}</style>

      <AmbientBackground opacity={0.13} />
      <Sidebar />

      {/* Main */}
      <main className="flex-1 min-w-0 relative">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-7">
          <h1 className="v5-display text-xl" style={{ color: TEXT }}>Order History</h1>

          {allOrders.length === 0 ? (
            <p className="v5-body text-sm mt-4" style={{ color: MUTE }}>No orders yet.</p>
          ) : (
            <div className="flex flex-col gap-2 mt-6">
              {allOrders.map((o) => (
                <motion.div
                  key={o.id}
                  whileHover={cardHover}
                  transition={cardTransition}
                  className="v5-card rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="v5-body text-sm font-medium" style={{ color: TEXT }}>{o.symbol}</p>
                    <p className="v5-mono text-[11px] mt-0.5" style={{ color: MUTE }}>
                      {new Date(o.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="v5-body text-sm font-medium"
                      style={{ color: o.type === "BUY" ? TEAL : RED }}
                    >
                      {o.type}
                    </p>
                    <p className="v5-mono text-sm mt-0.5" style={{ color: SUB }}>
                      {o.qty} @ ₹{o.price.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}