import { useState, useEffect, useCallback, useRef } from "react";
import {
    Wallet,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    RotateCcw,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    AlertTriangle,
    Search,
    BarChart2,
    Activity,
    Sparkles,
    ShieldAlert,
    Target,
} from "lucide-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import { searchStocks, getStockHistory, getStockQuote, getAIStockPrediction } from "../services/stockApi";
import Sidebar from "../components/layout/Sidebar";
import AmbientBackground from "../components/layout/AmbientBackground";
import {
    getPaperAccount,
    getPaperPortfolio,
    getPaperHoldings,
    getPaperOrders,
    placePaperOrder,
    resetPaperAccount,
} from "../services/paperTradingApi";

const INK = "#0a0f1a";
const CARD = "#111826";
const BORDER = "rgba(255,255,255,0.08)";
const EMERALD = "#10b981";
const ROSE = "#f43f5e";
const AMBER = "#f59e0b";

// Base text color used everywhere unless a semantic color (emerald/rose/amber)
// overrides it for state (P&L, buy/sell, expiry warnings, etc).
const TXT = "text-white/85";
const TXT_MUTED = "text-white/85";

function fmtINR(n) {
    return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function StatCard({ label, value, sub, tone }) {
    return (
        <div className="v5-card rounded-xl p-3 sm:p-4">
            <p className={`v5-mono text-[11px] sm:text-xs ${TXT_MUTED}`}>{label}</p>
            <p
                className="v5-display mt-1 text-lg sm:text-xl font-semibold break-words"
                style={{ color: tone || "rgba(255,255,255,0.85)" }}
            >
                {value}
            </p>
            {sub && <p className={`v5-body mt-1 text-xs ${TXT_MUTED}`}>{sub}</p>}
        </div>
    );
}

function HoldingsTable({ holdings }) {
    if (!holdings.length) {
        return (
            <div className="v5-card rounded-xl p-6 text-center">
                <p className={`v5-body text-sm ${TXT_MUTED}`}>
                    No open positions yet. Place your first paper order below.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Mobile: stacked cards (nothing gets clipped) */}
            <div className="space-y-2 sm:hidden">
                {holdings.map((h) => {
                    const isUp = h.pnl >= 0;
                    return (
                        <div key={h.symbol} className="v5-card rounded-xl p-3.5">
                            <div className="flex items-center justify-between">
                                <span className="v5-body font-medium text-sm text-white/90">{h.symbol}</span>
                                <span
                                    className="v5-mono flex items-center gap-1 text-sm font-medium"
                                    style={{ color: isUp ? EMERALD : ROSE }}
                                >
                                    {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {fmtINR(h.pnl)} ({h.pnl_pct}%)
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mt-3">
                                <div>
                                    <p className={`v5-mono text-[10px] ${TXT_MUTED}`}>Qty</p>
                                    <p className="v5-mono text-xs mt-0.5">{h.quantity}</p>
                                </div>
                                <div>
                                    <p className={`v5-mono text-[10px] ${TXT_MUTED}`}>Avg</p>
                                    <p className="v5-mono text-xs mt-0.5">{fmtINR(h.avg_price)}</p>
                                </div>
                                <div>
                                    <p className={`v5-mono text-[10px] ${TXT_MUTED}`}>LTP</p>
                                    <p className="v5-mono text-xs mt-0.5">{fmtINR(h.current_price)}</p>
                                </div>
                                <div>
                                    <p className={`v5-mono text-[10px] ${TXT_MUTED}`}>Invested</p>
                                    <p className="v5-mono text-xs mt-0.5">{fmtINR(h.invested)}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* sm and up: full table */}
            <div className="v5-card hidden sm:block overflow-x-auto rounded-xl text-white">
                <table className={`w-full text-left text-sm ${TXT}`}>
                    <thead>
                        <tr
                            className={`v5-mono text-xs ${TXT_MUTED}`}
                            style={{ borderBottom: `1px solid ${BORDER}` }}
                        >
                            <th className="px-4 py-3 font-normal whitespace-nowrap">Symbol</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap">Qty</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap">Avg Price</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap">LTP</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap">Invested</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap">P&amp;L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {holdings.map((h) => {
                            const isUp = h.pnl >= 0;
                            return (
                                <tr key={h.symbol} style={{ borderBottom: `1px solid ${BORDER}` }}>
                                    <td className="v5-body px-4 py-3 font-medium whitespace-nowrap">{h.symbol}</td>
                                    <td className="v5-mono px-4 py-3 whitespace-nowrap">{h.quantity}</td>
                                    <td className="v5-mono px-4 py-3 whitespace-nowrap">{fmtINR(h.avg_price)}</td>
                                    <td className="v5-mono px-4 py-3 whitespace-nowrap">{fmtINR(h.current_price)}</td>
                                    <td className="v5-mono px-4 py-3 whitespace-nowrap">{fmtINR(h.invested)}</td>
                                    <td
                                        className="v5-mono px-4 py-3 font-medium text-white/85 whitespace-nowrap"
                                        style={{ color: isUp ? EMERALD : ROSE }}
                                    >
                                        <span className="flex items-center gap-1">
                                            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {fmtINR(h.pnl)} ({h.pnl_pct}%)
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function OrdersTable({ orders }) {
    if (!orders.length) {
        return (
            <div className="v5-card rounded-xl p-6 text-center text-white/85">
                <p className={`v5-body text-sm ${TXT_MUTED}`}>No orders placed yet.</p>
            </div>
        );
    }

    return (
        <>
            {/* Mobile: stacked cards */}
            <div className="space-y-2 sm:hidden">
                {orders.map((o) => (
                    <div key={o.id} className="v5-card rounded-xl p-3.5">
                        <div className="flex items-center justify-between">
                            <span className="v5-body font-medium text-sm text-white/90">{o.symbol}</span>
                            <span
                                className="v5-mono inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                                style={{
                                    background:
                                        o.side === "buy" ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                                    color: o.side === "buy" ? EMERALD : ROSE,
                                }}
                            >
                                {o.side === "buy" ? (
                                    <ArrowUpRight size={11} />
                                ) : (
                                    <ArrowDownRight size={11} />
                                )}
                                {o.side}
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-3">
                            <div>
                                <p className={`v5-mono text-[10px] ${TXT_MUTED}`}>Qty</p>
                                <p className="v5-mono text-xs mt-0.5">{o.quantity}</p>
                            </div>
                            <div>
                                <p className={`v5-mono text-[10px] ${TXT_MUTED}`}>Price</p>
                                <p className="v5-mono text-xs mt-0.5">{fmtINR(o.price)}</p>
                            </div>
                            <div>
                                <p className={`v5-mono text-[10px] ${TXT_MUTED}`}>Type</p>
                                <p className={`v5-mono text-xs mt-0.5 ${TXT_MUTED}`}>{o.order_type}</p>
                            </div>
                            <div>
                                <p className={`v5-mono text-[10px] ${TXT_MUTED}`}>Status</p>
                                <p className={`v5-mono text-xs mt-0.5 ${TXT_MUTED}`}>{o.status}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* sm and up: full table */}
            <div className="v5-card hidden sm:block overflow-x-auto rounded-xl text-white/85">
                <table className={`w-full text-left text-sm ${TXT}`}>
                    <thead>
                        <tr
                            className={`v5-mono text-xs ${TXT_MUTED}`}
                            style={{ borderBottom: `1px solid ${BORDER}` }}
                        >
                            <th className="px-4 py-3 font-normal whitespace-nowrap">Symbol</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap">Side</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap">Qty</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap">Price</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap">Type</th>
                            <th className="px-4 py-3 font-normal whitespace-nowrap">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <tr key={o.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                                <td className="v5-body px-4 py-3 font-medium whitespace-nowrap">{o.symbol}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span
                                        className="v5-mono inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                                        style={{
                                            background:
                                                o.side === "buy" ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                                            color: o.side === "buy" ? EMERALD : ROSE,
                                        }}
                                    >
                                        {o.side === "buy" ? (
                                            <ArrowUpRight size={11} />
                                        ) : (
                                            <ArrowDownRight size={11} />
                                        )}
                                        {o.side}
                                    </span>
                                </td>
                                <td className="v5-mono px-4 py-3 whitespace-nowrap">{o.quantity}</td>
                                <td className="v5-mono px-4 py-3 whitespace-nowrap">{fmtINR(o.price)}</td>
                                <td className={`v5-mono px-4 py-3 whitespace-nowrap ${TXT_MUTED}`}>{o.order_type}</td>
                                <td className={`v5-mono px-4 py-3 whitespace-nowrap ${TXT_MUTED}`}>{o.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
function StockChartCard({ symbol, onSelectSymbol }) {
    const [timeframe, setTimeframe] = useState("1M");
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [quote, setQuote] = useState(null);
    const [error, setError] = useState("");
    const [prediction, setPrediction] = useState(null);
    const [loadingPred, setLoadingPred] = useState(false);

    const TF_CONFIG = {
        "1D": { interval: "5min", outputsize: 78 },
        "1W": { interval: "15min", outputsize: 100 },
        "1M": { interval: "1day", outputsize: 30 },
        "1Y": { interval: "1day", outputsize: 252 },
    };

    const loadPrediction = useCallback(async () => {
        if (!symbol) return;
        setLoadingPred(true);
        try {
            const { data: { session } } = await (await import("../services/supabaseClient")).supabase.auth.getSession();
            const token = session?.access_token;
            const res = await getAIStockPrediction(symbol, token);
            setPrediction(res);
        } catch (err) {
            console.error("AI prediction error:", err);
            setPrediction(null);
        } finally {
            setLoadingPred(false);
        }
    }, [symbol]);

    const loadChartAndQuote = useCallback(async () => {
        if (!symbol) return;
        setLoading(true);
        setError("");
        try {
            const config = TF_CONFIG[timeframe] || TF_CONFIG["1M"];
            const [history, liveQuote] = await Promise.all([
                getStockHistory(symbol, config.interval, config.outputsize),
                getStockQuote(symbol).catch(() => null),
            ]);

            setQuote(liveQuote);

            if (Array.isArray(history) && history.length > 0) {
                const formatted = history.map((item) => {
                    let displayTime = item.datetime || "";
                    if (timeframe === "1D") {
                        displayTime = item.datetime.includes(" ") ? item.datetime.split(" ")[1] : item.datetime;
                    } else if (timeframe === "1W") {
                        // e.g. "2026-08-18 09:15" -> "08/18 09:15"
                        const parts = item.datetime.split(" ");
                        const dParts = parts[0].split("-");
                        displayTime = `${dParts[1]}/${dParts[2]}${parts[1] ? " " + parts[1] : ""}`;
                    } else {
                        // 1M or 1Y -> "MM/DD"
                        const parts = item.datetime.split(" ")[0].split("-");
                        displayTime = parts.length === 3 ? `${parts[1]}/${parts[2]}` : item.datetime;
                    }

                    return {
                        time: displayTime,
                        fullDate: item.datetime,
                        price: Number(item.close || item.price || 0),
                    };
                });
                setChartData(formatted);
            } else {
                setChartData([]);
            }
        } catch (err) {
            console.error("Failed to load chart:", err);
            setError("Could not load price chart for " + symbol);
        } finally {
            setLoading(false);
        }
    }, [symbol, timeframe]);

    useEffect(() => {
        loadChartAndQuote();
    }, [loadChartAndQuote]);

    useEffect(() => {
        loadPrediction();
    }, [loadPrediction]);

    if (!symbol) {
        return (
            <div className="v5-card rounded-xl p-6 sm:p-8 text-center text-white/85">
                <BarChart2 size={32} className="mx-auto mb-2 opacity-30 text-emerald-400" />
                <p className="v5-display text-base font-medium text-white/80">Interactive Stock Chart</p>
                <p className={`v5-body text-xs mt-1 ${TXT_MUTED}`}>
                    Search and select any stock symbol in the order ticket to analyze live price charts & technical trends.
                </p>
            </div>
        );
    }

    const firstPrice = chartData[0]?.price || quote?.prev_close || quote?.price || 0;
    const lastPrice = chartData[chartData.length - 1]?.price || quote?.price || 0;
    const priceDiff = lastPrice - firstPrice;
    const pctDiff = firstPrice > 0 ? (priceDiff / firstPrice) * 100 : 0;
    const isUp = priceDiff >= 0;
    const strokeColor = isUp ? EMERALD : ROSE;
    const gradientId = `colorPrice_${symbol.replace(/[^a-zA-Z0-9]/g, "")}`;

    return (
        <div className="v5-card rounded-xl p-3 sm:p-5 space-y-4">
            {/* Header / Info bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor: BORDER }}>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <h3 className="v5-display text-lg font-bold text-white/90 shrink-0">{symbol}</h3>
                        {quote?.name && (
                            <span className="v5-body text-xs text-white/50 truncate max-w-[110px] xs:max-w-[160px] sm:max-w-[200px]">
                                {quote.name}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                        <span className="v5-mono text-lg sm:text-xl font-bold text-white">
                            {fmtINR(quote?.price || lastPrice)}
                        </span>
                        <span
                            className="v5-mono text-xs font-medium flex items-center gap-0.5"
                            style={{ color: strokeColor }}
                        >
                            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {priceDiff >= 0 ? "+" : ""}
                            {priceDiff.toFixed(2)} ({pctDiff >= 0 ? "+" : ""}
                            {pctDiff.toFixed(2)}%)
                        </span>
                    </div>
                </div>

                {/* Timeframe Selector */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border shrink-0" style={{ borderColor: BORDER }}>
                    {Object.keys(TF_CONFIG).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className="v5-mono text-xs px-2 sm:px-2.5 py-1 rounded transition-colors"
                            style={{
                                background: timeframe === tf ? "rgba(16,185,129,0.2)" : "transparent",
                                color: timeframe === tf ? EMERALD : "rgba(255,255,255,0.5)",
                                fontWeight: timeframe === tf ? 600 : 400,
                            }}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Body */}
            {loading ? (
                <div className="h-48 sm:h-64 flex items-center justify-center">
                    <Activity size={24} className="animate-spin text-emerald-400 opacity-60" />
                </div>
            ) : error ? (
                <div className="h-48 sm:h-64 flex items-center justify-center text-xs text-rose-400 text-center px-4">
                    <AlertTriangle size={14} className="mr-1.5 shrink-0" /> {error}
                </div>
            ) : chartData.length === 0 ? (
                <div className="h-48 sm:h-64 flex items-center justify-center text-xs text-white/40 text-center px-4">
                    No historical chart data found for {symbol}
                </div>
            ) : (
                <div className="h-48 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="time"
                                stroke="rgba(255,255,255,0.3)"
                                fontSize={10}
                                tickLine={false}
                                minTickGap={20}
                            />
                            <YAxis
                                domain={["auto", "auto"]}
                                stroke="rgba(255,255,255,0.3)"
                                fontSize={10}
                                tickLine={false}
                                width={44}
                                tickFormatter={(val) => `₹${val}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: "#0e1622",
                                    borderColor: BORDER,
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    color: "#fff",
                                }}
                                formatter={(val) => [fmtINR(val), "Price"]}
                                labelFormatter={(label, items) => items[0]?.payload?.fullDate || label}
                            />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke={strokeColor}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#${gradientId})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* AI Prediction & Signal Engine Card */}
            <div
                className="rounded-xl p-3 sm:p-4 border"
                style={{
                    background: "rgba(16,185,129,0.03)",
                    borderColor: "rgba(16,185,129,0.18)",
                }}
            >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-emerald-400 shrink-0" />
                        <h4 className="v5-display text-sm font-semibold text-white/90">
                            xAI Grok Prediction &amp; Signals
                        </h4>
                    </div>
                    {prediction?.sentiment && (
                        <span
                            className="v5-mono text-xs px-2.5 py-0.5 rounded-full font-medium"
                            style={{
                                background:
                                    prediction.sentiment === "Bullish"
                                        ? "rgba(16,185,129,0.15)"
                                        : prediction.sentiment === "Bearish"
                                        ? "rgba(244,63,94,0.15)"
                                        : "rgba(245,158,11,0.15)",
                                color:
                                    prediction.sentiment === "Bullish"
                                        ? EMERALD
                                        : prediction.sentiment === "Bearish"
                                        ? ROSE
                                        : AMBER,
                            }}
                        >
                            {prediction.sentiment} ({prediction.confidence_pct}% Conf.)
                        </span>
                    )}
                </div>

                {loadingPred ? (
                    <p className="v5-body text-xs text-white/40 animate-pulse">Running AI pattern &amp; technical indicator check...</p>
                ) : prediction ? (
                    <div className="space-y-3">
                        <p className="v5-body text-xs text-white/70 leading-relaxed">
                            {prediction.timeframe_outlook}
                        </p>

                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3 pt-1">
                            <div className="bg-white/5 p-2.5 rounded-lg border" style={{ borderColor: BORDER }}>
                                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                                    <Target size={13} />
                                    <span>1-W Target Price</span>
                                </div>
                                <p className="v5-mono text-sm font-bold text-white mt-1">
                                    {fmtINR(prediction.price_target_1w)}
                                </p>
                            </div>
                            <div className="bg-white/5 p-2.5 rounded-lg border" style={{ borderColor: BORDER }}>
                                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-mono">
                                    <ShieldAlert size={13} />
                                    <span>Stop Loss Limit</span>
                                </div>
                                <p className="v5-mono text-sm font-bold text-white mt-1">
                                    {fmtINR(prediction.stop_loss)}
                                </p>
                            </div>
                        </div>

                        {prediction.signals?.length > 0 && (
                            <div className="pt-1">
                                <p className="v5-mono text-[11px] text-white/40 mb-1">Key Technical Drivers:</p>
                                <ul className="space-y-1">
                                    {prediction.signals.map((sig, idx) => (
                                        <li key={idx} className="v5-body text-[11px] text-white/60 flex items-start gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                            <span>{sig}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="v5-body text-xs text-white/50">
                            Please sign in or refresh to generate live AI technical predictions.
                        </p>
                        <button
                            onClick={loadPrediction}
                            className="v5-mono text-xs text-emerald-400 underline hover:text-emerald-300"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function OrderForm({ selectedSymbol, onSelectSymbol, onOrderPlaced }) {
    const [symbol, setSymbol] = useState(selectedSymbol || "");
    const [side, setSide] = useState("buy");
    const [orderType, setOrderType] = useState("market");
    const [quantity, setQuantity] = useState("");
    const [limitPrice, setLimitPrice] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Keep internal input synced if parent updates selectedSymbol
    useEffect(() => {
        if (selectedSymbol && selectedSymbol !== symbol) {
            setSymbol(selectedSymbol);
            setSearchQuery(selectedSymbol);
        }
    }, [selectedSymbol]);

    // Stock search autocomplete
    const [searchQuery, setSearchQuery] = useState(selectedSymbol || "");
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searching, setSearching] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const debounceTimer = useRef(null);
    const wrapperRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search
    function handleSymbolInput(e) {
        const val = e.target.value;
        setSearchQuery(val);
        setSymbol(val);
        setHighlightIndex(-1);

        clearTimeout(debounceTimer.current);
        if (val.trim().length < 2) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }
        debounceTimer.current = setTimeout(async () => {
            setSearching(true);
            try {
                const results = await searchStocks(val.trim());
                setSuggestions(results || []);
                setShowDropdown(true);
            } catch {
                setSuggestions([]);
            } finally {
                setSearching(false);
            }
        }, 300);
    }

    function pickSuggestion(s) {
        // Strip exchange suffix like /NSE if present
        const sym = (s.symbol || "").split("/")[0].split(":")[0].trim();
        setSymbol(sym);
        setSearchQuery(sym);
        onSelectSymbol(sym.toUpperCase());
        setSuggestions([]);
        setShowDropdown(false);
    }

    function handleKeyDown(e) {
        if (!showDropdown || !suggestions.length) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && highlightIndex >= 0) {
            e.preventDefault();
            pickSuggestion(suggestions[highlightIndex]);
        } else if (e.key === "Escape") {
            setShowDropdown(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!symbol.trim()) return setError("Enter a symbol, e.g. RELIANCE");
        if (!quantity || Number(quantity) <= 0) return setError("Enter a valid quantity");
        if (orderType === "limit" && (!limitPrice || Number(limitPrice) <= 0)) {
            return setError("Enter a valid limit price");
        }

        setSubmitting(true);
        try {
            await placePaperOrder({
                symbol: symbol.trim().toUpperCase(),
                side,
                orderType,
                quantity: Number(quantity),
                limitPrice: orderType === "limit" ? Number(limitPrice) : undefined,
            });
            onOrderPlaced();
        } catch (err) {
            setError(err.message || "Order failed");
        } finally {
            setSubmitting(false);
        }
    }

    const inputClasses = `v5-body w-full rounded-lg px-3 py-2 text-sm ${TXT} outline-none placeholder:text-white/30`;

    return (
        <form onSubmit={handleSubmit} className="v5-card space-y-4 rounded-xl p-4 sm:p-5">
            <div className="flex gap-2">
                {["buy", "sell"].map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setSide(s)}
                        className="v5-mono flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors"
                        style={{
                            background: side === s ? (s === "buy" ? EMERALD : ROSE) : "transparent",
                            color: side === s ? INK : "rgba(255,255,255,0.5)",
                            border: `1px solid ${side === s ? "transparent" : BORDER}`,
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Symbol search with autocomplete */}
            <div ref={wrapperRef} style={{ position: "relative" }}>
                <label className={`v5-mono mb-1 block text-xs ${TXT_MUTED}`}>Symbol</label>
                <div style={{ position: "relative" }}>
                    <Search
                        size={14}
                        style={{
                            position: "absolute",
                            left: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "rgba(255,255,255,0.3)",
                            pointerEvents: "none",
                        }}
                    />
                    <input
                        value={searchQuery}
                        onChange={handleSymbolInput}
                        onKeyDown={handleKeyDown}
                        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                        placeholder="Search stock, e.g. RELIANCE"
                        autoComplete="off"
                        className={inputClasses}
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${showDropdown ? "rgba(16,185,129,0.4)" : BORDER}`,
                            paddingLeft: "30px",
                            transition: "border-color 0.2s",
                        }}
                    />
                    {searching && (
                        <span
                            style={{
                                position: "absolute",
                                right: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "10px",
                                color: "rgba(255,255,255,0.35)",
                            }}
                        >
                            ...
                        </span>
                    )}
                </div>

                {/* Dropdown */}
                {showDropdown && suggestions.length > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 50,
                            background: "#0e1622",
                            border: `1px solid rgba(16,185,129,0.25)`,
                            borderRadius: "10px",
                            marginTop: "4px",
                            overflow: "hidden",
                            maxHeight: "260px",
                            overflowY: "auto",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        }}
                    >
                        {suggestions.map((s, i) => (
                            <div
                                key={s.symbol}
                                onMouseDown={() => pickSuggestion(s)}
                                style={{
                                    padding: "9px 12px",
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "8px",
                                    borderBottom:
                                        i < suggestions.length - 1
                                            ? `1px solid rgba(255,255,255,0.05)`
                                            : "none",
                                    background:
                                        i === highlightIndex
                                            ? "rgba(16,185,129,0.1)"
                                            : "transparent",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={() => setHighlightIndex(i)}
                                onMouseLeave={() => setHighlightIndex(-1)}
                            >
                                <span
                                    className="v5-mono"
                                    style={{ fontSize: "13px", color: "rgba(255,255,255,0.9)", fontWeight: 500, flexShrink: 0 }}
                                >
                                    {(s.symbol || "").split("/")[0].split(":")[0]}
                                </span>
                                <span
                                    className="v5-body"
                                    style={{
                                        fontSize: "11px",
                                        color: "rgba(255,255,255,0.4)",
                                        maxWidth: "55%",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        textAlign: "right",
                                    }}
                                >
                                    {s.name}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {showDropdown && !searching && suggestions.length === 0 && searchQuery.length >= 2 && (
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 50,
                            background: "#0e1622",
                            border: `1px solid ${BORDER}`,
                            borderRadius: "10px",
                            marginTop: "4px",
                            padding: "10px 12px",
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.35)",
                        }}
                    >
                        No results for "{searchQuery}"
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={`v5-mono mb-1 block text-xs ${TXT_MUTED}`}>Quantity</label>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="10"
                        className={inputClasses}
                        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}
                    />
                </div>
                <div>
                    <label className={`v5-mono mb-1 block text-xs ${TXT_MUTED}`}>Order Type</label>
                    <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        className={inputClasses}
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${BORDER}`,
                            color: "rgba(255,255,255,0.85)",
                        }}
                    >
                        <option
                            value="market"
                            style={{ background: CARD, color: "rgba(255,255,255,0.85)" }}
                        >
                            Market
                        </option>
                        <option
                            value="limit"
                            style={{ background: CARD, color: "rgba(255,255,255,0.85)" }}
                        >
                            Limit
                        </option>
                    </select>
                </div>
            </div>

            {orderType === "limit" && (
                <div>
                    <label className={`v5-mono mb-1 block text-xs ${TXT_MUTED}`}>Limit Price</label>
                    <input
                        type="number"
                        min="0"
                        step="0.05"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder="2450.00"
                        className={inputClasses}
                        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}
                    />
                </div>
            )}

            {error && (
                <p className="v5-body flex items-center gap-1.5 text-xs" style={{ color: ROSE }}>
                    <AlertTriangle size={12} className="shrink-0" />
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={submitting}
                className="v5-mono w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
                style={{ background: side === "buy" ? EMERALD : ROSE, color: INK }}
            >
                {submitting ? "Placing..." : `Place ${side} order`}
            </button>
        </form>
    );
}

export default function PaperTrading() {
    const [account, setAccount] = useState(null);
    const [portfolio, setPortfolio] = useState(null);
    const [holdings, setHoldings] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");

    const loadAll = useCallback(async () => {
        try {
            const [acc, port, hold, ord] = await Promise.all([
                getPaperAccount(),
                getPaperPortfolio(),
                getPaperHoldings(),
                getPaperOrders(),
            ]);
            setAccount(acc);
            setPortfolio(port);
            setHoldings(hold);
            setOrders(ord);
        } catch (err) {
            console.error("Failed to load paper trading data:", err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    async function handleReset() {
        if (!window.confirm("Reset your paper account? This wipes all trades and restores ₹1,00,000.")) {
            return;
        }
        setResetting(true);
        try {
            await resetPaperAccount();
            await loadAll();
        } catch (err) {
            alert(err.message || "Reset failed");
        } finally {
            setResetting(false);
        }
    }

    return (
        <div className={`v5-root min-h-screen flex relative overflow-x-hidden ${TXT}`} style={{ background: INK }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body { font-family: 'Inter', sans-serif; }
        .v5-card { background: ${CARD}; border: 1px solid ${BORDER}; transition: border-color 0.2s ease; }
        .v5-card:hover { border-color: rgba(255,255,255,0.16); }
      `}</style>

            <AmbientBackground opacity={0.13} />
            <Sidebar />

            <main className="flex-1 min-w-0 relative">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-6 lg:py-7 pb-24 lg:pb-7 space-y-6 sm:space-y-8">
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2" style={{ color: EMERALD }}>
                                <Wallet size={18} />
                                <span className="v5-mono text-sm font-medium">Paper Trading</span>
                            </div>
                            <h1 className="v5-display mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold">
                                Practice sandbox
                            </h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {account && !loading && (
                                <span
                                    className="v5-mono flex items-center gap-1.5 text-xs"
                                    style={{ color: account.expired ? ROSE : AMBER }}
                                >
                                    <Clock size={12} className="shrink-0" />
                                    {account.expired
                                        ? "Account expired"
                                        : `${account.days_remaining} days remaining`}
                                </span>
                            )}
                            <button
                                onClick={handleReset}
                                disabled={resetting}
                                className={`v5-mono flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${TXT_MUTED} disabled:opacity-60`}
                                style={{ border: `1px solid ${BORDER}` }}
                            >
                                <RotateCcw size={12} className={resetting ? "animate-spin" : ""} />
                                Reset Account
                            </button>
                            <button
                                onClick={loadAll}
                                className={`v5-mono flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${TXT_MUTED}`}
                                style={{ border: `1px solid ${BORDER}` }}
                            >
                                <RefreshCw size={12} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="v5-card animate-pulse rounded-xl p-8 text-center">
                            <p className={`v5-body text-sm ${TXT_MUTED}`}>Loading your account...</p>
                        </div>
                    ) : (
                        <>
                            {/* Portfolio stats */}
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                <StatCard label="CASH BALANCE" value={fmtINR(portfolio?.balance)} />
                                <StatCard label="INVESTED" value={fmtINR(portfolio?.invested_value)} />
                                <StatCard
                                    label="TOTAL P&L"
                                    value={fmtINR(portfolio?.total_pnl)}
                                    tone={portfolio?.total_pnl >= 0 ? EMERALD : ROSE}
                                    sub={`${portfolio?.overall_return >= 0 ? "+" : ""}${portfolio?.overall_return}% overall`}
                                />
                                <StatCard label="TOTAL PORTFOLIO" value={fmtINR(portfolio?.total_portfolio)} />
                            </div>

                            <div className="grid gap-6 lg:grid-cols-3">
                                <div className="space-y-6 lg:col-span-2">
                                    {/* Interactive Live Stock Chart */}
                                    <section>
                                        <h2 className="v5-display mb-3 text-base font-semibold">Stock Analysis &amp; Chart</h2>
                                        <StockChartCard
                                            symbol={selectedSymbol}
                                            onSelectSymbol={setSelectedSymbol}
                                        />
                                    </section>

                                    <section>
                                        <h2 className="v5-display mb-3 text-base font-semibold">Holdings</h2>
                                        <HoldingsTable holdings={holdings} />
                                    </section>

                                    <section>
                                        <h2 className="v5-display mb-3 text-base font-semibold">Order History</h2>
                                        <OrdersTable orders={orders} />
                                    </section>
                                </div>

                                <div>
                                    <h2 className="v5-display mb-3 text-base font-semibold">Place Order</h2>
                                    <OrderForm
                                        selectedSymbol={selectedSymbol}
                                        onSelectSymbol={setSelectedSymbol}
                                        onOrderPlaced={loadAll}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}