import React, { useState } from 'react';
import { Link } from 'react-router-dom';
 import {
  Bell,
  Home,
  Settings,
  LineChart as LineChartIcon,
  ListChecks,
  ShieldCheck,
  Send
} from 'lucide-react';
/**
 * Watchlist screen — grid-card layout + side nav.
 * Token system: ink -> zinc-950, surface -> zinc-900, border -> zinc-800,
 * bone -> zinc-100, slate -> zinc-500, teal -> emerald-400, coral -> rose-400.
 */
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

const WATCHLIST = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 2945.6, chg: 1.72 },
  { symbol: 'TCS', name: 'Tata Consultancy', ltp: 3812.4, chg: -0.94 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', ltp: 1188.35, chg: -1.24 },
  { symbol: 'SBIN', name: 'State Bank of India', ltp: 824.6, chg: 2.11 },
  { symbol: 'ITC', name: 'ITC Ltd', ltp: 462.9, chg: -0.62 },
  { symbol: 'WIPRO', name: 'Wipro', ltp: 289.15, chg: 0.27 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', ltp: 968.4, chg: 4.32 },
];

function fmtINR(n) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AssetCard({ w }) {
  const up = w.chg >= 0;
  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between h-[104px]">
      <div className="flex items-start justify-between">
        <p className="font-mono text-sm font-bold tracking-tight">{w.symbol}</p>
        <p className="font-mono text-sm">{fmtINR(w.ltp)}</p>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-zinc-500 text-[11px] truncate pr-2">{w.name}</p>
        <span
          className={`inline-flex items-center gap-0.5 text-[11px] font-mono shrink-0 ${up ? 'text-emerald-400' : 'text-rose-400'
            }`}
        >
          {up ? '+' : ''}
          {w.chg.toFixed(2)}
          <span className="text-[13px] leading-none">{up ? '↗' : '↘'}</span>
        </span>
      </div>
    </div>
  );
}

function AddCard() {
  return (
    <button className="border border-dashed border-zinc-700 rounded-2xl h-[104px] flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 transition-colors">
      <span className="text-2xl leading-none">+</span>
    </button>
  );
}

export default function WatchlistPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex">
      {/* Sidebar */}
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

      {/* Main */}
      <main className="flex-1 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold tracking-tight">Watchlist</h1>
          <button className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-zinc-950 text-base leading-none">
            +
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-w-3xl">
          {WATCHLIST.map((w) => (
            <AssetCard key={w.symbol} w={w} />
          ))}
          <AddCard />
        </div>
      </main>
    </div>
  );
}