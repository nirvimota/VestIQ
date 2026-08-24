import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wallet,
  Clock,
  Globe,
  ShieldAlert,
  BookOpen,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Info,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { io } from "socket.io-client";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { getPaperAccount } from "../services/paperTradingApi";
import Sidebar from "../components/layout/Sidebar";
import AmbientBackground from "../components/layout/AmbientBackground";

// ─────────────────────────────────────────────────────────
// Design tokens — match the pattern used across other v5 pages.
// Adjust these three if your actual hexes differ slightly.
// ─────────────────────────────────────────────────────────
const INK = "#0a0f1a";
const CARD = "#111826";
const BORDER = "rgba(255,255,255,0.08)";
const EMERALD = "#10b981";
const ROSE = "#f43f5e";
const AMBER = "#f59e0b";

// ─────────────────────────────────────────────────────────
// INLINE MOCK DATA (self-contained, no shared imports)
// Swap these for Supabase fetches once the backend is wired.
// ─────────────────────────────────────────────────────────

const TYCOONS = [
  {
    id: "rj",
    name: "Rakesh Jhunjhunwala",
    title: "The Big Bull of Dalal Street",
    era: "1985 – 2022",
    lesson:
      "Turned ₹5,000 into a multi-billion dollar portfolio by holding conviction bets (Titan, CRISIL) for over a decade — patience beat timing, every time.",
    tag: "Long-term conviction",
  },
  {
    id: "rd",
    name: "Radhakishan Damani",
    title: "Retail's quiet billionaire (DMart)",
    era: "1980s – present",
    lesson:
      "Built DMart on the same discipline he used in the stock market: never overpay, keep debt near zero, and let compounding do the heavy lifting.",
    tag: "Value over hype",
  },
  {
    id: "wb",
    name: "Warren Buffett",
    title: "Oracle of Omaha",
    era: "1965 – present",
    lesson:
      "\u201cBe fearful when others are greedy, greedy when others are fearful.\u201d Buffett's real edge was temperament, not stock-picking genius.",
    tag: "Contrarian patience",
  },
  {
    id: "pl",
    name: "Peter Lynch",
    title: "Fidelity Magellan legend",
    era: "1977 – 1990",
    lesson:
      "Averaged ~29% annual returns by investing in businesses he could explain in one sentence — if you can't explain it, don't buy it.",
    tag: "Invest in what you know",
  },
];

const WISE_RULES = [
  {
    id: "stoploss",
    title: "Always set a stop-loss before you enter",
    body: "Decide your exit before your entry. A 5-8% stop-loss on a swing trade protects capital from a single bad thesis wiping out weeks of gains.",
  },
  {
    id: "diversify",
    title: "Don't put more than 10-15% in one stock",
    body: "Concentration builds fortunes, but for a beginner it also destroys them fast. Spread across sectors until you've got a few years of track record.",
  },
  {
    id: "fomo",
    title: "If it's trending on social media, you're already late",
    body: "By the time a stock is trending, the easy money is usually gone. Chasing green candles is the #1 reason new traders take losses.",
  },
  {
    id: "leverage",
    title: "Avoid F&O and margin until you've traded cash for a year",
    body: "Leverage multiplies losses faster than gains for beginners. Learn to be consistently profitable in cash equity first.",
  },
  {
    id: "news",
    title: "React to earnings, not headlines",
    body: "A scary headline without checking the actual quarterly numbers leads to panic-selling good companies. Read the result, not just the reaction.",
  },
];

const INTL_INDICES = [
  {
    id: "sp500",
    name: "S&P 500",
    region: "United States",
    change: 0.64,
    effect:
      "US markets set the overnight tone. A strong S&P close usually lifts IT and pharma exporters on the NSE at open, since these sectors earn heavily in dollars.",
  },
  {
    id: "nasdaq",
    name: "Nasdaq",
    region: "United States",
    change: -0.31,
    effect:
      "Tech-heavy moves here ripple into Indian IT majors (TCS, Infosys, Wipro) because of shared client exposure and sentiment correlation.",
  },
  {
    id: "nikkei",
    name: "Nikkei 225",
    region: "Japan",
    change: 1.12,
    effect:
      "A rising yen carry-trade unwind (Nikkei falling sharply) has historically triggered global risk-off selling — including in Indian equities.",
  },
  {
    id: "hangseng",
    name: "Hang Seng",
    region: "Hong Kong / China",
    change: -0.85,
    effect:
      "China weakness often redirects FII flows toward India as an alternative emerging market — short-term Chinese pain can mean Indian gain.",
  },
];

