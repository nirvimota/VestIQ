import React, { useMemo, useState } from 'react';
import { Plus, BellOff, Sparkles, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';

// ---------------------------------------------------------------------------
// vestIQ — Alerts v2
// Same "Radar" concept, now on the shared Sidebar/background (fixing the
// duplicated-and-buggy inline sidebar), with real interactivity added:
// tabs animate with a sliding pill, alert rows can actually be paused/
// resumed by clicking the status icon, and radar blips + cards get hover
// feedback instead of being static.
// ---------------------------------------------------------------------------

const INITIAL_ALERTS = [
  { id: 1, symbol: 'RELIANCE', condition: 'crosses ₹3,000', ltp: 2945.6, target: 3000, status: 'active', progress: 92, color: '#3fd6c0' },
  { id: 2, symbol: 'TCS', condition: 'drops below ₹3,750', ltp: 3812.4, target: 3750, status: 'active', progress: 68, color: '#3fd6c0' },
  { id: 3, symbol: 'HDFCBANK', condition: 'crosses ₹1,700', ltp: 1675.2, target: 1700, status: 'active', progress: 96, color: '#e8b84b' },
  { id: 4, symbol: 'INFY', condition: 'crosses ₹1,850', ltp: 1852.1, target: 1850, status: 'triggered', progress: 100, color: '#3fd6c0' },
  { id: 5, symbol: 'ICICIBANK', condition: 'drops below ₹1,250', ltp: 1298.75, target: 1250, status: 'paused', progress: 41, color: '#6B7686' },
];

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'triggered', label: 'Triggered' },
  { key: 'paused', label: 'Paused' },
];

function radarPosition(progress, index, total) {
  const r = 6 + (100 - progress) * 0.42;
  const angle = (index / total) * Math.PI * 2 + 0.4;
  const x = 50 + r * Math.cos(angle);
  const y = 50 + r * Math.sin(angle);
  return { x, y };
}

function funNote(progress, status) {
  if (status === 'triggered') return '🎉 Triggered!';
  if (status === 'paused') return '⏸ Paused';
  if (progress >= 90) return '🔥 Almost there';
  if (progress >= 60) return '👀 Getting close';
  return '🌙 Still a way off';
}

