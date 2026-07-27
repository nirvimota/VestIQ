import React, { useEffect, useState } from 'react';

/**
 * LiveMarket — browse all tradable stocks with simulated live price ticks.
 *
 * Props:
 *   stocks: [{ symbol, name, ltp, prevClose }]
 *   watchlistSymbols: Set<string> | string[]   // symbols already watchlisted
 *   onSelectStock: (stock) => void             // navigate to StockDetail
 *   onQuickBuy: (stock) => void                // opens buy flow / quick-buy
 *   onToggleWatchlist: (stock) => void
 *
 * Price ticking here is a local visual simulation (setInterval nudging
 * values) purely so the page doesn't look static — replace the interval
 * with your real live-price subscription (websocket/polling) and just feed
 * updated `stocks` down as props; the rendering logic doesn't change.
 */

const DEFAULT_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 2945.6, prevClose: 2895.2 },
  { symbol: 'TCS', name: 'Tata Consultancy', ltp: 3812.4, prevClose: 3848.1 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', ltp: 1675.2, prevClose: 1651.0 },
  { symbol: 'INFY', name: 'Infosys', ltp: 1462.1, prevClose: 1490.0 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', ltp: 1188.35, prevClose: 1203.3 },
  { symbol: 'SBIN', name: 'State Bank of India', ltp: 824.6, prevClose: 807.5 },
  { symbol: 'ITC', name: 'ITC Ltd', ltp: 462.9, prevClose: 465.8 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', ltp: 968.4, prevClose: 928.1 },
];

function fmt(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LiveMarket({
  stocks: initialStocks = DEFAULT_STOCKS,
  watchlistSymbols = [],
  onSelectStock = () => {},
  onQuickBuy = () => {},
  onToggleWatchlist = () => {},
}) {
  const [stocks, setStocks] = useState(initialStocks);
  const watchSet = new Set(watchlistSymbols);

  // Local visual tick simulation — swap for a real feed in production.
  useEffect(() => {
    const id = setInterval(() => {
      setStocks((prev) =>
        prev.map((s) => ({
          ...s,
          ltp: Math.max(1, s.ltp + (Math.random() - 0.5) * (s.ltp * 0.002)),
        }))
      );
    }, 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <div className="max-w-3xl mx-auto px-5 py-6 pb-16">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold tracking-tight">Live Market</h1>
          <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
          </span>
        </div>
        <p className="text-zinc-500 text-sm mb-5">NSE · Updated every few seconds</p>

        <div className="space-y-2">
          {stocks.map((s) => {
            const chg = s.ltp - s.prevClose;
            const chgPct = (chg / s.prevClose) * 100;
            const up = chg >= 0;
            const watchlisted = watchSet.has(s.symbol);

            return (
              <div
                key={s.symbol}
                className="flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 hover:border-zinc-700 transition-colors"
              >
                <button onClick={() => onSelectStock(s)} className="flex-1 min-w-0 text-left flex items-center gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium">{s.symbol}</p>
                    <p className="text-zinc-500 text-[11px] truncate">{s.name}</p>
                  </div>
                </button>

                <div className="text-right shrink-0 w-28">
                  <p className="font-mono text-sm">₹{fmt(s.ltp)}</p>
                  <p className={`font-mono text-[11px] ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {up ? '+' : ''}
                    {chgPct.toFixed(2)}%
                  </p>
                </div>

                <button
                  onClick={() => onToggleWatchlist(s)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    watchlisted ? 'border-amber-400/40 text-amber-400 bg-amber-400/10' : 'border-zinc-800 text-zinc-500 hover:text-zinc-200'
                  }`}
                  title="Add to watchlist"
                >
                  {watchlisted ? '★' : '☆'}
                </button>

                <button
                  onClick={() => onQuickBuy(s)}
                  className="px-3.5 py-2 rounded-lg bg-emerald-400 text-zinc-950 text-xs font-semibold hover:bg-emerald-300 transition-colors shrink-0"
                >
                  Buy
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}