import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';

// ---------------------------------------------------------------------------
// vestIQ — Funds & IPO v2
// Same layout language as Portfolio.jsx / OrderHistory.jsx: Sidebar +
// AmbientBackground, zinc-950/900 surfaces, font-mono uppercase eyebrow
// labels, framer-motion sliding filter pill for the IPO status tabs and a
// staggered reveal on the IPO list. This is what Portfolio's "Funds & IPO"
// quick-access card links to (route: /funds-ipo).
// ---------------------------------------------------------------------------

function fmtINR(n) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });}


const FUNDS = {
  available: 42850.75,
  usedMargin: 18200.0,
  pendingWithdrawal: 0,
};

const IPOS = [
  {
    id: 'ipo1',
    company: 'Nova Renewables Ltd',
    status: 'Open',
    priceBand: '₹412 – ₹436',
    lot: 34,
    subscribed: 2.4,
    closes: 'Closes in 2 days',
  },
  {
    id: 'ipo2',
    company: 'Kestrel Logistics',
    status: 'Open',
    priceBand: '₹88 – ₹94',
    lot: 160,
    subscribed: 0.8,
    closes: 'Closes tomorrow',
  },
  {
    id: 'ipo3',
    company: 'Bharat FinTech Solutions',
    status: 'Upcoming',
    priceBand: '₹210 – ₹225',
    lot: 65,
    subscribed: null,
    closes: 'Opens in 5 days',
  },
  {
    id: 'ipo4',
    company: 'Orion Specialty Chemicals',
    status: 'Closed',
    priceBand: '₹560 – ₹590',
    lot: 25,
    subscribed: 6.1,
    closes: 'Listed · +12.4% on debut',
  },
];

const TABS = ['Open', 'Upcoming', 'Closed'];

const STATUS_STYLE = {
  Open: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  Upcoming: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  Closed: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
};

export default function FundsIPO() {
  const [tab, setTab] = useState('Open');

  const filtered = useMemo(() => IPOS.filter((i) => i.status === tab), [tab]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex relative">
      <AmbientBackground opacity={0.1} />
      <Sidebar />

      <div className="flex-1 min-w-0 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 py-6 lg:py-8 pb-24">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-zinc-500 text-xs font-mono tracking-wide uppercase mb-1">Funds &amp; IPO</p>
              <h1 className="text-2xl font-semibold tracking-tight">₹{fmtINR(FUNDS.available)}</h1>
              <p className="text-zinc-500 text-[11px] font-mono mt-1">Available balance</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 text-xs font-mono px-3.5 py-2 rounded-lg bg-emerald-400 text-zinc-950 font-medium hover:bg-emerald-300 transition-colors">
                <ArrowDownRight size={14} />
                Add funds
              </button>
              <button className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 text-xs font-mono px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors">
                <ArrowUpRight size={14} />
                Withdraw
              </button>
            </div>
          </div>

          {/* Funds summary strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={13} className="text-zinc-500" />
                <p className="text-zinc-500 text-[11px] font-mono uppercase">Available</p>
              </div>
              <p className="font-mono text-sm">₹{fmtINR(FUNDS.available)}</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-[11px] font-mono uppercase mb-1">Used margin</p>
              <p className="font-mono text-sm">₹{fmtINR(FUNDS.usedMargin)}</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-[11px] font-mono uppercase mb-1">Pending withdrawal</p>
              <p className="font-mono text-sm">₹{fmtINR(FUNDS.pendingWithdrawal)}</p>
            </div>
          </div>

          {/* IPO section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <p className="font-mono text-xs text-zinc-500 uppercase tracking-wide">IPOs</p>
            <div className="relative flex gap-1 bg-zinc-900/60 border border-zinc-800 rounded-lg p-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="relative px-3 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap"
                  style={{ color: tab === t ? '#f4f4f5' : '#71717a' }}
                >
                  {tab === t && (
                    <motion.div
                      layoutId="ipo-tab-pill"
                      className="absolute inset-0 bg-zinc-800 rounded-md"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl divide-y divide-zinc-800 overflow-hidden">
            <AnimatePresence initial={false} mode="popLayout">
              {filtered.map((ipo, i) => (
                <motion.div
                  key={ipo.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, delay: i * 0.03 }}
                  className="flex flex-col sm:flex-row sm:items-start sm:items-center justify-between gap-3 sm:gap-4 px-4 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">{ipo.company}</p>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${STATUS_STYLE[ipo.status]}`}>
                        {ipo.status}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-[11px] font-mono mt-1">
                      {ipo.priceBand} · Lot {ipo.lot} · {ipo.closes}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                    {ipo.subscribed !== null && (
                      <div>
                        <p className="text-zinc-500 text-[10px] font-mono uppercase">Subscribed</p>
                        <p className="font-mono text-sm">{ipo.subscribed.toFixed(1)}x</p>
                      </div>
                    )}
                    <button
                      disabled={ipo.status !== 'Open'}
                      className={`text-xs font-mono px-3.5 py-1.5 rounded-lg transition-colors ${
                        ipo.status === 'Open'
                          ? 'bg-emerald-400 text-zinc-950 font-medium hover:bg-emerald-300'
                          : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center text-zinc-500 text-sm font-mono">
                No {tab.toLowerCase()} IPOs
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}