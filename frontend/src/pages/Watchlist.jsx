import React from 'react';
import { Link } from 'react-router-dom';

const WATCHLIST = [
  { symbol: 'RELIANCE', price: '2,945.60', change: '+1.2%', up: true },
  { symbol: 'TCS', price: '3,812.40', change: '-0.4%', up: false },
  { symbol: 'HDFCBANK', price: '1,675.20', change: '+0.8%', up: true },
  { symbol: 'INFY', price: '1,842.90', change: '+0.3%', up: true },
  { symbol: 'ICICIBANK', price: '1,298.75', change: '+0.9%', up: true },
];

export default function Watchlist() {
  return (
    <div className="min-h-screen bg-ink text-bone px-6 py-8 pb-24">
      <h1 className="font-display text-xl mb-6">Watchlist</h1>
      <div className="space-y-2">
        {WATCHLIST.map((s) => (
          <Link
            to={`/stock/${s.symbol}`}
            key={s.symbol}
            className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 hover:border-teal transition-colors"
          >
            <span className="font-mono text-sm">{s.symbol}</span>
            <div className="text-right">
              <p className="font-mono text-sm">{s.price}</p>
              <p className={`font-mono text-xs ${s.up ? 'text-teal' : 'text-coral'}`}>{s.change}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}