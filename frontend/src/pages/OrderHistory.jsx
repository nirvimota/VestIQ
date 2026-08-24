import { useContext, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TradingContext } from "../context/TradingContext";
import { useAuth } from "../context/AuthContext";
import { listOrders } from "../services/orderApi";
import Sidebar from "../components/layout/Sidebar";
import AmbientBackground from "../components/layout/AmbientBackground";
import { Receipt, Landmark, X, Copy, CreditCard, ShieldCheck } from "lucide-react";

// ---------------------------------------------------------------------------
// Design tokens — kept in sync with Dashboard v5.1
// ---------------------------------------------------------------------------
const INK = "#0A0F1A";
const CARD = "#111826";
const BORDER = "#1E2838";
const TEXT = "#ECEEF0";
const SUB = "#8A93A6";
const MUTE = "#4E5A70";
const TEAL = "#2ED9B8";
const RED = "#EF5A5A";

// existing hardcoded mock — kept as fallback/seed data
const MOCK_ORDERS = [
  { id: "ord_1", symbol: "RELIANCE", type: "BUY", qty: 10, price: 2456.75, timestamp: "2026-07-20T09:32:00Z" },
  { id: "ord_2", symbol: "TCS", type: "SELL", qty: 5, price: 3890.10, timestamp: "2026-07-22T11:05:00Z" },
  { id: "ord_3", symbol: "HDFCBANK", type: "BUY", qty: 15, price: 1642.30, timestamp: "2026-07-24T14:12:00Z" },
];

// Replace with real data from your auth/profile context once wired up —
// this is a placeholder shape so the modal works standalone.
const MOCK_ACCOUNT = {
  holderName: "Alex Morgan",
  accountNumber: "502100123456789",
  ifsc: "HDFC0001234",
  bankName: "HDFC Bank",
  upiId: "alexmorgan@okhdfcbank",
  demat: "IN30045012345678",
  kycStatus: "Verified",
};

function maskAccountNumber(num) {
  if (!num) return "—";
  const last4 = num.slice(-4);
  return `•••• •••• ${last4}`;
}

