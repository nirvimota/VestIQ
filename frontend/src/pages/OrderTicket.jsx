// d:\nirvi\VestIQ\frontend\src\pages\OrderTicket.jsx
import { useContext, useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TradingContext } from "../context/tradingContext";
import { getStockQuote } from "../services/stockApi";
import { placeOrder } from "../services/orderApi";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/layout/Sidebar";
import AmbientBackground from "../components/layout/AmbientBackground";
import {
  ArrowLeft,
  Minus,
  Plus,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Design tokens — v5.1 shared token system
// ---------------------------------------------------------------------------
const INK = "#0A0F1A";
const CARD = "#111826";
const BORDER = "#1E2838";
const TEXT = "#ECEEF0";
const SUB = "#8A93A6";
const MUTE = "#4E5A70";
const TEAL = "#2ED9B8";
const RED = "#EF5A5A";
const AMBER = "#F5A623";

// ---------------------------------------------------------------------------
// Mock market data fallback (if live fetch is pending or fails)
// ---------------------------------------------------------------------------
const MOCK_MARKET = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2945.60, prevClose: 2895.20, high: 2968.40, low: 2922.15 },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3812.40, prevClose: 3848.10, high: 3862.00, low: 3790.50 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1675.20, prevClose: 1651.00, high: 1692.80, low: 1648.30 },
  { symbol: "INFY", name: "Infosys", price: 1462.10, prevClose: 1490.00, high: 1498.60, low: 1455.20 },
  { symbol: "ICICIBANK", name: "ICICI Bank", price: 1188.35, prevClose: 1203.30, high: 1210.50, low: 1180.00 },
  { symbol: "SBIN", name: "State Bank of India", price: 824.60, prevClose: 807.50, high: 832.40, low: 805.10 },
  { symbol: "ITC", name: "ITC Ltd", price: 462.90, prevClose: 465.80, high: 468.50, low: 460.10 },
  { symbol: "TATAMOTORS", name: "Tata Motors", price: 968.40, prevClose: 928.10, high: 975.80, low: 925.30 },
];