const NEWS_SEED = [
  {
    id: 1,
    headline: "RBI holds repo rate steady at 6.5% for third consecutive policy",
    sector: "Banking & Finance",
    impact: "bullish",
    summary:
      "Stable rates support bank NIMs and reduce borrowing cost pressure on rate-sensitive sectors like auto and realty.",
    source: "Moneycontrol",
    source_url: "https://www.moneycontrol.com/news/business/economy/",
  },
  {
    id: 2,
    headline: "Crude oil climbs above $86/barrel on supply concerns",
    sector: "Energy & Aviation",
    impact: "bearish",
    summary:
      "Higher crude pressures India's import bill and squeezes margins for airlines, paints, and tyre companies.",
    source: "Economic Times",
    source_url: "https://economictimes.indiatimes.com/markets",
  },
  {
    id: 3,
    headline: "FIIs turn net buyers after six weeks of outflows",
    sector: "Broad Market",
    impact: "bullish",
    summary:
      "Foreign institutional buying is often an early signal of a broader market bottom, especially in large-cap names.",
    source: "LiveMint",
    source_url: "https://www.livemint.com/market",
  },
  {
    id: 4,
    headline: "Q2 IT earnings show muted deal wins amid US client caution",
    sector: "IT Services",
    impact: "bearish",
    summary:
      "Slower discretionary tech spend in the US could weigh on revenue guidance for the next two quarters.",
    source: "Business Standard",
    source_url: "https://www.business-standard.com/markets",
  },
];

// ─────────────────────────────────────────────────────────

