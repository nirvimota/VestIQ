// C:\nirvi\vestIQ\frontend\src\pages\OrderTicket.jsx
import { useContext, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TradingContext } from "../context/TradingContext";

// same mock market list Watchlist's "+ Add stock" panel uses
// (kept here too so this page works standalone if opened directly)
const MOCK_MARKET = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2456.75 },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3890.10 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1642.30 },
  { symbol: "INFY", name: "Infosys", price: 1789.45 },
  { symbol: "ITC", name: "ITC Limited", price: 462.80 },
];

export default function OrderTicket() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { addTransaction, addToWatchlist } = useContext(TradingContext);

  const stock = useMemo(
    () => MOCK_MARKET.find((s) => s.symbol === symbol) ?? {
      symbol,
      name: symbol,
      price: 0,
    },
    [symbol]
  );

  const [qty, setQty] = useState(1);
  const [placed, setPlaced] = useState(false);

  const total = (stock.price * qty).toFixed(2);

  const handleBuy = () => {
    if (qty < 1) return;
    addTransaction({
      symbol: stock.symbol,
      type: "BUY",
      qty: Number(qty),
      price: stock.price,
    });
    addToWatchlist(stock.symbol);
    setPlaced(true);
    setTimeout(() => navigate("/portfolio"), 900);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 mb-4"
      >
        ← Back
      </button>

      <h1 className="text-xl font-semibold">{stock.symbol}</h1>
      <p className="text-sm text-gray-500 mb-4">{stock.name}</p>

      <div className="rounded-xl border border-gray-200 p-4 mb-4">
        <p className="text-sm text-gray-500">Current Price</p>
        <p className="text-2xl font-semibold text-white">₹{stock.price.toFixed(2)}</p>
      </div>

      <label className="block text-sm text-gray-600 mb-1">Quantity</label>
      <input
        type="number"
        min="1"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="w-full rounded-xl border border-gray-300 px-3 py-2 mb-4"
      />

      <div className="flex items-center justify-between mb-6 text-sm">
        <span className="text-gray-500">Total</span>
        <span className="font-medium">₹{total}</span>
      </div>

      <button
        onClick={handleBuy}
        disabled={placed}
        className="w-full rounded-xl bg-emerald-600 text-white py-3 font-medium disabled:opacity-60"
      >
        {placed ? "Order Placed ✓" : `Buy ${stock.symbol}`}
      </button>
    </div>
  );
}