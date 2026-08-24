import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  LineChart as LineChartIcon,
  ShoppingBag,
  Book,
  Menu,
  X,
  ListChecks,
  Send,
  Bell,
  ShieldCheck,
  Wallet,
  Activity,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TEAL = '#2ED9B8';
const RED = '#EF5A5A';
const INK = '#0A0F1A';
const CARD = '#111826';
const BORDER = '#1E2838';
const SUB = '#8A93A6';

const TAB_ITEMS = [
  { label: 'Dashboard', icon: Home, to: '/dashboard' },
  { label: 'Portfolio', icon: LineChartIcon, to: '/portfolio' },
  { label: 'Market', icon: ShoppingBag, to: '/market' },
  { label: 'Learn', icon: Book, to: '/learn' },
];

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [showDrawer, setShowDrawer] = useState(false);

  const handleLogout = async () => {
    setShowDrawer(false);
    await signOut();
    navigate('/');
  };

  const handleMoreClick = () => {
    setShowDrawer(true);
  };

  const isTabActive = (to) => location.pathname === to;

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0F1A]/85 backdrop-blur-lg flex items-center justify-around h-16 border-t px-2"
        style={{ borderColor: BORDER }}
      >
        {TAB_ITEMS.map(({ label, icon: Icon, to }) => {
          const active = isTabActive(to);
          return (
            <Link
              key={label}
              to={to}
              className="relative flex flex-col items-center justify-center flex-1 h-full text-xs gap-1"
              style={{ color: active ? TEAL : SUB }}
            >
              {active && (
                <motion.div
                  layoutId="bottom-active-indicator"
                  className="absolute top-0 w-8 h-1 rounded-b-md"
                  style={{ background: TEAL }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon size={18} />
              <span className="text-[10px] font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                {label}
              </span>
            </Link>
          );
        })}

        <button
          onClick={handleMoreClick}
          className="relative flex flex-col items-center justify-center flex-1 h-full text-xs gap-1 outline-none text-[#8A93A6]"
        >
          <Menu size={18} />
          <span className="text-[10px] font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
            More
          </span>
        </button>
      </nav>

      {/* Slide-up Drawer menu */}
      <AnimatePresence>
        {showDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 z-50 bg-[#0A0F1A]/80 backdrop-blur-sm lg:hidden"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#111826] border-t max-h-[85vh] rounded-t-2xl flex flex-col lg:hidden overflow-hidden"
              style={{ borderColor: BORDER }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4 border-b shrink-0"
                style={{ borderColor: BORDER }}
              >
                <span
                  className="text-sm font-semibold uppercase tracking-wider"
                  style={{ color: '#ECEEF0', fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  More Options
                </span>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-[#0A0F1A] text-[#8A93A6] border"
                  style={{ borderColor: BORDER }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body / Nav List */}
              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/watchlist"
                    onClick={() => setShowDrawer(false)}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl border transition-colors hover:bg-white/5 bg-[#0A0F1A]/40"
                    style={{ borderColor: BORDER }}
                  >
                    <ListChecks size={20} style={{ color: TEAL }} />
                    <span className="text-xs font-semibold" style={{ color: '#ECEEF0' }}>Watchlist</span>
                  </Link>

                  <Link
                    to="/orders"
                    onClick={() => setShowDrawer(false)}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl border transition-colors hover:bg-white/5 bg-[#0A0F1A]/40"
                    style={{ borderColor: BORDER }}
                  >
                    <Send size={20} style={{ color: TEAL }} />
                    <span className="text-xs font-semibold" style={{ color: '#ECEEF0' }}>Transactions</span>
                  </Link>

                  <Link
                    to="/alerts"
                    onClick={() => setShowDrawer(false)}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl border transition-colors hover:bg-white/5 bg-[#0A0F1A]/40"
                    style={{ borderColor: BORDER }}
                  >
                    <Bell size={20} style={{ color: TEAL }} />
                    <span className="text-xs font-semibold" style={{ color: '#ECEEF0' }}>Alerts</span>
                  </Link>

                  <Link
                    to="/kyc"
                    onClick={() => setShowDrawer(false)}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl border transition-colors hover:bg-white/5 bg-[#0A0F1A]/40"
                    style={{ borderColor: BORDER }}
                  >
                    <ShieldCheck size={20} style={{ color: TEAL }} />
                    <span className="text-xs font-semibold" style={{ color: '#ECEEF0' }}>KYC Activation</span>
                  </Link>

                  <Link
                    to="/funds-ipo"
                    onClick={() => setShowDrawer(false)}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl border transition-colors hover:bg-white/5 bg-[#0A0F1A]/40"
                    style={{ borderColor: BORDER }}
                  >
                    <Wallet size={20} style={{ color: TEAL }} />
                    <span className="text-xs font-semibold" style={{ color: '#ECEEF0' }}>Funds &amp; IPO</span>
                  </Link>

                  <Link
                    to="/paper-trading"
                    onClick={() => setShowDrawer(false)}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl border transition-colors hover:bg-white/5 bg-[#0A0F1A]/40"
                    style={{ borderColor: BORDER }}
                  >
                    <Activity size={20} style={{ color: TEAL }} />
                    <span className="text-xs font-semibold" style={{ color: '#ECEEF0' }}>Paper Trading</span>
                  </Link>
                </div>

                <div className="pt-4 border-t" style={{ borderColor: BORDER }}>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border transition-colors bg-[#EF5A5A]/10 text-[#EF5A5A] hover:bg-[#EF5A5A]/20"
                    style={{ borderColor: `${RED}33` }}
                  >
                    <LogOut size={16} />
                    <span className="text-xs font-bold">Log Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