function timeAgo(date) {
  const mins = Math.floor((Date.now() - date) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function ImpactPill({ impact }) {
  const isBull = impact === "bullish";
  return (
    <span
      className="v5-mono inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        background: isBull ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
        color: isBull ? EMERALD : ROSE,
      }}
    >
      {isBull ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {isBull ? "Bullish" : "Bearish"}
    </span>
  );
}

function PaperTradingConfirmModal({ onConfirm, onCancel, submitting, errorMsg }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onCancel}
    >
      <div
        className="v5-card w-full max-w-md rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 rounded-xl p-2.5"
            style={{ background: "rgba(16,185,129,0.1)", color: EMERALD }}
          >
            <Info size={20} />
          </div>
          <div>
            <h3 className="v5-display text-lg font-semibold text-slate-50">
              This is practice, not real trading
            </h3>
            <p className="v5-body mt-1 text-sm text-slate-400">
              Before you start, please confirm you understand:
            </p>
          </div>
        </div>

        <ul className="v5-body mt-4 space-y-2.5 text-sm text-slate-300">
          <li className="flex gap-2">
            <span style={{ color: EMERALD }}>•</span>
            No real money is involved — every trade uses ₹1,00,000 in virtual
            paper cash and real-time market prices.
          </li>
          <li className="flex gap-2">
            <span style={{ color: EMERALD }}>•</span>
            Your paper account expires 11 days after you start — you can
            reset it anytime to get a fresh ₹1,00,000 and a new 11-day timer.
          </li>
          <li className="flex gap-2">
            <span style={{ color: EMERALD }}>•</span>
            Orders here never touch your real funds, portfolio, or broker
            account — it's a fully separate sandbox.
          </li>
          <li className="flex gap-2">
            <span style={{ color: EMERALD }}>•</span>
            Linking a bank account is completely optional and only relevant
            for real trading later.
          </li>
        </ul>

        {errorMsg && (
          <p
            className="v5-body mt-4 flex items-start gap-1.5 text-sm"
            style={{ color: ROSE }}
          >
            {errorMsg}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm text-slate-300"
            style={{ border: `1px solid ${BORDER}` }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
            style={{ background: EMERALD, color: INK }}
          >
            {submitting ? "Setting up..." : "I understand, sign me up"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaperWalletBanner({ onDismiss }) {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // The backend auto-creates a paper account on the FIRST call to
  // getPaperAccount() — that's correct behaviour once the user has
  // consented, but we must never call it before they click "Start"
  // (that would silently grant an account with no consent). So we gate
  // on a local flag: only fetch/create once the user has confirmed here
  // at least once on this device.
  useEffect(() => {
    const hasConfirmed = localStorage.getItem("vestiq_paper_confirmed") === "true";

    if (!hasConfirmed) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    getPaperAccount()
      .then((acc) => {
        if (!cancelled) setAccount(acc);
      })
      .catch(() => {
        if (!cancelled) setAccount(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConfirm() {
    setSubmitting(true);
    setErrorMsg("");
    try {
      const acc = await getPaperAccount(); // first real call — creates the account
      localStorage.setItem("vestiq_paper_confirmed", "true");
      setAccount(acc);
      setShowConfirm(false);
    } catch (err) {
      setErrorMsg(err.message || "Couldn't set up your paper account. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div
        className="v5-card animate-pulse rounded-2xl p-5 sm:p-6"
        style={{ borderColor: "rgba(16,185,129,0.2)" }}
      >
        <div className="h-5 w-56 rounded bg-white/5" />
        <div className="mt-3 h-4 w-80 rounded bg-white/5" />
      </div>
    );
  }

  const enrolled = Boolean(account) && !account.expired;

  return (
    <div
      className="v5-card relative overflow-hidden rounded-2xl p-5 sm:p-6"
      style={{ borderColor: "rgba(16,185,129,0.2)" }}
    >
      <button
        onClick={onDismiss}
        className="absolute right-4 top-4 text-slate-500 hover:text-slate-300"
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>

      {enrolled ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl p-2.5"
              style={{ background: "rgba(16,185,129,0.1)", color: EMERALD }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className="v5-display font-semibold text-slate-50">
                ₹{Number(account.balance).toLocaleString("en-IN")} paper cash
                available
              </h3>
              <p className="v5-body mt-1 text-sm text-slate-400">
                Expires in{" "}
                <span className="v5-mono font-medium" style={{ color: AMBER }}>
                  {account.days_remaining} days
                </span>
                . Place practice orders with live market prices, zero real
                risk.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/paper-trading")}
            className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: EMERALD, color: INK }}
          >
            Open Paper Trading
          </button>
        </div>
      ) : account?.expired ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl p-2.5"
              style={{ background: "rgba(244,63,94,0.1)", color: ROSE }}
            >
              <Wallet size={22} />
            </div>
            <div>
              <h3 className="v5-display font-semibold text-slate-50">
                Your paper trading account expired
              </h3>
              <p className="v5-body mt-1 text-sm text-slate-400">
                Reset it to get a fresh ₹1,00,000 and a new 11-day window.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/paper-trading")}
            className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: EMERALD, color: INK }}
          >
            Reset & Continue
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div
              className="rounded-xl p-2.5"
              style={{ background: "rgba(16,185,129,0.1)", color: EMERALD }}
            >
              <Wallet size={22} />
            </div>
            <div>
              <h3 className="v5-display font-semibold text-slate-50">
                ₹1,00,000 paper cash, ready when you are
              </h3>
              <p className="v5-body mt-1 max-w-md text-sm text-slate-400">
                Practice real strategies with zero real risk, using live
                market prices. Your virtual balance expires 11 days after you
                start — linking a bank account is optional and only needed
                for real funds later.
              </p>
              {errorMsg && (
                <p className="v5-body mt-2 text-sm" style={{ color: ROSE }}>
                  {errorMsg}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2 sm:flex-col">
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ background: EMERALD, color: INK }}
            >
              Start Paper Trading
            </button>
            <button
              className="rounded-lg px-4 py-2 text-sm text-slate-300"
              style={{ border: `1px solid ${BORDER}` }}
            >
              Link Bank (optional)
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <PaperTradingConfirmModal
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          submitting={submitting}
          errorMsg={errorMsg}
        />
      )}
    </div>
  );
}

function TycoonCard({ tycoon }) {
  return (
    <div className="v5-card group rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-400"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {tycoon.tag}
        </span>
        <span className="v5-mono text-xs text-slate-600">{tycoon.era}</span>
      </div>
      <h4 className="v5-display font-semibold text-slate-50">
        {tycoon.name}
      </h4>
      <p className="v5-body text-sm text-slate-500">{tycoon.title}</p>
      <p className="v5-body mt-3 text-sm leading-relaxed text-slate-400">
        {tycoon.lesson}
      </p>
    </div>
  );
}

function NewsCard({ item }) {
  const hasLink = Boolean(item.source_url);
  const CardTag = hasLink ? "a" : "div";
  const linkProps = hasLink
    ? { href: item.source_url, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <CardTag
      {...linkProps}
      className={`v5-card block rounded-xl p-4 ${
        hasLink ? "cursor-pointer" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <ImpactPill impact={item.impact} />
        <span className="text-xs text-slate-600">{item.sector}</span>
      </div>
      <h4 className="v5-body text-sm font-medium leading-snug text-slate-100">
        {item.headline}
      </h4>
      <p className="v5-body mt-2 text-sm text-slate-500">{item.summary}</p>
      {hasLink && (
        <div className="v5-mono mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <ExternalLink size={11} />
          {item.source || "Read full story"}
        </div>
      )}
    </CardTag>
  );
}

function IntlIndexRow({ index }) {
  const isUp = index.change >= 0;
  return (
    <div className="v5-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="v5-display font-medium text-slate-100">
            {index.name}
          </h4>
          <p className="text-xs text-slate-500">{index.region}</p>
        </div>
        <span
          className="v5-mono flex items-center gap-1 text-sm font-semibold"
          style={{ color: isUp ? EMERALD : ROSE }}
        >
          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isUp ? "+" : ""}
          {index.change}%
        </span>
      </div>
      <p className="v5-body mt-2 text-sm text-slate-500">{index.effect}</p>
    </div>
  );
}

function RuleAccordion({ rule, isOpen, onToggle }) {
  return (
    <div className="v5-card rounded-xl">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="v5-body text-sm font-medium text-slate-100">
          {rule.title}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div
          className="v5-body px-4 pb-4 pt-3 text-sm leading-relaxed text-slate-400"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          {rule.body}
        </div>
      )}
    </div>
  );
}

export default function Learn() {
  const [showWallet, setShowWallet] = useState(true);
  const [openRule, setOpenRule] = useState("stoploss");
  const [news, setNews] = useState(NEWS_SEED);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // ── Real news wiring ────────────────────────────────────
  // Backend (node-cron in Express) pulls fresh headlines every
  // 5-10min, tags impact via Groq, writes to Supabase `market_news`,
  // then emits over the existing Socket.IO server. This effect
  // fetches the initial batch and subscribes to live pushes.
  // Falls back to NEWS_SEED if Supabase/socket aren't reachable
  // (e.g. local dev without backend running).
  useEffect(() => {
    let socket;

    async function loadInitialNews() {
      try {
        const { data, error } = await supabase
          .from("market_news")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(12);

        if (error || !data?.length) return; // keep NEWS_SEED fallback

        setNews(
          data.map((row) => ({
            id: row.id,
            headline: row.headline,
            sector: row.sector,
            impact: row.impact,
            summary: row.summary,
            source: row.source,
            source_url: row.source_url,
          }))
        );
        setLastUpdated(new Date(data[0].created_at));
      } catch {
        // supabase client not wired yet locally — silently keep mock data
      }
    }

    async function subscribeToLiveNews() {
      try {
        socket = io(import.meta.env.VITE_SOCKET_URL);
        socket.on("connect", () => setIsLive(true));
        socket.on("disconnect", () => setIsLive(false));
        socket.on("news:update", (item) => {
          setNews((prev) => [item, ...prev].slice(0, 12));
          setLastUpdated(new Date());
        });
      } catch {
        setIsLive(false);
      }
    }

    loadInitialNews();
    subscribeToLiveNews();

    const tick = setInterval(() => setLastUpdated((d) => d), 30000);
    return () => {
      clearInterval(tick);
      socket?.disconnect();
    };
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    supabase
      .from("market_news")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (data?.length) {
          setNews(
            data.map((row) => ({
              id: row.id,
              headline: row.headline,
              sector: row.sector,
              impact: row.impact,
              summary: row.summary,
            source: row.source,
            source_url: row.source_url,
            }))
          );
          setLastUpdated(new Date());
        }
      })
      .finally(() => setRefreshing(false));
  }

  return (
    <div className="v5-root min-h-screen flex relative text-white/85" style={{ background: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body { font-family: 'Inter', sans-serif; }
        .v5-card { background: ${CARD}; border: 1px solid ${BORDER}; transition: border-color 0.2s ease; }
        .v5-card:hover { border-color: rgba(255,255,255,0.16); }
      `}</style>

      <AmbientBackground opacity={0.13} />
      <Sidebar />

      <main className="flex-1 min-w-0 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-7 pb-24 lg:pb-7 space-y-10">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2" style={{ color: EMERALD }}>
              <BookOpen size={18} />
              <span className="v5-mono text-sm font-medium">Learn</span>
            </div>
            <h1 className="v5-display mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
              Trade smarter, not louder
            </h1>
            <p className="v5-body mt-2 max-w-2xl text-sm text-slate-500">
              Stories from the market's biggest names, news that actually
              moves stocks, and the unwritten rules that keep beginners from
              losing their shirt.
            </p>
          </div>

          {/* Paper trading banner */}
          {showWallet && (
            <PaperWalletBanner onDismiss={() => setShowWallet(false)} />
          )}

          {/* Market-moving news */}
          <section>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <h2 className="v5-display text-lg font-semibold text-slate-50">
                What's moving the market
              </h2>
              <div className="flex items-center gap-3">
                {isLive && (
                  <span
                    className="v5-mono flex items-center gap-1.5 text-xs"
                    style={{ color: EMERALD }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span
                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                        style={{ background: EMERALD }}
                      />
                      <span
                        className="relative inline-flex h-2 w-2 rounded-full"
                        style={{ background: EMERALD }}
                      />
                    </span>
                    Live
                  </span>
                )}
                <span className="v5-mono flex items-center gap-1 text-xs text-slate-600">
                  <Clock size={12} />
                  Updated {timeAgo(lastUpdated)}
                </span>
                <button
                  onClick={handleRefresh}
                  className="v5-icon-btn flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400"
                  style={{ border: `1px solid ${BORDER}` }}
                >
                  <RefreshCw
                    size={12}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {news.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          {/* Wise decisions / avoid loss */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert size={18} style={{ color: ROSE }} />
              <h2 className="v5-display text-lg font-semibold text-slate-50">
                Rules that prevent avoidable losses
              </h2>
            </div>
            <div className="space-y-2">
              {WISE_RULES.map((rule) => (
                <RuleAccordion
                  key={rule.id}
                  rule={rule}
                  isOpen={openRule === rule.id}
                  onToggle={() =>
                    setOpenRule(openRule === rule.id ? null : rule.id)
                  }
                />
              ))}
            </div>
          </section>

          {/* International markets */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Globe size={18} className="text-slate-400" />
              <h2 className="v5-display text-lg font-semibold text-slate-50">
                Global markets, local impact
              </h2>
            </div>
            <p className="v5-body mb-4 max-w-2xl text-sm text-slate-500">
              NSE and BSE don't move in isolation. Overnight moves in these
              indices often set the tone for tomorrow's opening bell in
              India.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {INTL_INDICES.map((idx) => (
                <IntlIndexRow key={idx.id} index={idx} />
              ))}
            </div>
          </section>

          {/* Stock tycoons */}
          <section>
            <h2 className="v5-display mb-4 text-lg font-semibold text-slate-50">
              Lessons from market legends
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TYCOONS.map((t) => (
                <TycoonCard key={t.id} tycoon={t} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}