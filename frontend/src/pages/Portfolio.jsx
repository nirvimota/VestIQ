import React from 'react';

const HOLDINGS = [
  { symbol: 'RELIANCE', qty: 10, avg: '2,780.00', ltp: '2,945.60', pnl: '+1,656.00', up: true },
  { symbol: 'TCS', qty: 5, avg: '3,900.00', ltp: '3,812.40', pnl: '-438.00', up: false },
  { symbol: 'HDFCBANK', qty: 20, avg: '1,600.00', ltp: '1,675.20', pnl: '+1,504.00', up: true },
];

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-ink text-bone px-6 py-8 pb-24">
      <h1 className="font-display text-xl mb-6">Portfolio</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-slate text-xs font-mono">Available funds</p>
          <p className="font-mono text-lg mt-1">₹48,210.00</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-slate text-xs font-mono">Blocked margin</p>
          <p className="font-mono text-lg mt-1">₹6,540.00</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 mb-8">
        <p className="text-slate text-xs font-mono">Total P&amp;L</p>
        <p className="font-mono text-2xl text-teal mt-1">+₹2,722.00</p>
      </div>

      <h2 className="font-display text-lg mb-3">Holdings</h2>
      <div className="space-y-2">
        {HOLDINGS.map((h) => (
          <div key={h.symbol} className="bg-surface border border-border rounded-xl px-4 py-3">
            <div className="flex justify-between font-mono text-sm">
              <span>{h.symbol}</span>
              <span>{h.qty} qty</span>
            </div>
            <div className="flex justify-between font-mono text-xs text-slate mt-1">
              <span>Avg ₹{h.avg} · LTP ₹{h.ltp}</span>
              <span className={h.up ? 'text-teal' : 'text-coral'}>{h.pnl}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}