function fmt(n) {
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function OrderTicket() {
  const { symbol } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addTransaction, addToWatchlist } = useContext(TradingContext);
  const { session } = useAuth();
  const token = session?.access_token;

  // Live stock data state
  const [liveQuote, setLiveQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  // Derive side from query string — default to "buy"
  const initialSide = searchParams.get("side") === "sell" ? "sell" : "buy";
  const [side, setSide] = useState(initialSide);

  // Fetch live market data on mount/symbol change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getStockQuote(symbol)
      .then((data) => {
        if (isMounted && data) {
          setLiveQuote(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load live price for OrderTicket:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  // Fallback to static mock if live fetch fails or is loading
  const stock = useMemo(() => {
    if (liveQuote) {
      return {
        symbol: liveQuote.symbol || symbol,
        name: liveQuote.name || symbol,
        price: Number(liveQuote.price) || 0,
        prevClose: Number(liveQuote.prev_close) || Number(liveQuote.open) || Number(liveQuote.price) || 0,
        high: Number(liveQuote.high) || Number(liveQuote.price) || 0,
        low: Number(liveQuote.low) || Number(liveQuote.price) || 0,
      };
    }
    const mock = MOCK_MARKET.find((s) => s.symbol === symbol);
    return mock ?? {
      symbol,
      name: symbol,
      price: 0,
      prevClose: 0,
      high: 0,
      low: 0,
    };
  }, [liveQuote, symbol]);

  const change = stock.price - stock.prevClose;
  const changePct = stock.prevClose ? (change / stock.prevClose) * 100 : 0;
  const isUp = change >= 0;

  // Order state
  const [orderType, setOrderType] = useState("market"); // market | limit
  const [qty, setQty] = useState(1);
  const [limitPrice, setLimitPrice] = useState(stock.price);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Keep limit price in sync when live price loads/changes
  useEffect(() => {
    if (stock.price) {
      setLimitPrice(stock.price);
    }
  }, [stock.price]);

  const executionPrice = orderType === "limit" ? limitPrice : stock.price;
  const total = executionPrice * qty;
  const brokerage = Math.min(total * 0.0003, 20); // ~0.03% or ₹20 max
  const netTotal = side === "buy" ? total + brokerage : total - brokerage;

  const isBuy = side === "buy";
  const accentColor = isBuy ? TEAL : RED;

  const handlePlaceOrder = () => {
    if (qty < 1 || confirming) return;
    setConfirming(true);
  };

  const handleConfirm = async () => {
    try {
      if (token) {
        await placeOrder({
          symbol: stock.symbol,
          type: orderType,
          side: side,
          quantity: Number(qty),
          price: executionPrice,
        }, token);
      }
    } catch (err) {
      console.error("Backend order failed, proceeding with local fallback:", err);
    }

    addTransaction({
      symbol: stock.symbol,
      type: side.toUpperCase(),
      qty: Number(qty),
      price: executionPrice,
    });
    if (isBuy) addToWatchlist(stock.symbol);
    setPlaced(true);
    setTimeout(() => navigate("/portfolio"), 1400);
  };

  const incrementQty = () => setQty((q) => q + 1);
  const decrementQty = () => setQty((q) => Math.max(1, q - 1));

  // Quick-pick quantities
  const QUICK_QTY = [1, 5, 10, 25, 50];

  return (
    <div
      className="v5-root min-h-screen flex relative"
      style={{ background: INK }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body { font-family: 'Inter', sans-serif; }
        .v5-card { background: ${CARD}; border: 1px solid ${BORDER}; }

        .ot-side-btn {
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .ot-side-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.2s ease;
          border-radius: inherit;
        }
        .ot-side-btn:hover::before { opacity: 0.08; }
        .ot-side-btn.active-buy { background: ${TEAL}; color: ${INK}; font-weight: 600; }
        .ot-side-btn.active-buy::before { background: white; }
        .ot-side-btn.active-sell { background: ${RED}; color: white; font-weight: 600; }
        .ot-side-btn.active-sell::before { background: white; }
        .ot-side-btn.inactive { background: transparent; color: ${MUTE}; border: 1px solid ${BORDER}; }
        .ot-side-btn.inactive:hover { color: ${TEXT}; border-color: rgba(255,255,255,0.2); }

        .ot-qty-btn {
          transition: all 0.15s ease;
        }
        .ot-qty-btn:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.2);
        }
        .ot-qty-btn:active {
          transform: scale(0.92);
        }

        .ot-quick-chip {
          transition: all 0.15s ease;
        }
        .ot-quick-chip:hover {
          border-color: rgba(255,255,255,0.24);
          color: ${TEXT};
          background: rgba(255,255,255,0.04);
        }
        .ot-quick-chip.active {
          border-color: ${TEAL}80;
          color: ${TEAL};
          background: ${TEAL}12;
        }

        .ot-type-dropdown {
          animation: dropIn 0.15s ease-out;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ot-row {
          transition: background 0.15s ease;
        }
        .ot-row:hover {
          background: rgba(255,255,255,0.02);
        }

        .ot-glow-buy {
          box-shadow: 0 0 40px ${TEAL}18, 0 0 80px ${TEAL}08;
        }
        .ot-glow-sell {
          box-shadow: 0 0 40px ${RED}18, 0 0 80px ${RED}08;
        }

        .ot-input:focus {
          outline: none;
          border-color: ${TEAL};
          box-shadow: 0 0 0 2px ${TEAL}20;
        }

        .success-ring {
          animation: ringPulse 0.6s ease-out;
        }
        @keyframes ringPulse {
          0% { transform: scale(0.7); opacity: 0; }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }

        .success-check {
          animation: checkBounce 0.5s ease-out 0.2s both;
        }
        @keyframes checkBounce {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>

      <AmbientBackground opacity={0.1} />
      <Sidebar />

      <div className="flex-1 min-w-0 relative">
        <div className="max-w-xl mx-auto px-4 sm:px-5 py-6 lg:py-8 pb-28 lg:pb-24">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="v5-body flex items-center gap-2 text-xs mb-6 transition-colors"
            style={{ color: MUTE }}
            onMouseEnter={(e) => (e.currentTarget.style.color = TEXT)}
            onMouseLeave={(e) => (e.currentTarget.style.color = MUTE)}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {/* Loading Indicator */}
          {loading && !liveQuote && (
            <div className="v5-card rounded-2xl p-6 mb-6 flex items-center justify-center gap-3">
              <Loader2 size={16} className="animate-spin text-[#2ED9B8]" />
              <span className="v5-mono text-xs text-[#8A93A6]">Connecting live market data...</span>
            </div>
          )}

          {/* Stock header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center v5-mono text-xs font-bold"
                  style={{
                    background: `${accentColor}15`,
                    color: accentColor,
                    border: `1px solid ${accentColor}30`,
                  }}
                >
                  {stock.symbol.substring(0, 3)}
                </div>
                <div>
                  <h1
                    className="v5-display text-xl"
                    style={{ color: TEXT }}
                  >
                    {stock.symbol}
                  </h1>
                  <p
                    className="v5-body text-xs"
                    style={{ color: MUTE }}
                  >
                    {stock.name} · NSE
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="v5-mono text-xl" style={{ color: TEXT }}>
                ₹{fmt(stock.price)}
              </p>
              <p
                className="v5-mono text-xs flex items-center justify-end gap-1 mt-0.5"
                style={{ color: isUp ? TEAL : RED }}
              >
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isUp ? "+" : ""}
                {changePct.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Price range bar */}
          <div
            className="v5-card rounded-xl px-4 py-3 mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="v5-mono text-[10px] uppercase tracking-wider" style={{ color: MUTE }}>
                Day Range
              </span>
              <span className="v5-mono text-[10px]" style={{ color: SUB }}>
                ₹{fmt(stock.low)} — ₹{fmt(stock.high)}
              </span>
            </div>
            <div
              className="relative h-1.5 rounded-full overflow-hidden"
              style={{ background: `${BORDER}` }}
            >
              {/* Range fill */}
              {stock.high > stock.low && (
                <>
                  <div
                    className="absolute inset-y-0 rounded-full"
                    style={{
                      left: "0%",
                      right: "0%",
                      background: `linear-gradient(90deg, ${RED}60, ${TEAL}60)`,
                    }}
                  />
                  {/* Current price marker */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                    style={{
                      left: `${((stock.price - stock.low) / (stock.high - stock.low)) * 100}%`,
                      background: isUp ? TEAL : RED,
                      border: `2px solid ${INK}`,
                      marginLeft: "-6px",
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Buy / Sell toggle */}
          <div
            className="grid grid-cols-2 gap-2 p-1.5 rounded-xl mb-6"
            style={{ background: `${INK}`, border: `1px solid ${BORDER}` }}
          >
            <button
              onClick={() => setSide("buy")}
              className={`ot-side-btn v5-body text-sm py-2.5 rounded-lg ${
                isBuy ? "active-buy" : "inactive"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide("sell")}
              className={`ot-side-btn v5-body text-sm py-2.5 rounded-lg ${
                !isBuy ? "active-sell" : "inactive"
              }`}
            >
              Sell
            </button>
          </div>

          {/* Order card */}
          <motion.div
            className={`v5-card rounded-2xl p-5 mb-5 ${
              isBuy ? "ot-glow-buy" : "ot-glow-sell"
            }`}
            layout
          >
            {/* Order Type selector */}
            <div className="mb-5">
              <p
                className="v5-mono text-[10px] uppercase tracking-wider mb-2"
                style={{ color: MUTE }}
              >
                Order Type
              </p>
              <div className="relative">
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm v5-body transition-colors"
                  style={{
                    background: INK,
                    border: `1px solid ${BORDER}`,
                    color: TEXT,
                  }}
                >
                  <span className="flex items-center gap-2">
                    {orderType === "market" ? (
                      <Zap size={14} style={{ color: TEAL }} />
                    ) : (
                      <ShieldCheck size={14} style={{ color: AMBER }} />
                    )}
                    {orderType === "market" ? "Market Order" : "Limit Order"}
                  </span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: MUTE,
                      transform: showTypeDropdown ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>

                {showTypeDropdown && (
                  <div
                    className="ot-type-dropdown absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20"
                    style={{
                      background: CARD,
                      border: `1px solid ${BORDER}`,
                      boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                    }}
                  >
                    <button
                      onClick={() => {
                        setOrderType("market");
                        setShowTypeDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm v5-body ot-row"
                      style={{
                        color: orderType === "market" ? TEAL : TEXT,
                        borderBottom: `1px solid ${BORDER}`,
                      }}
                    >
                      <Zap size={14} />
                      <div className="text-left">
                        <p className="text-sm">Market Order</p>
                        <p className="text-[11px]" style={{ color: MUTE }}>
                          Execute at current market price
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setOrderType("limit");
                        setShowTypeDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm v5-body ot-row"
                      style={{
                        color: orderType === "limit" ? AMBER : TEXT,
                      }}
                    >
                      <ShieldCheck size={14} />
                      <div className="text-left">
                        <p className="text-sm">Limit Order</p>
                        <p className="text-[11px]" style={{ color: MUTE }}>
                          Set your desired price
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Limit price input */}
            <AnimatePresence>
              {orderType === "limit" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mb-5"
                >
                  <p
                    className="v5-mono text-[10px] uppercase tracking-wider mb-2"
                    style={{ color: MUTE }}
                  >
                    Limit Price
                  </p>
                  <div className="relative">
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 v5-mono text-sm"
                      style={{ color: SUB }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      value={limitPrice}
                      onChange={(e) =>
                        setLimitPrice(Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      step="0.05"
                      className="ot-input w-full v5-mono text-sm rounded-xl pl-8 pr-4 py-3 transition-all"
                      style={{
                        background: INK,
                        border: `1px solid ${BORDER}`,
                        color: TEXT,
                      }}
                    />
                  </div>
                  {limitPrice !== stock.price && stock.price > 0 && (
                    <p
                      className="v5-mono text-[11px] mt-1.5 flex items-center gap-1"
                      style={{
                        color:
                          (isBuy && limitPrice < stock.price) ||
                          (!isBuy && limitPrice > stock.price)
                            ? TEAL
                            : AMBER,
                      }}
                    >
                      {((limitPrice - stock.price) / stock.price * 100).toFixed(2)}% from market
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quantity */}
            <div className="mb-5">
              <p
                className="v5-mono text-[10px] uppercase tracking-wider mb-2"
                style={{ color: MUTE }}
              >
                Quantity
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={decrementQty}
                  className="ot-qty-btn w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    border: `1px solid ${BORDER}`,
                    color: qty <= 1 ? MUTE : TEXT,
                  }}
                  disabled={qty <= 1}
                >
                  <Minus size={16} />
                </button>

                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="ot-input flex-1 v5-mono text-center text-lg rounded-xl py-2.5 transition-all"
                  style={{
                    background: INK,
                    border: `1px solid ${BORDER}`,
                    color: TEXT,
                  }}
                />

                <button
                  onClick={incrementQty}
                  className="ot-qty-btn w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    border: `1px solid ${BORDER}`,
                    color: TEXT,
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Quick picks */}
              <div className="flex gap-2 mt-3">
                {QUICK_QTY.map((q) => (
                  <button
                    key={q}
                    onClick={() => setQty(q)}
                    className={`ot-quick-chip flex-1 v5-mono text-xs py-1.5 rounded-lg ${
                      qty === q ? "active" : ""
                    }`}
                    style={{
                      border: `1px solid ${qty === q ? `${TEAL}60` : BORDER}`,
                      color: qty === q ? TEAL : MUTE,
                      background: qty === q ? `${TEAL}10` : "transparent",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${BORDER}` }} className="my-4" />

            {/* Order summary */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between ot-row rounded-lg px-2 py-1.5 -mx-2">
                <span className="v5-body text-xs" style={{ color: SUB }}>
                  {orderType === "market" ? "Market Price" : "Limit Price"}
                </span>
                <span className="v5-mono text-sm" style={{ color: TEXT }}>
                  ₹{fmt(executionPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between ot-row rounded-lg px-2 py-1.5 -mx-2">
                <span className="v5-body text-xs" style={{ color: SUB }}>
                  Quantity
                </span>
                <span className="v5-mono text-sm" style={{ color: TEXT }}>
                  {qty} {qty === 1 ? "share" : "shares"}
                </span>
              </div>
              <div className="flex items-center justify-between ot-row rounded-lg px-2 py-1.5 -mx-2">
                <span className="v5-body text-xs" style={{ color: SUB }}>
                  Subtotal
                </span>
                <span className="v5-mono text-sm" style={{ color: TEXT }}>
                  ₹{fmt(total)}
                </span>
              </div>
              <div className="flex items-center justify-between ot-row rounded-lg px-2 py-1.5 -mx-2">
                <span className="v5-body text-xs" style={{ color: SUB }}>
                  Brokerage (est.)
                </span>
                <span className="v5-mono text-xs" style={{ color: MUTE }}>
                  ₹{fmt(brokerage)}
                </span>
              </div>

              <div
                className="flex items-center justify-between pt-3 mt-1"
                style={{ borderTop: `1px solid ${BORDER}` }}
              >
                <span className="v5-body text-sm font-medium" style={{ color: TEXT }}>
                  {isBuy ? "Total Payable" : "Total Receivable"}
                </span>
                <span className="v5-mono text-lg font-medium" style={{ color: accentColor }}>
                  ₹{fmt(netTotal)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Place order button */}
          <motion.button
            onClick={handlePlaceOrder}
            disabled={placed || qty < 1 || stock.price <= 0}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full v5-body text-sm font-semibold py-4 rounded-2xl transition-all disabled:opacity-50"
            style={{
              background: isBuy
                ? `linear-gradient(135deg, ${TEAL}, #24B89A)`
                : `linear-gradient(135deg, ${RED}, #D94444)`,
              color: isBuy ? INK : "white",
              boxShadow: `0 4px 24px ${accentColor}30`,
            }}
          >
            {isBuy ? "Buy" : "Sell"} {stock.symbol} · ₹{fmt(netTotal)}
          </motion.button>

          {/* Disclaimer */}
          <p
            className="v5-body text-[10px] text-center mt-3 leading-relaxed"
            style={{ color: MUTE }}
          >
            Orders placed outside market hours will be queued for next trading session.
            <br />
            Brokerage is estimated. Actual charges may vary.
          </p>
        </div>
      </div>

      {/* ── Confirmation overlay ── */}
      <AnimatePresence>
        {confirming && !placed && (
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(10,15,26,0.82)", backdropFilter: "blur(8px)" }}
            onClick={() => setConfirming(false)}
          >
            <motion.div
              key="confirm-panel"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-6"
              style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 60px ${accentColor}10`,
              }}
            >
              <h3
                className="v5-display text-lg mb-1"
                style={{ color: TEXT }}
              >
                Confirm {isBuy ? "Purchase" : "Sale"}
              </h3>
              <p className="v5-body text-xs mb-5" style={{ color: SUB }}>
                Please review your order details before confirming.
              </p>

              <div
                className="rounded-xl p-4 mb-5 space-y-2"
                style={{ background: INK, border: `1px solid ${BORDER}` }}
              >
                <div className="flex justify-between">
                  <span className="v5-body text-xs" style={{ color: SUB }}>Stock</span>
                  <span className="v5-mono text-sm font-medium" style={{ color: TEXT }}>
                    {stock.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="v5-body text-xs" style={{ color: SUB }}>Side</span>
                  <span
                    className="v5-mono text-sm font-medium"
                    style={{ color: accentColor }}
                  >
                    {side.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="v5-body text-xs" style={{ color: SUB }}>Type</span>
                  <span className="v5-mono text-sm" style={{ color: TEXT }}>
                    {orderType === "market" ? "Market" : "Limit"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="v5-body text-xs" style={{ color: SUB }}>Qty</span>
                  <span className="v5-mono text-sm" style={{ color: TEXT }}>{qty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="v5-body text-xs" style={{ color: SUB }}>Price</span>
                  <span className="v5-mono text-sm" style={{ color: TEXT }}>
                    ₹{fmt(executionPrice)}
                  </span>
                </div>
                <div
                  className="flex justify-between pt-2 mt-1"
                  style={{ borderTop: `1px solid ${BORDER}` }}
                >
                  <span className="v5-body text-sm font-medium" style={{ color: TEXT }}>
                    Total
                  </span>
                  <span
                    className="v5-mono text-base font-medium"
                    style={{ color: accentColor }}
                  >
                    ₹{fmt(netTotal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConfirming(false)}
                  className="v5-body text-sm py-3 rounded-xl transition-colors"
                  style={{
                    background: "transparent",
                    border: `1px solid ${BORDER}`,
                    color: SUB,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                    e.currentTarget.style.color = TEXT;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = BORDER;
                    e.currentTarget.style.color = SUB;
                  }}
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleConfirm}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="v5-body text-sm font-semibold py-3 rounded-xl"
                  style={{
                    background: accentColor,
                    color: isBuy ? INK : "white",
                  }}
                >
                  Confirm {isBuy ? "Buy" : "Sell"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success overlay ── */}
      <AnimatePresence>
        {placed && (
          <motion.div
            key="success-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
            style={{ background: "rgba(10,15,26,0.90)", backdropFilter: "blur(12px)" }}
          >
            <div
              className="success-ring w-20 h-20 rounded-full flex items-center justify-center mb-5"
              style={{
                background: `${accentColor}15`,
                border: `2px solid ${accentColor}40`,
              }}
            >
              <CheckCircle2
                size={36}
                className="success-check"
                style={{ color: accentColor }}
              />
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="v5-display text-xl mb-1"
              style={{ color: TEXT }}
            >
              Order Placed!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="v5-body text-sm"
              style={{ color: SUB }}
            >
              {isBuy ? "Bought" : "Sold"} {qty} {stock.symbol} @ ₹{fmt(executionPrice)}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="v5-mono text-xs mt-4"
              style={{ color: MUTE }}
            >
              Redirecting to portfolio…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}