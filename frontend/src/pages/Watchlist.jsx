// C:\nirvi\vestIQ\frontend\src\pages\Watchlist.jsx
import { useContext, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { TradingContext } from "../context/TradingContext";
import React from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  LineChart as LineChartIcon,
  ListChecks,
  Send,
  Bell,
  ShieldCheck,
  Settings,
  ShoppingBag,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// vestIQ — shared Sidebar
// Was previously copy-pasted into every page with a bug: nav items compared
// against a bare `location.pathname` with no `useLocation()` call, which
// only "worked" by accident via the browser's global `window.location` and
// wouldn't reliably reflect the current route on client-side navigation.
// Fixed here with a real useLocation() call, plus a sliding highlight pill
// (framer-motion layoutId) that animates between nav items instead of
// snapping — the main "more interactive" ask.
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { label: 'Overview', icon: Home, to: '/dashboard' },
  { label: 'Portfolio', icon: LineChartIcon, to: '/portfolio' },
  { label: 'Watchlist', icon: ListChecks, to: '/watchlist' },
  { label: 'Transactions', icon: Send, to: '/orders' },
  { label: 'Alerts', icon: Bell, to: '/alerts' },
  { label: 'KYC', icon: ShieldCheck, to: '/kyc' },
  { label: 'Market', icon: ShoppingBag, to: '/market' }
];

const TEAL = '#2ED9B8';
const INK = '#0A0F1A';
const SUB = '#8A93A6';
const BORDER = '#1E2838';


// same mock market list OrderTicket uses — keep these two in sync
const MOCK_MARKET = [
  { symbol: "RELIANCE", name: "Reliance Industries", price: 2456.75 },
  { symbol: "TCS", name: "Tata Consultancy Services", price: 3890.10 },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: 1642.30 },
  { symbol: "INFY", name: "Infosys", price: 1789.45 },
  { symbol: "ITC", name: "ITC Limited", price: 462.80 },
];

// original hardcoded watchlist — kept as seed/fallback
const MOCK_WATCHLIST = ["RELIANCE", "HDFCBANK"];

export default function Watchlist() {
  const { watchlist, addToWatchlist } = useContext(TradingContext);
  const [showMarket, setShowMarket] = useState(false);
  const [search, setSearch] = useState("");

  // merge context watchlist with the original mock, de-duped
  const symbols = useMemo(() => {
    const merged = [...new Set([...MOCK_WATCHLIST, ...watchlist])];
    return merged;
  }, [watchlist]);

  const rows = symbols.map(
    (sym) => MOCK_MARKET.find((s) => s.symbol === sym) ?? { symbol: sym, name: sym, price: 0 }
  );

  const filteredMarket = MOCK_MARKET.filter(
    (s) =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-full mx-auto px-4 py-6 flex gap-6">
      <aside
        className="hidden lg:flex flex-col w-56 shrink-0 px-4 py-6 sticky top-0 h-screen"
        style={{ borderRight: `1px solid ${BORDER}` }}
      >
        <Link to="/dashboard" className="text-lg tracking-tight px-2 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#ECEEF0' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: TEAL, color: INK }}>
            V
          </span>
          vest<span style={{ color: '#e8b84b' }}>IQ</span>
        </Link>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
            const active = location.pathname === to;
            return (
              <Link key={label} to={to} className="relative px-3 py-2.5 rounded-xl text-sm" style={{ color: active ? INK : SUB }}>
                {active && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: TEAL }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative flex items-center gap-3 transition-transform" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <Icon size={16} />
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-white/[0.04] transition-colors"
            style={{ color: SUB, fontFamily: "'Inter', sans-serif" }}
          >
            <Settings size={16} />
            Settings
          </Link>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 mt-3" style={{ border: `1px solid ${BORDER}` }}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{ background: TEAL, color: INK, fontFamily: "'IBM Plex Mono', monospace" }}
            >
            </div>
            <div className="min-w-0">
              <p className="text-xs truncate" style={{ color: '#ECEEF0', fontFamily: "'Inter', sans-serif" }}>Alice</p>
              <p className="text-[10px]" style={{ color: '#4E5A70', fontFamily: "'IBM Plex Mono', monospace" }}>Investor</p>
            </div>
          </div>
        </div>
      </aside>

      <div></div>
      <div className="w-full px-12 py-3">
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-xl font-semibold text-white">Watchlist</h1>
          <button
            onClick={() => setShowMarket((v) => !v)}
            className="text-sm font-medium text-emerald-600"
          >
            {showMarket ? "Close" : "+ Add stock"}
          </button>
        </div>

        {showMarket && (
          <div className="rounded-xl border border-gray-200 p-3 mb-4 text-white">
            <input
              autoFocus
              placeholder="Search stocks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-3 text-sm"
            />
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {filteredMarket.map((s) => {
                const already = symbols.includes(s.symbol);
                return (
                  <div
                    key={s.symbol}
                    className="flex items-center text-white justify-between px-2 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{s.symbol}</p>
                      <p className="text-xs text-white">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">₹{s.price.toFixed(2)}</span>
                      {already ? (
                        <span className="text-xs text-gray-400 px-2">Added</span>
                      ) : (
                        <button
                          onClick={() => addToWatchlist(s.symbol)}
                          className="text-xs font-medium text-emerald-600 px-2 py-1"
                        >
                          Watch
                        </button>
                      )}
                      <Link
                        to={`/order/${s.symbol}`}
                        className="text-xs font-medium bg-emerald-600 text-white rounded-lg px-2 py-1"
                      >
                        Buy
                      </Link>
                    </div>
                  </div>
                );
              })}
              {filteredMarket.length === 0 && (
                <p className="text-sm text-gray-400 px-2 py-3">No matches.</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {rows.map((s) => (
            <div
              key={s.symbol}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 gap-10"
            >
              <div>
                <p className="font-medium text-white">{s.symbol}</p>
                <p className="text-xs text-gray-500">{s.name}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-700">₹{s.price.toFixed(2)}</span>
                <Link
                  to={`/order/${s.symbol}`}
                  className="text-sm font-medium bg-emerald-600 text-white rounded-lg px-3 py-1.5"
                >
                  Buy
                </Link>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="text-sm text-gray-500">Your watchlist is empty.</p>
          )}
        </div>
      </div>
    </div>
  );
}