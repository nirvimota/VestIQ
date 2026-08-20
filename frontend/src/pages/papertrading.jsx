import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
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
        <div className="v5-card rounded-xl p-4">
            <p className={`v5-mono text-xs ${TXT_MUTED}`}>{label}</p>
            <p
                className="v5-display mt-1 text-xl font-semibold"
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
        <div className="v5-card overflow-x-auto rounded-xl text-white">
            <table className={`w-full text-left text-sm ${TXT}`}>
                <thead>
                    <tr
                        className={`v5-mono text-xs ${TXT_MUTED}`}
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                    >
                        <th className="px-4 py-3 font-normal">Symbol</th>
                        <th className="px-4 py-3 font-normal">Qty</th>
                        <th className="px-4 py-3 font-normal">Avg Price</th>
                        <th className="px-4 py-3 font-normal">LTP</th>
                        <th className="px-4 py-3 font-normal">Invested</th>
                        <th className="px-4 py-3 font-normal">P&amp;L</th>
                    </tr>
                </thead>
                <tbody>
                    {holdings.map((h) => {
                        const isUp = h.pnl >= 0;
                        return (
                            <tr key={h.symbol} style={{ borderBottom: `1px solid ${BORDER}` }}>
                                <td className="v5-body px-4 py-3 font-medium">{h.symbol}</td>
                                <td className="v5-mono px-4 py-3">{h.quantity}</td>
                                <td className="v5-mono px-4 py-3">{fmtINR(h.avg_price)}</td>
                                <td className="v5-mono px-4 py-3">{fmtINR(h.current_price)}</td>
                                <td className="v5-mono px-4 py-3">{fmtINR(h.invested)}</td>
                                <td
                                    className="v5-mono px-4 py-3 font-medium text-white/85"
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
        <div className="v5-card overflow-x-auto rounded-xl text-white/85">
            <table className={`w-full text-left text-sm ${TXT}`}>
                <thead>
                    <tr
                        className={`v5-mono text-xs ${TXT_MUTED}`}
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                    >
                        <th className="px-4 py-3 font-normal">Symbol</th>
                        <th className="px-4 py-3 font-normal">Side</th>
                        <th className="px-4 py-3 font-normal">Qty</th>
                        <th className="px-4 py-3 font-normal">Price</th>
                        <th className="px-4 py-3 font-normal">Type</th>
                        <th className="px-4 py-3 font-normal">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((o) => (
                        <tr key={o.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                            <td className="v5-body px-4 py-3 font-medium">{o.symbol}</td>
                            <td className="px-4 py-3">
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
                            <td className="v5-mono px-4 py-3">{o.quantity}</td>
                            <td className="v5-mono px-4 py-3">{fmtINR(o.price)}</td>
                            <td className={`v5-mono px-4 py-3 ${TXT_MUTED}`}>{o.order_type}</td>
                            <td className={`v5-mono px-4 py-3 ${TXT_MUTED}`}>{o.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function OrderForm({ onOrderPlaced }) {
    const [symbol, setSymbol] = useState("");
    const [side, setSide] = useState("buy");
    const [orderType, setOrderType] = useState("market");
    const [quantity, setQuantity] = useState("");
    const [limitPrice, setLimitPrice] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

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
            setSymbol("");
            setQuantity("");
            setLimitPrice("");
            onOrderPlaced();
        } catch (err) {
            setError(err.message || "Order failed");
        } finally {
            setSubmitting(false);
        }
    }

    const inputClasses = `v5-body w-full rounded-lg px-3 py-2 text-sm ${TXT} outline-none placeholder:text-white/30`;

    return (
        <form onSubmit={handleSubmit} className="v5-card space-y-4 rounded-xl p-5">
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

            <div>
                <label className={`v5-mono mb-1 block text-xs ${TXT_MUTED}`}>Symbol</label>
                <input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="e.g. RELIANCE"
                    className={inputClasses}
                    style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}
                />
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
                    <AlertTriangle size={12} />
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
        <div className={`v5-root min-h-screen flex relative ${TXT}`} style={{ background: INK }}>
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
                <div className="max-w-6xl mx-auto px-6 lg:px-10 py-7 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2" style={{ color: EMERALD }}>
                                <Wallet size={18} />
                                <span className="v5-mono text-sm font-medium">Paper Trading</span>
                            </div>
                            <h1 className="v5-display mt-1 text-2xl font-semibold sm:text-3xl">
                                Practice sandbox
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            {account && !loading && (
                                <span
                                    className="v5-mono flex items-center gap-1.5 text-xs"
                                    style={{ color: account.expired ? ROSE : AMBER }}
                                >
                                    <Clock size={12} />
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
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                                    <OrderForm onOrderPlaced={loadAll} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}