function CopyableRow({ icon: Icon, label, value, copyValue }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyValue ?? value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{ background: INK, border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${TEAL}1A`, color: TEAL }}
        >
          <Icon size={14} />
        </div>
        <div className="min-w-0">
          <p className="v5-body text-[11px]" style={{ color: MUTE }}>{label}</p>
          <p className="v5-mono text-sm truncate" style={{ color: TEXT }}>{value}</p>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="v5-body text-[11px] shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-colors"
        style={{ background: copied ? `${TEAL}1A` : BORDER, color: copied ? TEAL : SUB }}
      >
        <Copy size={11} />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function AccountDetailsModal({ open, onClose, account = MOCK_ACCOUNT }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(10,15,26,0.72)" }}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <p className="v5-display text-base" style={{ color: TEXT }}>Account &amp; Payment Details</p>
                <p className="v5-body text-[11px] mt-0.5" style={{ color: MUTE }}>{account.holderName}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: INK, color: SUB }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-2.5">
              <CopyableRow
                icon={Landmark}
                label="Bank account number"
                value={maskAccountNumber(account.accountNumber)}
                copyValue={account.accountNumber}
              />
              <CopyableRow icon={CreditCard} label="IFSC code" value={account.ifsc} />
              <CopyableRow icon={Landmark} label="Bank" value={account.bankName} />
              <CopyableRow icon={CreditCard} label="UPI ID" value={account.upiId} />
              <CopyableRow icon={CreditCard} label="Demat account" value={account.demat} />

              <div className="flex items-center gap-2 mt-1 px-4 py-2.5 rounded-xl" style={{ background: `${TEAL}0D` }}>
                <ShieldCheck size={14} style={{ color: TEAL }} />
                <span className="v5-body text-[11px]" style={{ color: TEAL }}>
                  KYC {account.kycStatus} — settlement funds move only to this account
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const cardHover = { y: -3, borderColor: "rgba(255,255,255,0.16)" };
const cardTransition = { type: "spring", stiffness: 300, damping: 24 };

const TABS = [
  { key: "orders", label: "Orders", icon: Receipt },
  { key: "account", label: "Account Details", icon: Landmark },
];

export default function OrderHistory() {
  const { transactions } = useContext(TradingContext);
  const [tab, setTab] = useState("orders");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [dbOrders, setDbOrders] = useState([]);
  const { session } = useAuth();
  const token = session?.access_token;

  useEffect(() => {
    if (!token) return;
    listOrders(token)
      .then((data) => {
        if (Array.isArray(data)) {
          setDbOrders(data);
        }
      })
      .catch((err) => console.error("Failed to load backend orders:", err));
  }, [token]);

  // merge: context transactions first (newest), then dbOrders, then mock, de-duped by compound key
  const allOrders = useMemo(() => {
    const seen = new Set();
    
    // Normalize DB orders
    const normalizedDb = dbOrders.map(o => ({
      id: o.id,
      symbol: o.symbol,
      type: (o.side || 'buy').toUpperCase(),
      qty: o.quantity || o.qty,
      price: Number(o.price || 0),
      timestamp: o.created_at || o.timestamp,
    }));

    const merged = [...transactions, ...normalizedDb, ...MOCK_ORDERS].filter((o) => {
      // De-duplicate by symbol, quantity, price, and rough time (minute precision)
      const dateStr = o.timestamp ? new Date(o.timestamp).toISOString().slice(0, 16) : '';
      const key = `${o.symbol}_${dateStr}_${o.qty}_${o.price}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [transactions, dbOrders]);

  const handleTabClick = (key) => {
    if (key === "account") {
      // "Account Details" isn't a page section — it pops the modal open
      // and the tab itself snaps back to "orders" underneath.
      setShowAccountModal(true);
      return;
    }
    setTab(key);
  };

  return (
    <div className="v5-root min-h-screen flex relative" style={{ background: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap');
        .v5-display { font-family: 'Space Grotesk', sans-serif; }
        .v5-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .v5-body { font-family: 'Inter', sans-serif; }
        .v5-card { background: ${CARD}; border: 1px solid ${BORDER}; transition: border-color 0.2s ease; }
      `}</style>

      <AmbientBackground opacity={0.13} />
      <Sidebar />

      {/* Main */}
      <main className="flex-1 min-w-0 relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-7 pb-24 lg:pb-7">
          <h1 className="v5-display text-xl" style={{ color: TEXT }}>Order History</h1>

          {/* Pill tab switch — Orders / Account Details */}
          <div className="relative flex items-center gap-1 v5-card rounded-full p-1 w-fit mt-4">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => handleTabClick(t.key)}
                  className="v5-body relative text-xs px-4 py-2 rounded-full flex items-center gap-1.5"
                  style={{ color: active ? INK : SUB }}
                >
                  {active && (
                    <motion.div
                      layoutId="orderhistory-tab-pill"
                      className="absolute inset-0 rounded-full"
                      style={{ background: TEAL }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <Icon size={13} />
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          {allOrders.length === 0 ? (
            <p className="v5-body text-sm mt-6" style={{ color: MUTE }}>No orders yet.</p>
          ) : (
            <div className="flex flex-col gap-2 mt-6">
              {allOrders.map((o) => (
                <motion.div
                  key={o.id}
                  whileHover={cardHover}
                  transition={cardTransition}
                  className="v5-card rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="v5-body text-sm font-medium" style={{ color: TEXT }}>{o.symbol}</p>
                    <p className="v5-mono text-[11px] mt-0.5" style={{ color: MUTE }}>
                      {new Date(o.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="v5-body text-sm font-medium"
                      style={{ color: o.type === "BUY" ? TEAL : RED }}
                    >
                      {o.type}
                    </p>
                    <p className="v5-mono text-sm mt-0.5" style={{ color: SUB }}>
                      {o.qty} @ ₹{o.price.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <AccountDetailsModal open={showAccountModal} onClose={() => setShowAccountModal(false)} />
    </div>
  );
}