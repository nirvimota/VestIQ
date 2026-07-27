// C:\nirvi\vestIQ\frontend\src\pages\OrderHistory.jsx
import { useContext, useMemo } from "react";
import { TradingContext } from "../context/TradingContext";
import AmbientBackground from "../components/layout/AmbientBackground";

// existing hardcoded mock — kept as fallback/seed data
const MOCK_ORDERS = [
  { id: "ord_1", symbol: "RELIANCE", type: "BUY", qty: 10, price: 2456.75, timestamp: "2026-07-20T09:32:00Z" },
  { id: "ord_2", symbol: "TCS", type: "SELL", qty: 5, price: 3890.10, timestamp: "2026-07-22T11:05:00Z" },
  { id: "ord_3", symbol: "HDFCBANK", type: "BUY", qty: 15, price: 1642.30, timestamp: "2026-07-24T14:12:00Z" },
];

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
    <div className="max-w-3xl mx-auto px-4 py-6">

      <h1 className="text-xl font-semibold mb-4 text-white">Order History</h1>

      {allOrders.length === 0 ? (
        <p className="text-sm text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-2">
          {allOrders.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
            >
              <div>
                <p className="font-medium">{o.symbol}</p>
                <p className="text-xs text-gray-500">
                  {new Date(o.timestamp).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className={o.type === "BUY" ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                  {o.type}
                </p>
                <p className="text-sm text-gray-700">
                  {o.qty} @ ₹{o.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}