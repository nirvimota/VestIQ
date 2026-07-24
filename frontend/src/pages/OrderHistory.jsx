import React, { useState } from 'react';
 import {
  Bell,
  Home,
  Settings,
  LineChart as LineChartIcon,
  ListChecks,
  ShieldCheck,
  Send
} from 'lucide-react';
import { Link } from 'react-router-dom';
/**
 * 
 * Transactions — desktop, dark mode.
 * The mobile reference stacks avatar/name/method/date/amount vertically per
 * row; on desktop that wastes horizontal space, so it's rebuilt as a proper
 * table with dedicated columns, a search field, and a status column that the
 * mobile version only implied through icon color.
 */

const TABS = ['All', 'Deposits', 'Withdrawals'];

const NAV_ITEMS = [
  { label: 'Overview', icon: Home, to: '/dashboard' },
  { label: 'Portfolio', icon: LineChartIcon, to: '/portfolio' },
  { label: 'Watchlist', icon: ListChecks, to: '/watchlist' },
  { label: 'Orders', icon: Send, to: '/orders' },
  { label: 'Alerts', icon: Bell, to: '/alerts' },
  { label: 'KYC', icon: ShieldCheck, to: '/kyc' },
];

const INK = '#0A0F1A';
const CARD = '#111826';
const BORDER = '#1E2838';
const TEXT = '#ECEEF0';
const SUB = '#8A93A6';
const MUTE = '#4E5A70';
const TEAL = '#2ED9B8';
const BLUE = '#5B9CFF';
const PURPLE = '#B98CFF';
const RED = '#EF5A5A';
const STATUS = {
  success: { icon: '✓', style: 'bg-emerald-400/15 text-emerald-400' },
  failed: { icon: '✕', style: 'bg-rose-400/15 text-rose-400' },
  pending: { icon: '⏱', style: 'bg-amber-400/15 text-amber-400' },
};

const TRANSACTIONS = [
  { name: 'Davy Jones', card: '9918', date: '12.01.2024', amount: -12.49, type: 'withdrawal', status: 'success' },
  { name: 'Guy Hawkins', card: '9918', date: '12.01.2024', amount: 182.99, type: 'deposit', status: 'success' },
  { name: 'Brooklyn Simmons', card: '9918', date: '12.01.2024', amount: -3.03, type: 'withdrawal', status: 'failed' },
  { name: 'Courtney Henry', card: '9918', date: '12.01.2024', amount: 72.99, type: 'deposit', status: 'success' },
  { name: 'Bessie Cooper', card: '9918', date: '12.01.2024', amount: -132.05, type: 'withdrawal', status: 'success' },
  { name: 'Dianne Russell', card: '9918', date: '12.01.2024', amount: 32.99, type: 'deposit', status: 'pending' },
  { name: 'Esther Howard', card: '9918', date: '12.01.2024', amount: 45.99, type: 'deposit', status: 'success' },
  { name: 'Eleanor Pena', card: '9918', date: '12.01.2024', amount: -12.49, type: 'withdrawal', status: 'success' },
];

function fmt(n) {
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Avatar({ name }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300 shrink-0">
      {initials}
    </div>
  );
}

export default function Transactions() {
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');

  const filtered = TRANSACTIONS.filter((t) => {
    const matchesTab =
      tab === 'All' || (tab === 'Deposits' && t.type === 'deposit') || (tab === 'Withdrawals' && t.type === 'withdrawal');
    const matchesQuery = t.name.toLowerCase().includes(query.toLowerCase());
    return matchesTab && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans grid grid-cols-2">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <aside className="hidden lg:flex flex-col w-56 shrink-0 px-4 py-6" style={{ borderRight: `1px solid ${BORDER}` }}>
          <Link to="/dashboard" className="v5-display text-lg tracking-tight px-2 flex items-center gap-2" style={{ color: TEXT }}>
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: TEAL, color: INK }}>
              V
            </span>
            vest<span style={{ color: '#e8b84b' }}>IQ</span>
          </Link>
          <nav className="mt-8 flex flex-col gap-1">
            {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={label}
                  to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl v5-body text-sm transition-colors"
                  style={{ color: active ? INK : SUB, background: active ? TEAL : 'transparent' }}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto">
            <Link to="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl v5-body text-sm" style={{ color: SUB }}>
              <Settings size={16} />
              Settings
            </Link>
          </div>
        </aside>
        <div></div>
        {/* Header */}
        <div className="flex justify-center mb-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">My Transactions</h1>
            <p className="text-zinc-500 text-sm mt-1">{filtered.length} results</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
              <span className="text-zinc-500 text-sm">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search transactions"
                className="bg-transparent outline-none text-sm placeholder:text-zinc-600 w-44"
              />
            </div>
            <button className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
              Export
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t
                ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/30'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr] px-5 py-3 text-xs uppercase tracking-wide text-zinc-500 border-b border-zinc-800">
            <span>Name</span>
            <span>Method</span>
            <span>Date</span>
            <span>Status</span>
            <span className="text-right">Amount</span>
          </div>

          {filtered.map((t, i) => {
            const up = t.amount >= 0;
            const s = STATUS[t.status];
            return (
              <div
                key={i}
                className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr] items-center px-5 py-3.5 border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={t.name} />
                  <span className="text-sm truncate">{t.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                  MasterCard •••• {t.card}
                </div>
                <span className="text-zinc-500 text-sm font-mono">{t.date}</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium w-fit ${s.style}`}
                >
                  {s.icon} {t.status[0].toUpperCase() + t.status.slice(1)}
                </span>
                <span className={`text-right font-mono text-sm ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {up ? '+' : '−'}${fmt(t.amount)}
                </span>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-500 text-sm">No transactions match "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}