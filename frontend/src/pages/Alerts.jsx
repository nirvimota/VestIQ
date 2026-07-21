import React from 'react';

const ALERTS = [
  { title: 'RELIANCE crossed ₹2,900', time: '2m ago' },
  { title: 'Order filled: BUY 10 HDFCBANK', time: '1h ago' },
  { title: 'Margin shortfall on open positions', time: 'Yesterday' },
  { title: 'New login from Chrome on Windows', time: 'Yesterday' },
];

export default function Alerts() {
  return (
    <div className="min-h-screen bg-ink text-bone px-6 py-8 pb-24">
      <h1 className="font-display text-xl mb-6">Alerts</h1>
      <div className="space-y-2">
        {ALERTS.map((a, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl px-4 py-3">
            <p className="text-sm">{a.title}</p>
            <p className="font-mono text-xs text-slate mt-1">{a.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}