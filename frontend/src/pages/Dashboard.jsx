import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  Expand,
  Home,
  LineChart as LineChartIcon,
  ListChecks,
  ShieldCheck,
  Send,
  Wallet,
  BellRing,
  Users,
  Settings,
  ArrowUpRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// vestIQ — Dashboard v5 ("bento" layout)
// Adapted from a CRM-style bento dashboard: many small, self-contained cards
// with varied chart types (line, semicircle gauge, multi-ring radial, bar)
// rather than a few large sections. Same navy/teal token system as v4 so the
// two stay in the same product family; this pass is about layout density and
// chart variety, not a new palette.
// ---------------------------------------------------------------------------

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

function linePath(values, w, h, pad = 4) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * step;
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function SemiGauge({ value, max = 100, size = 160, color = TEAL, label }) {
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const angle = Math.PI * (value / max);
  const x2 = cx - r * Math.cos(angle);
  const y2 = cy - r * Math.sin(angle);
  const large = angle > Math.PI / 2 ? 1 : 0;
  return (
    <svg width={size} height={size / 1.7} viewBox={`0 0 ${size} ${size / 1.7}`}>
      <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`} fill="none" stroke={BORDER} strokeWidth="12" strokeLinecap="round" />
      <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${x2},${y2}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
      <text x="50%" y="82%" textAnchor="middle" fill={TEXT} fontSize="26" fontWeight="700" fontFamily="'Space Grotesk', sans-serif">
        {value}
      </text>
      {label && (
        <text x="50%" y="98%" textAnchor="middle" fill={SUB} fontSize="10" fontFamily="'Inter', sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
}

function RadialStack({ rings, size = 150, center }) {
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((ring, i) => {
        const r = size / 2 - 10 - i * 16;
        const c = 2 * Math.PI * r;
        const offset = c * (1 - ring.value / 100);
        return (
          <g key={ring.label}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={BORDER} strokeWidth="9" />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={ring.color}
              strokeWidth="9"
              strokeDasharray={c}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          </g>
        );
      })}
      {center && (
        <text x="50%" y="52%" textAnchor="middle" fill={TEXT} fontSize="20" fontWeight="700" fontFamily="'Space Grotesk', sans-serif">
          {center}
        </text>
      )}
    </svg>
  );
}

export default function Dashboard() {
  const location = useLocation();

  const portfolioSpark = useMemo(() => linePath([58, 62, 60, 66, 70, 68, 74, 78, 76, 83], 200, 60), []);
  const activitySpark = useMemo(() => linePath([12, 18, 14, 22, 30, 26, 35], 240, 70), []);

  const ALLOCATION = [
    { label: 'Equity', pct: 62, color: TEAL },
    { label: 'Debt', pct: 24, color: BLUE },
    { label: 'Cash', pct: 14, color: MUTE },
  ];

  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const PNL_BARS = [30, 45, 20, 70, 55, 15, 10]; // % height

  const TOP_MOVERS = [
    { label: 'RELIANCE', pct: 78, color: TEAL },
    { label: 'HDFCBANK', pct: 58, color: BLUE },
    { label: 'INFY', pct: 40, color: PURPLE },
  ];

  return (
    <div className="v5-root min-h-screen flex" style={{ background: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body { font-family: 'Inter', sans-serif; }
        .v5-card { background: ${CARD}; border: 1px solid ${BORDER}; }
      `}</style>

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
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-7">
          {/* top bar */}
          <div className="flex items-center justify-between">
            <h1 className="v5-display text-xl" style={{ color: TEXT }}>Dashboard</h1>
            <div className="flex items-center gap-3">
              <button className="v5-card w-9 h-9 rounded-full flex items-center justify-center" style={{ color: SUB }}>
                <Search size={15} />
              </button>
              <button className="v5-card w-9 h-9 rounded-full flex items-center justify-center" style={{ color: SUB }}>
                <Bell size={15} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center v5-mono text-[11px] font-bold" style={{ background: TEAL, color: INK }}>
                  AM
                </div>
                <div className="hidden sm:block">
                  <p className="v5-body text-xs" style={{ color: TEXT }}>Alex Morgan</p>
                  <p className="v5-body text-[10px]" style={{ color: MUTE }}>Investor</p>
                </div>
              </div>
            </div>
          </div>

          {/* bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Portfolio value */}
            <div className="v5-card rounded-2xl px-5 py-5">
              <div className="flex items-center justify-between">
                <p className="v5-body text-sm" style={{ color: SUB }}>Portfolio value</p>
                <Expand size={13} style={{ color: MUTE }} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="v5-display text-3xl" style={{ color: TEXT }}>₹83,007</span>
                <span className="v5-mono text-[11px] px-2 py-0.5 rounded-full" style={{ color: RED, background: `${RED}1A` }}>
                  -0.35%
                </span>
              </div>
              <div className="mt-3 h-[50px]">
                <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
                  <path d={portfolioSpark} fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <Link
                to="/portfolio"
                className="v5-body text-xs mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full"
                style={{ background: '#1A2333', color: SUB }}
              >
                View chart <ArrowUpRight size={12} />
              </Link>
            </div>

            {/* Market activity */}
            <div className="v5-card rounded-2xl px-5 py-5">
              <div className="flex items-center justify-between">
                <p className="v5-body text-sm" style={{ color: SUB }}>NIFTY 50 today</p>
                <span className="v5-body text-[11px] flex items-center gap-1" style={{ color: MUTE }}>
                  View <ChevronDown size={12} />
                </span>
              </div>
              <p className="v5-display text-lg mt-1" style={{ color: TEXT }}>24,812.35</p>
              <div className="mt-2 h-[70px]">
                <svg viewBox="0 0 240 70" className="w-full h-full" preserveAspectRatio="none">
                  <path d={activitySpark} fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex justify-between mt-1">
                {['9:15', '11', '1', '3', '3:30'].map((t) => (
                  <span key={t} className="v5-mono text-[10px]" style={{ color: MUTE }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Allocation bar */}
            <div className="v5-card rounded-2xl px-5 py-5">
              <div className="flex items-center justify-between">
                <p className="v5-body text-sm" style={{ color: SUB }}>Allocation</p>
                <span className="v5-body text-[11px]" style={{ color: MUTE }}>View</span>
              </div>
              <div className="flex items-center gap-2 mt-4">
                {ALLOCATION.map((a) => (
                  <span key={a.label} className="v5-mono text-xs" style={{ color: a.color }}>
                    {a.pct}%
                  </span>
                ))}
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden flex mt-2" style={{ background: BORDER }}>
                {ALLOCATION.map((a) => (
                  <div key={a.label} style={{ width: `${a.pct}%`, background: a.color }} />
                ))}
              </div>
              <div className="flex flex-col gap-1.5 mt-4">
                {ALLOCATION.map((a) => (
                  <div key={a.label} className="flex items-center justify-between">
                    <span className="v5-body text-xs flex items-center gap-2" style={{ color: SUB }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                      {a.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly P&L bar chart */}
            <div className="v5-card rounded-2xl px-5 py-5">
              <div className="flex items-center justify-between">
                <p className="v5-body text-sm" style={{ color: SUB }}>Weekly P&amp;L</p>
                <span className="v5-body text-[11px] flex items-center gap-1" style={{ color: MUTE }}>
                  This week <ChevronDown size={12} />
                </span>
              </div>
              <div className="flex items-end gap-2 mt-5 h-[110px]">
                {PNL_BARS.map((h, i) => (
                  <div key={WEEKDAYS[i]} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-md"
                      style={{ height: `${h}%`, background: i === 3 ? TEAL : '#1A2333' }}
                    />
                    <span className="v5-mono text-[9px]" style={{ color: MUTE }}>{WEEKDAYS[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Margin health gauge */}
            <div className="v5-card rounded-2xl px-5 py-5 flex flex-col items-center">
              <div className="w-full flex items-center justify-between">
                <p className="v5-body text-sm" style={{ color: SUB }}>Margin health</p>
                <span className="v5-body text-[11px] flex items-center gap-1" style={{ color: MUTE }}>
                  Weekly <ChevronDown size={12} />
                </span>
              </div>
              <div className="mt-2">
                <SemiGauge value={72} color={TEAL} label="out of 100" />
              </div>
            </div>

            {/* Top holdings radial */}
            <div className="v5-card rounded-2xl px-5 py-5 flex flex-col items-center">
              <div className="w-full flex items-center justify-between">
                <p className="v5-body text-sm" style={{ color: SUB }}>Top holdings</p>
                <span className="v5-body text-[11px]" style={{ color: MUTE }}>Weekly</span>
              </div>
              <div className="mt-2">
                <RadialStack
                  rings={[
                    { label: 'RELIANCE', value: 78, color: TEAL },
                    { label: 'HDFCBANK', value: 58, color: BLUE },
                    { label: 'INFY', value: 40, color: PURPLE },
                  ]}
                  center="₹51.4K"
                />
              </div>
              <div className="flex items-center gap-3 mt-3">
                {TOP_MOVERS.map((m) => (
                  <span key={m.label} className="v5-body text-[10px] flex items-center gap-1" style={{ color: SUB }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                    {m.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Weekly progress duo */}
            <div className="v5-card rounded-2xl px-5 py-5 md:col-span-1">
              <p className="v5-body text-sm" style={{ color: SUB }}>This week</p>
              <p className="v5-body text-[11px] mt-1" style={{ color: MUTE }}>4/6 orders filled</p>
              <div className="w-full h-2 rounded-full mt-2 overflow-hidden" style={{ background: BORDER }}>
                <div className="h-full rounded-full" style={{ width: '66%', background: TEAL }} />
              </div>
              <div className="flex items-center gap-6 mt-5">
                <div>
                  <p className="v5-display text-2xl" style={{ color: TEAL }}>70%</p>
                  <p className="v5-body text-[11px] mt-0.5" style={{ color: MUTE }}>Orders filled</p>
                </div>
                <div>
                  <p className="v5-display text-2xl" style={{ color: BLUE }}>32%</p>
                  <p className="v5-body text-[11px] mt-0.5" style={{ color: MUTE }}>Margin used</p>
                </div>
              </div>
              <div className="v5-body text-xs mt-4 px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: '#1A2333', color: SUB }}>
                <Wallet size={13} style={{ color: TEAL }} />
                You're well within your margin this week
              </div>
            </div>

            {/* Top movers bars */}
            <div className="v5-card rounded-2xl px-5 py-5 md:col-span-1">
              <p className="v5-body text-sm" style={{ color: SUB }}>Top movers</p>
              <div className="flex flex-col gap-3 mt-4">
                {TOP_MOVERS.map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="v5-mono text-xs" style={{ color: TEXT }}>{m.label}</span>
                      <span className="v5-mono text-[11px]" style={{ color: m.color }}>+{m.pct - 60}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: BORDER }}>
                      <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Watchlist pick card */}
            <div className="v5-card rounded-2xl px-5 py-5 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center v5-mono text-sm font-bold" style={{ background: TEAL, color: INK }}>
                RIL
              </div>
              <p className="v5-body text-sm mt-3" style={{ color: TEXT }}>Reliance Industries</p>
              <p className="v5-body text-[11px]" style={{ color: MUTE }}>Highest conviction pick</p>
              <div className="flex items-center gap-4 mt-4 w-full justify-center">
                <div>
                  <p className="v5-mono text-sm" style={{ color: TEXT }}>₹2,945</p>
                  <p className="v5-body text-[10px]" style={{ color: MUTE }}>LTP</p>
                </div>
                <div>
                  <p className="v5-mono text-sm" style={{ color: TEAL }}>82</p>
                  <p className="v5-body text-[10px]" style={{ color: MUTE }}>Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}