import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WATCHLIST = [
  { symbol: 'RELIANCE', price: '2,945.60', change: '+1.2%', up: true },
  { symbol: 'TCS', price: '3,812.40', change: '-0.4%', up: false },
  { symbol: 'HDFCBANK', price: '1,675.20', change: '+0.8%', up: true },
  { symbol: 'INFY', price: '1,842.90', change: '+0.3%', up: true },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-ink text-bone px-6 py-8 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate text-xs font-mono">Welcome back</p>
          <p className="text-bone">{user?.email ?? 'Trader'}</p>
        </div>
        <button onClick={signOut} className="text-xs text-slate hover:text-coral font-mono">Log out</button>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <p className="text-slate text-xs font-mono mb-1">Portfolio value</p>
        <p className="font-display text-3xl">₹1,24,580.50</p>
        <p className="text-teal text-sm font-mono mt-1">+₹2,340.10 (1.9%) today</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-slate text-xs font-mono">NIFTY 50</p>
          <p className="font-mono text-bone text-lg">24,812.35</p>
          <p className="text-teal text-xs font-mono">▲0.62%</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-slate text-xs font-mono">SENSEX</p>
          <p className="font-mono text-bone text-lg">81,245.10</p>
          <p className="text-teal text-xs font-mono">▲0.58%</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg">Watchlist</h2>
        <Link to="/watchlist" className="text-teal text-xs font-mono">See all</Link>
      </div>
      <div className="space-y-2 mb-8">
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

      <div className="grid grid-cols-3 gap-3">
        <Link to="/portfolio" className="text-center bg-surface border border-border rounded-xl py-3 text-xs font-mono hover:border-teal transition-colors">Portfolio</Link>
        <Link to="/orders" className="text-center bg-surface border border-border rounded-xl py-3 text-xs font-mono hover:border-teal transition-colors">Orders</Link>
        <Link to="/alerts" className="text-center bg-surface border border-border rounded-xl py-3 text-xs font-mono hover:border-teal transition-colors">Alerts</Link>
      </div>
    </div>
  );
}