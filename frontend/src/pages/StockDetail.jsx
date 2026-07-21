import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink text-bone px-6 py-8 pb-24">
      <button onClick={() => navigate(-1)} className="text-slate text-xs font-mono mb-4">← Back</button>

      <h1 className="font-display text-2xl mb-1">{symbol}</h1>
      <p className="font-mono text-3xl mb-1">₹2,945.60</p>
      <p className="text-teal font-mono text-sm mb-6">▲ +35.40 (1.22%) today</p>

      <div className="h-56 bg-surface border border-border rounded-2xl mb-6 flex items-center justify-center text-slate text-xs font-mono">
        Chart component goes here
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-slate text-xs font-mono">Day range</p>
          <p className="font-mono text-sm mt-1">2,910.00 – 2,958.20</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-slate text-xs font-mono">Volume</p>
          <p className="font-mono text-sm mt-1">4.2M</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => navigate(`/order/${symbol}?side=buy`)} className="flex-1 rounded-full bg-teal text-ink font-medium py-3 text-sm">Buy</button>
        <button onClick={() => navigate(`/order/${symbol}?side=sell`)} className="flex-1 rounded-full border border-coral text-coral font-medium py-3 text-sm">Sell</button>
      </div>
    </div>
  );
}