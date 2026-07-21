import React from 'react';

const ORDERS = [
  { symbol: 'RELIANCE', side: 'buy', qty: 10, price: '2,780.00', status: 'Filled', ref: 'ORD10234', time: '10:12 AM' },
  { symbol: 'TCS', side: 'sell', qty: 2, price: '3,820.00', status: 'Pending', ref: 'ORD10235', time: '11:04 AM' },
  { symbol: 'INFY', side: 'buy', qty: 5, price: '1,840.00', status: 'Rejected', ref: 'ORD10236', time: '11:20 AM' },
];

const statusColor = {
  Filled: 'text-teal',
  Pending: 'text-gold',
  Rejected: 'text-coral',
  Cancelled: 'text-slate',
};

export default function OrderHistory() {
  return (
    <div className="min-h-screen bg-ink text-bone px-6 py-8 pb-24">
      <h1 className="font-display text-xl mb-6">Orders</h1>
      <div className="space-y-2">
        {ORDERS.map((o) => (
          <div key={o.ref} className="bg-surface border border-border rounded-xl px-4 py-3">
            <div className="flex justify-between font-mono text-sm">
              <span className="capitalize">{o.side} {o.symbol}</span>
              <span className={statusColor[o.status]}>{o.status}</span>
            </div>
            <div className="flex justify-between font-mono text-xs text-slate mt-1">
              <span>{o.qty} qty @ ₹{o.price}</span>
              <span>{o.ref} · {o.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}