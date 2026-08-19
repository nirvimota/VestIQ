import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Book,
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

import { useAuth } from '../../context/AuthContext';
import { getFormattedUser } from '../../utils/userUtils';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: Home, to: '/dashboard' },
  { label: 'Portfolio', icon: LineChartIcon, to: '/portfolio' },
  { label: 'Watchlist', icon: ListChecks, to: '/watchlist' },
  { label: 'Transactions', icon: Send, to: '/orders' },
  { label: 'KYC', icon: ShieldCheck, to: '/kyc' },
  { label: 'Market', icon: ShoppingBag, to: '/market' },
  { label: 'Alerts', icon: Bell, to: '/alerts' },
  { label: 'Learn', icon: Book, to: '/learn' },
 
];


const TEAL = '#2ED9B8';
const INK = '#0A0F1A';
const SUB = '#8A93A6';
const BORDER = '#1E2838';

export default function Sidebar({ user: propUser }) {
  const location = useLocation();
  const { profile, user: authUser } = useAuth();
  const currentUser = propUser || getFormattedUser(profile, authUser);

  return (
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
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 mt-3" style={{ border: `1px solid ${BORDER}` }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: TEAL, color: INK, fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {currentUser.initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs truncate" style={{ color: '#ECEEF0', fontFamily: "'Inter', sans-serif" }}>{currentUser.name}</p>
            <p className="text-[10px]" style={{ color: '#4E5A70', fontFamily: "'IBM Plex Mono', monospace" }}>{currentUser.role || 'Investor'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}