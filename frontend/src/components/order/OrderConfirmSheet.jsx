import React from 'react';

/**
 * TransactionDetailModal — opens when a user clicks any transaction row
 * (in Transactions.jsx or anywhere else that lists orders).
 *
 * Props:
 *   transaction: {
 *     id, symbol, name, type: 'BUY' | 'SELL' | 'IPO',
 *     qty, price, amount,
 *     status: 'success' | 'pending' | 'terminated',
 *     reason?: string,          // required context when status !== 'success'
 *     date: 'DD MMM YYYY', time: 'hh:mm A',
 *     orderId: string,
 *     timeline?: [{ label, time, done }]   // optional, for a step tracker
 *   }
 *   onClose: () => void
 *
 * Render conditionally in your parent: {selectedTxn && <TransactionDetailModal .../>}
 *
 * Wired from OrderHistory.jsx via toTransaction() — that page's ORDERS only
 * has a single combined `time` string ("Today, 10:12 AM"), not separate
 * date/time fields, so the date/time line below only joins with "·" when
 * both are present, and falls back to whichever one it has otherwise.
 */

const STATUS_META = {
  success: { label: 'Successful', style: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30', icon: '✓' },
  pending: { label: 'Pending', style: 'bg-amber-400/15 text-amber-400 border-amber-400/30', icon: '⏱' },
  terminated: { label: 'Terminated', style: 'bg-rose-400/15 text-rose-400 border-rose-400/30', icon: '✕' },
};

const DEFAULT_REASONS = {
  pending: 'Awaiting exchange confirmation. This usually clears within 15 minutes during market hours.',
  terminated: 'Order rejected by exchange — insufficient margin at time of execution.',
};

const DEFAULT_TXN = {
  id: 'TXN00231',
  symbol: 'TCS',
  name: 'Tata Consultancy Services',
  type: 'SELL',
  qty: 5,
  price: 3812.4,
  amount: 19062.0,
  status: 'terminated',
  reason: DEFAULT_REASONS.terminated,
  date: '18 Jul 2026',
  time: '11:42 AM',
  orderId: 'ORD-88213-XT',
};

function fmt(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TransactionDetailModal({ transaction = DEFAULT_TXN, onClose = () => {} }) {
  const t = transaction;
  const meta = STATUS_META[t.status] || STATUS_META.success;
  const reason = t.reason || DEFAULT_REASONS[t.status];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-mono text-sm text-zinc-500">{t.orderId}</p>
            <h2 className="text-lg font-semibold mt-0.5">
              {t.type} {t.symbol}
            </h2>
            <p className="text-zinc-500 text-xs mt-0.5">{t.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 text-lg leading-none">
            ✕
          </button>
        </div>

        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${meta.style}`}>
          {meta.icon} {meta.label}
        </span>

        {t.status !== 'success' && reason && (
          <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-lg p-3">
            <p className="text-zinc-500 text-[11px] uppercase tracking-wide mb-1">
              Why is this {t.status}?
            </p>
            <p className="text-zinc-300 text-sm leading-relaxed">{reason}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div>
            <p className="text-zinc-500 text-[11px] uppercase tracking-wide">Quantity</p>
            <p className="font-mono text-sm mt-0.5">{t.qty}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-[11px] uppercase tracking-wide">Price / share</p>
            <p className="font-mono text-sm mt-0.5">₹{fmt(t.price)}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-[11px] uppercase tracking-wide">Amount</p>
            <p className="font-mono text-sm mt-0.5">₹{fmt(t.amount)}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-[11px] uppercase tracking-wide">Date &amp; time</p>
            <p className="font-mono text-sm mt-0.5">
              {t.date && t.time ? `${t.date} · ${t.time}` : t.date || t.time}
            </p>
          </div>
        </div>

        {t.timeline && (
          <div className="mt-5 pt-4 border-t border-zinc-800 space-y-3">
            {t.timeline.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${step.done ? 'bg-emerald-400' : 'bg-zinc-700'}`}
                />
                <span className={`text-sm flex-1 ${step.done ? 'text-zinc-200' : 'text-zinc-500'}`}>{step.label}</span>
                <span className="text-zinc-500 text-xs font-mono">{step.time}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}