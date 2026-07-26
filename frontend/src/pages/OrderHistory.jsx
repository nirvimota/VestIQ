import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';

// ---------------------------------------------------------------------------
// vestIQ — Transactions v2 (order history)
// Same layout language as Portfolio.jsx: Sidebar + AmbientBackground, zinc
// surfaces, framer-motion sliding filter pill + staggered list reveal.
// Route stays /orders (see AppRoutes.jsx) — file kept as OrderHistory.jsx so
// nothing else needs to change.
//
// Self-contained on purpose — fmtINR is defined right here instead of
// pulled from a shared utils file, so this page has no extra files it
// depends on.
// ---------------------------------------------------------------------------

function fmtINR(n) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ORDERS = [
  { ref: 'ORD10234', symbol: 'RELIANCE', side: 'buy', qty: 10, price: 2780.0, status: 'Filled', time: 'Today, 10:12 AM' },
  { ref: 'ORD10235', symbol: 'TCS', side: 'sell', qty: 2, price: 3820.0, status: 'Pending', time: 'Today, 11:04 AM' },
  { ref: 'ORD10236', symbol: 'INFY', side: 'buy', qty: 5, price: 1840.0, status: 'Rejected', time: 'Today, 11:20 AM' },
  { ref: 'ORD10229', symbol: 'HDFCBANK', side: 'buy', qty: 20, price: 1600.0, status: 'Filled', time: 'Yesterday, 3:41 PM' },
  { ref: 'ORD10221', symbol: 'WIPRO', side: 'sell', qty: 15, price: 298.5, status: 'Filled', time: 'Yesterday, 1:02 PM' },
  { ref: 'ORD10218', symbol: 'ICICIBANK', side: 'buy', qty: 8, price: 1195.0, status: 'Cancelled', time: '2 days ago' },
];

const TABS = ['All', 'Filled', 'Pending', 'Rejected', 'Cancelled'];

const STATUS_STYLE = {
  Filled: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  Pending: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  Rejected: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
  Cancelled: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
};

export default function OrderHistory() {
  const [tab, setTab] = useState('All');

  const filtered = useMemo(
    () => (tab === 'All' ? ORDERS : ORDERS.filter((o) => o.status === tab)),
    [tab]
  );

  const filledValue = useMemo(
    () =>
      ORDERS.filter((o) => o.status === 'Filled').reduce((a, o) => a + o.qty * o.price, 0),
    []
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex relative">
      <AmbientBackground opacity={0.1} />
      <Sidebar />

      <div className="flex-1 min-w-0 relative">
        <div className="max-w-5xl mx-auto px-5 py-8 pb-24">
          {/* Header */}
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-zinc-500 text-xs font-mono tracking-wide uppercase mb-1">Transactions</p>
              <h1 className="text-2xl font-semibold tracking-tight">{ORDERS.length} orders</h1>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 text-xs font-mono uppercase mb-1">Filled value</p>
              <p className="font-mono text-lg">₹{fmtINR(filledValue)}</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="relative flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-lg p-1 mb-6 w-fit overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="relative px-3 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap"
                style={{ color: tab === t ? '#f4f4f5' : '#71717a' }}
              >
                {tab === t && (
                  <motion.div
                    layoutId="orders-tab-pill"
                    className="absolute inset-0 bg-zinc-800 rounded-md"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{t}</span>
              </button>
            ))}
          </div>

          {/* Order list */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl divide-y divide-zinc-800 overflow-hidden">
            <AnimatePresence initial={false}>
              {filtered.map((o, i) => (
                <motion.div
                  key={o.ref}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.03 }}
                  whileHover={{ backgroundColor: 'rgba(39,39,42,0.4)' }}
                  className="flex items-center justify-between gap-4 px-4 py-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        o.side === 'buy' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'
                      }`}
                    >
                      {o.side === 'buy' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-sm">
                        <span className="capitalize">{o.side}</span> {o.symbol}
                      </p>
                      <p className="text-zinc-500 text-[11px] font-mono">
                        {o.qty} qty @ ₹{fmtINR(o.price)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-[11px] font-mono px-2 py-0.5 rounded-full border ${STATUS_STYLE[o.status]}`}
                    >
                      {o.status}
                    </span>
                    <p className="text-zinc-500 text-[11px] font-mono mt-1">
                      {o.ref} · {o.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center text-zinc-500 text-sm font-mono">
                No {tab.toLowerCase()} orders
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}