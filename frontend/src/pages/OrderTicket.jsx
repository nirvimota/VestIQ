import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

export default function OrderTicket() {
  const { symbol } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const side = searchParams.get('side') === 'sell' ? 'sell' : 'buy';

  const [orderType, setOrderType] = useState('market');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState('2945.60');
  const [submitted, setSubmitted] = useState(false);

  const handleConfirm = (e) => {
    e.preventDefault();
    // TODO: wire to orderApi.js -> POST /api/orders (margin/balance check + placement)
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-ink text-bone flex flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-teal text-sm mb-2">Order placed</p>
        <h1 className="font-display text-xl mb-4">{side === 'buy' ? 'Buy' : 'Sell'} {qty} {symbol}</h1>
        <p className="text-slate text-sm mb-8">
          Status: <span className="font-mono text-bone">Pending</span> — track it from Orders.
        </p>
        <button onClick={() => navigate('/orders')} className="rounded-full bg-gold text-ink font-medium px-6 py-2.5 text-sm">View orders</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleConfirm} className="min-h-screen bg-ink text-bone px-6 py-8 pb-24">
      <button type="button" onClick={() => navigate(-1)} className="text-slate text-xs font-mono mb-4">← Back</button>

      <h1 className="font-display text-xl mb-1">{side === 'buy' ? 'Buy' : 'Sell'} {symbol}</h1>
      <p className="text-slate text-sm mb-6">LTP ₹2,945.60</p>

      <div className="flex gap-2 mb-5">
        {['market', 'limit', 'stop-loss'].map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setOrderType(t)}
            className={`flex-1 rounded-full py-2 text-xs font-mono capitalize border ${orderType === t ? 'bg-gold text-ink border-gold' : 'border-border text-slate'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <label className="block text-xs text-slate mb-1">Quantity</label>
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        className="w-full mb-4 rounded-lg bg-surface border border-border px-3 py-2 text-bone text-sm outline-none focus:border-teal font-mono"
      />

      {orderType !== 'market' && (
        <>
          <label className="block text-xs text-slate mb-1">{orderType === 'limit' ? 'Limit price' : 'Trigger price'}</label>
          <input
            type="number"
            step="0.05"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full mb-4 rounded-lg bg-surface border border-border px-3 py-2 text-bone text-sm outline-none focus:border-teal font-mono"
          />
        </>
      )}

      <div className="bg-surface border border-border rounded-xl p-4 mb-6 text-sm font-mono">
        <div className="flex justify-between text-slate">
          <span>Available balance</span>
          <span className="text-bone">₹48,210.00</span>
        </div>
        <div className="flex justify-between text-slate mt-1">
          <span>Estimated {side === 'buy' ? 'cost' : 'proceeds'}</span>
          <span className="text-bone">₹{(qty * parseFloat(price || 0)).toFixed(2)}</span>
        </div>
      </div>

      <button type="submit" className={`w-full rounded-full font-medium py-3 text-sm ${side === 'buy' ? 'bg-teal text-ink' : 'bg-coral text-ink'}`}>
        Confirm {side === 'buy' ? 'buy' : 'sell'} order
      </button>
    </form>
  );
}