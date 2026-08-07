import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Loader2, Star, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';
import { useAuth } from '../context/AuthContext';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../services/watchlistApi';
import { searchStocks, getStockQuote } from '../services/stockApi';

function fmt(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Watchlist() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const token = session?.access_token;

  // ── Watchlist items ──────────────────────────────────────────────────────
  const [items, setItems] = useState([]);       // { id, symbol, price, change_pct, ... }
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(null);

  // ── Add-stock panel ──────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [adding, setAdding] = useState(new Set()); // symbols currently being added
  const [removing, setRemoving] = useState(new Set()); // symbols currently being removed

  // ── Load watchlist from backend ──────────────────────────────────────────
  const loadWatchlist = useCallback(async () => {
    if (!token) return;
    setLoadingList(true);
    setListError(null);
    try {
      const data = await getWatchlist(token);
      const baseItems = (data || []).map(i => ({ id: i.id, symbol: i.symbol, price: null, change_pct: null, _loading: true }));
      setItems(baseItems);

      // Fetch live prices for each symbol in parallel
      const symbols = baseItems.map(i => i.symbol);
      if (symbols.length > 0) {
        const quotes = await Promise.allSettled(symbols.map(sym => getStockQuote(sym)));
        setItems(prev => prev.map((item, idx) => {
          const r = quotes[idx];
          if (r.status === 'fulfilled') {
            return { ...item, ...r.value, _loading: false };
          }
          return { ...item, _loading: false, _error: true };
        }));
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
      setListError('Could not load your watchlist. Please try again.');
    } finally {
      setLoadingList(false);
    }
  }, [token]);

  useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

  // ── Search NSE stocks ────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim() || search.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchStocks(search);
        setSearchResults(res || []);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Add to watchlist ─────────────────────────────────────────────────────
  const handleAdd = useCallback(async (symbol) => {
    if (!token) { navigate('/login'); return; }
    if (adding.has(symbol)) return;
    const alreadyIn = items.some(i => i.symbol === symbol);
    if (alreadyIn) return;

    setAdding(prev => new Set(prev).add(symbol));
    try {
      await addToWatchlist(symbol, token);
      // Reload list to get the persisted item with live price
      await loadWatchlist();
    } catch (err) {
      console.error('Add to watchlist failed:', err.message);
    } finally {
      setAdding(prev => { const n = new Set(prev); n.delete(symbol); return n; });
    }
  }, [token, adding, items, loadWatchlist, navigate]);

  // ── Remove from watchlist ────────────────────────────────────────────────
  const handleRemove = useCallback(async (symbol) => {
    if (!token || removing.has(symbol)) return;
    setRemoving(prev => new Set(prev).add(symbol));
    try {
      await removeFromWatchlist(symbol, token);
      setItems(prev => prev.filter(i => i.symbol !== symbol));
    } catch (err) {
      console.error('Remove from watchlist failed:', err.message);
    } finally {
      setRemoving(prev => { const n = new Set(prev); n.delete(symbol); return n; });
    }
  }, [token, removing]);

  const watchedSymbols = new Set(items.map(i => i.symbol));

  return (
    <div className="min-h-screen flex bg-[#0A0F1A] text-[#ECEEF0] font-sans">
      <AmbientBackground opacity={0.12} />
      <Sidebar />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#ECEEF0]">Watchlist</h1>
            <p className="text-xs text-[#8A93A6] mt-0.5">
              {items.length} stock{items.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadWatchlist}
              title="Refresh prices"
              className="p-2 rounded-xl bg-[#111826] border border-[#1E2838] text-[#8A93A6] hover:text-[#2ED9B8] transition-colors"
            >
              <RefreshCw size={15} className={loadingList ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => { setShowAdd(v => !v); setSearch(''); setSearchResults([]); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                showAdd
                  ? 'bg-[#1E2838] text-[#8A93A6]'
                  : 'bg-[#2ED9B8] text-[#0A0F1A] hover:opacity-90'
              }`}
            >
              <Plus size={15} />
              {showAdd ? 'Close' : 'Add Stock'}
            </button>
          </div>
        </div>

        {/* Add Stock Panel */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-5 bg-[#111826] border border-[#1E2838] rounded-2xl p-4"
            >
              <p className="text-xs text-[#8A93A6] mb-3 font-mono">Search any NSE stock to add to your watchlist</p>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-3 text-[#4E5A70]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. BAJFINANCE, WIPRO, MARUTI..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0A0F1A] border border-[#1E2838] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#ECEEF0] placeholder-[#4E5A70] focus:outline-none focus:border-[#2ED9B8] transition-colors"
                />
              </div>

              {/* Search results */}
              <div className="mt-3 max-h-56 overflow-y-auto space-y-1">
                {isSearching && (
                  <div className="flex items-center gap-2 text-xs text-[#8A93A6] py-3 px-2 font-mono">
                    <Loader2 size={13} className="animate-spin" /> Searching NSE...
                  </div>
                )}
                {!isSearching && search.length >= 2 && searchResults.length === 0 && (
                  <p className="text-xs text-[#4E5A70] py-3 px-2">
                    No results found. Try the full NSE symbol.
                  </p>
                )}
                {!isSearching && searchResults.map((s) => {
                  const already = watchedSymbols.has(s.symbol);
                  const isAdding = adding.has(s.symbol);
                  return (
                    <div
                      key={s.symbol}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#1E2838]/60 transition-colors"
                    >
                      <div>
                        <p className="font-mono text-sm font-bold text-[#2ED9B8]">{s.symbol}</p>
                        <p className="text-xs text-[#8A93A6] truncate max-w-[220px]">{s.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#4E5A70] font-mono px-2 py-0.5 bg-[#0A0F1A] rounded border border-[#1E2838]">
                          {s.exchange || 'NSE'}
                        </span>
                        {already ? (
                          <span className="text-xs text-[#2ED9B8] font-mono px-3 py-1 border border-[#2ED9B8]/30 rounded-lg bg-[#2ED9B8]/10">
                            ✓ Added
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAdd(s.symbol)}
                            disabled={isAdding}
                            className="flex items-center gap-1 text-xs font-medium text-[#0A0F1A] bg-[#2ED9B8] px-3 py-1 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                          >
                            {isAdding ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                            Watch
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!isSearching && search.length < 2 && (
                  <p className="text-xs text-[#4E5A70] py-2 px-2">Type at least 2 characters to search...</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Watchlist rows */}
        {listError && (
          <div className="text-sm text-[#EF5A5A] bg-[#EF5A5A]/10 border border-[#EF5A5A]/20 rounded-xl px-4 py-3 mb-4">
            {listError}
            <button onClick={loadWatchlist} className="ml-2 underline text-[#EF5A5A] text-xs">Retry</button>
          </div>
        )}

        <div className="space-y-3">
          {loadingList && items.length === 0 ? (
            // Skeleton rows
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between bg-[#111826] border border-[#1E2838] rounded-2xl px-5 py-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1E2838]" />
                  <div className="space-y-2">
                    <div className="h-3 w-20 rounded bg-[#1E2838]" />
                    <div className="h-2 w-32 rounded bg-[#1E2838]" />
                  </div>
                </div>
                <div className="h-3 w-16 rounded bg-[#1E2838]" />
              </div>
            ))
          ) : items.length === 0 && !loadingList ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Star size={40} className="text-[#2ED9B8] mb-4 opacity-40" />
              <p className="text-[#8A93A6] text-sm">Your watchlist is empty.</p>
              <p className="text-[#4E5A70] text-xs mt-1">Click <strong className="text-[#2ED9B8]">Add Stock</strong> to track NSE stocks.</p>
            </div>
          ) : (
            <AnimatePresence>
              {items.map((s) => {
                const up = (s.change_pct ?? 0) >= 0;
                const isRemoving = removing.has(s.symbol);
                return (
                  <motion.div
                    key={s.symbol}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between bg-[#111826] border border-[#1E2838] rounded-2xl px-5 py-4 hover:border-[#2ED9B8]/30 transition-colors"
                  >
                    {/* Symbol + name */}
                    <div
                      onClick={() => navigate(`/stock/${s.symbol}`)}
                      className="flex-1 cursor-pointer flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#0A0F1A] border border-[#1E2838] flex items-center justify-center font-mono text-xs font-bold text-[#2ED9B8]">
                        {s.symbol.substring(0, 3)}
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold text-[#ECEEF0] hover:text-[#2ED9B8] transition-colors">
                          {s.symbol}
                        </p>
                        <p className="text-[#8A93A6] text-xs truncate">{s.name || s.symbol}</p>
                      </div>
                    </div>

                    {/* Price + change */}
                    <div className="text-right mr-4">
                      {s._loading ? (
                        <div className="animate-pulse space-y-1">
                          <div className="h-3 w-20 rounded bg-[#1E2838]" />
                          <div className="h-2 w-12 rounded bg-[#1E2838] ml-auto" />
                        </div>
                      ) : s._error || s.price == null ? (
                        <p className="text-xs text-[#4E5A70]">Unavailable</p>
                      ) : (
                        <>
                          <p className="font-mono text-sm font-semibold text-[#ECEEF0]">₹{fmt(s.price)}</p>
                          <p className={`font-mono text-xs flex items-center justify-end gap-0.5 ${up ? 'text-[#2ED9B8]' : 'text-[#EF5A5A]'}`}>
                            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {up ? '+' : ''}{(s.change_pct ?? 0).toFixed(2)}%
                          </p>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/order/${s.symbol}?side=buy`}
                        className="px-4 py-1.5 rounded-full bg-[#2ED9B8] text-[#0A0F1A] text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Buy
                      </Link>
                      <button
                        onClick={() => handleRemove(s.symbol)}
                        disabled={isRemoving}
                        title="Remove from watchlist"
                        className="p-2 rounded-xl bg-[#1E2838] text-[#4E5A70] hover:text-[#EF5A5A] hover:bg-[#EF5A5A]/10 transition-colors disabled:opacity-50"
                      >
                        {isRemoving
                          ? <Loader2 size={14} className="animate-spin" />
                          : <X size={14} />
                        }
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}