export default function Alerts() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [tab, setTab] = useState('active');

  const activeOnes = useMemo(() => alerts.filter((a) => a.status === 'active'), [alerts]);
  const filtered = useMemo(() => alerts.filter((a) => a.status === tab), [alerts, tab]);
  const closeCount = activeOnes.filter((a) => a.progress >= 85).length;

  const togglePause = (id) =>
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        if (a.status === 'triggered') return a;
        return { ...a, status: a.status === 'paused' ? 'active' : 'paused' };
      })
    );

  return (
    <div className="min-h-screen bg-ink text-bone flex relative">
      <style>{`
        @keyframes alert-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .alert-sweep { animation: alert-sweep 6s linear infinite; transform-origin: 50% 50%; }
        @keyframes alert-pulse-ring {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .alert-pulse-ring { animation: alert-pulse-ring 2.2s ease-out infinite; }
        @keyframes alert-blip {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.25); }
        }
        .alert-blip { animation: alert-blip 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .alert-sweep, .alert-pulse-ring, .alert-blip { animation: none; }
        }
      `}</style>

      <AmbientBackground opacity={0.13} />
      <Sidebar />

      <div className="flex-1 min-w-0 relative px-4 sm:px-6 py-8 pb-28">
        <div className="max-w-3xl mx-auto">
          {/* header */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="font-display text-xl">Alerts</h1>
              <p className="text-slate text-sm mt-1">We'll ping you the moment it happens.</p>
            </div>
            <span className="bg-surface border border-border rounded-full px-3 py-1.5 font-mono text-xs text-gold flex items-center gap-1.5">
              <Sparkles size={12} />
              {closeCount} about to fire
            </span>
          </div>

          {/* radar */}
          <div className="bg-surface border border-border rounded-2xl mt-6 p-5">
            <div className="relative w-full aspect-square max-w-[320px] mx-auto">
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                {[42, 30, 18, 6].map((r) => (
                  <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />
                ))}
                <line x1="50" y1="8" x2="50" y2="92" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />
                <line x1="8" y1="50" x2="92" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />
              </svg>

              <div className="absolute inset-0 alert-sweep">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <linearGradient id="sweepFade" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3fd6c0" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#3fd6c0" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M50,50 L50,8 A42,42 0 0,1 79.7,20.3 Z" fill="url(#sweepFade)" />
                </svg>
              </div>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gold" />

              {activeOnes.map((a, i) => {
                const { x, y } = radarPosition(a.progress, i, activeOnes.length);
                return (
                  <motion.div
                    key={a.id}
                    whileHover={{ scale: 1.4 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => setTab('active')}
                  >
                    <div className="relative w-3 h-3">
                      {a.progress >= 85 && (
                        <span className="alert-pulse-ring absolute inset-0 rounded-full border" style={{ borderColor: a.color }} />
                      )}
                      <span className={`absolute inset-0 rounded-full ${a.progress >= 85 ? 'alert-blip' : ''}`} style={{ background: a.color }} />
                    </div>
                    <span className="font-mono text-[9px] text-slate mt-1 whitespace-nowrap">{a.symbol}</span>
                  </motion.div>
                );
              })}
            </div>
            <p className="text-center text-slate text-xs font-mono mt-2">
              Closer to the center = closer to triggering
            </p>
          </div>

          {/* tabs */}
          <div className="relative flex items-center gap-1 mt-7 bg-surface border border-border rounded-full p-1 w-fit">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative font-mono text-xs px-3.5 py-1.5 rounded-full transition-colors"
                style={{ color: tab === t.key ? '#0a0d12' : undefined }}
              >
                {tab === t.key && (
                  <motion.div
                    layoutId="alerts-tab-pill"
                    className="absolute inset-0 bg-gold rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative ${tab === t.key ? '' : 'text-slate hover:text-bone'}`}>{t.label}</span>
              </button>
            ))}
          </div>

          {/* feed */}
          <div className="flex flex-col gap-3 mt-4">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-surface border border-border rounded-xl px-5 py-10 text-center"
                >
                  <BellOff className="mx-auto text-slate" size={22} />
                  <p className="text-slate text-sm mt-3">Nothing here yet.</p>
                </motion.div>
              )}

              {filtered.map((a) => (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  whileHover={{ borderColor: 'rgba(255,255,255,0.16)' }}
                  className="bg-surface border border-border rounded-xl px-4 py-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-ink border border-border flex items-center justify-center font-mono text-[10px] text-slate">
                        {a.symbol.slice(0, 2)}
                      </span>
                      <div>
                        <p className="font-mono text-sm">
                          {a.symbol} <span className="text-slate font-normal">{a.condition}</span>
                        </p>
                        <p className="text-slate text-[11px] font-mono mt-0.5">LTP ₹{a.ltp.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-gold whitespace-nowrap">{funNote(a.progress, a.status)}</span>
                      {a.status !== 'triggered' && (
                        <button
                          onClick={() => togglePause(a.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-slate hover:text-bone hover:bg-white/5 transition-colors"
                          aria-label={a.status === 'paused' ? 'Resume alert' : 'Pause alert'}
                        >
                          {a.status === 'paused' ? <Play size={11} /> : <Pause size={11} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-ink overflow-hidden mt-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${a.progress}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: a.status === 'triggered' ? '#e8b84b' : '#3fd6c0' }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* floating create button */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          className="fixed bottom-8 right-6 w-14 h-14 rounded-full bg-gold text-ink flex items-center justify-center shadow-lg shadow-black/40"
          aria-label="Create alert"
        >
          <Plus size={22} />
        </motion.button>
      </div>
    </div>
  );
}