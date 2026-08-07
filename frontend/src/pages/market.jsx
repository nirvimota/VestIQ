import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';
import { searchStocks, getStockQuote, getStockQuotes } from '../services/stockApi';
import { addToWatchlist, removeFromWatchlist, getWatchlist } from '../services/watchlistApi';
import { useAuth } from '../context/AuthContext';
import { Search, Sparkles, TrendingUp, TrendingDown, Plus, Check, Loader2 } from 'lucide-react';

// Default NSE symbols to display on load
const DEFAULT_SYMBOLS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries' },
  { symbol: 'TCS',      name: 'Tata Consultancy Services' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank' },
  { symbol: 'INFY',     name: 'Infosys' },
  { symbol: 'ICICIBANK',name: 'ICICI Bank' },
  { symbol: 'SBIN',     name: 'State Bank of India' },
  { symbol: 'ITC',      name: 'ITC Ltd' },
  { symbol: 'TATAMOTORS',name:'Tata Motors' },
];

function fmt(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StockSkeleton() {
  return (
    <div className="flex items-center justify-between bg-[#111826] border border-[#1E2838] rounded-2xl px-5 py-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#1E2838]" />
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-[#1E2838]" />
          <div className="h-2 w-36 rounded bg-[#1E2838]" />
        </div>
      </div>
      <div className="space-y-2 text-right">
        <div className="h-3 w-20 rounded bg-[#1E2838]" />
        <div className="h-2 w-14 rounded bg-[#1E2838]" />
      </div>
    </div>
  );
}

export default function LiveMarket() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const token = session?.access_token;

  const [stocks, setStocks] = useState([]);   // { symbol, name, price, change_pct, _loading }
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Watchlist state: set of symbols currently in user's watchlist
  const [watchedSet, setWatchedSet] = useState(new Set());
  const [watchlistLoading, setWatchlistLoading] = useState(new Set()); // symbols being toggled

  // ── Load watchlist symbols on mount ──────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    getWatchlist(token)
      .then(items => {
        const syms = (items || []).map(i => i.symbol);
        setWatchedSet(new Set(syms));
      })
      .catch(err => console.error('Watchlist load failed:', err));
  }, [token]);

  // ── Fetch live prices for DEFAULT_SYMBOLS ─────────────────────────────────
  useEffect(() => {
    setLoadingPrices(true);
    setStocks(DEFAULT_SYMBOLS.map(s => ({ ...s, price: null, change_pct: null, _loading: true })));

    const fetchPrices = async () => {
      try {
        const symbolList = DEFAULT_SYMBOLS.map(s => s.symbol);
        const quotesMap = await getStockQuotes(symbolList);
        setStocks(
          DEFAULT_SYMBOLS.map(s => ({
            ...s,
            ...(quotesMap[s.symbol] || {}),
            _loading: false,
            _error: !quotesMap[s.symbol] || quotesMap[s.symbol]._unavailable,
          }))
        );
      } catch (err) {
        console.error('Batch quote fetch failed, falling back to individual calls:', err);
        const results = await Promise.allSettled(
          DEFAULT_SYMBOLS.map(s => getStockQuote(s.symbol).then(q => ({ ...s, ...q, _loading: false })))
        );
        setStocks(results.map((r, i) =>
          r.status === 'fulfilled' ? r.value : { ...DEFAULT_SYMBOLS[i], _loading: false, _error: true }
        ));
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPrices();
  }, []);

  // ── Search ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchStocks(searchQuery);
        setSearchResults(results || []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Watchlist toggle ──────────────────────────────────────────────────────
  const toggleWatchlist = useCallback(async (symbol, e) => {
    e.stopPropagation();
    if (!token) { navigate('/login'); return; }
    if (watchlistLoading.has(symbol)) return;

    setWatchlistLoading(prev => new Set(prev).add(symbol));
    try {
      if (watchedSet.has(symbol)) {
        await removeFromWatchlist(symbol, token);
        setWatchedSet(prev => { const n = new Set(prev); n.delete(symbol); return n; });
      } else {
        await addToWatchlist(symbol, token);
        setWatchedSet(prev => new Set(prev).add(symbol));
      }
    } catch (err) {
      console.error('Watchlist toggle failed:', err);
    } finally {
      setWatchlistLoading(prev => { const n = new Set(prev); n.delete(symbol); return n; });
    }
  }, [token, watchedSet, watchlistLoading, navigate]);

  const handleStockClick = (symbol) => {
    navigate(`/stock/${symbol}`, { state: { backgroundLocation: location } });
  };

  return (
    <div className="min-h-screen flex bg-[#0A0F1A] text-[#ECEEF0] font-sans">
      <AmbientBackground opacity={0.12} />
      <Sidebar />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-2xl font-bold text-[#ECEEF0]">Live Market</h1>
          <span className="inline-flex items-center gap-1.5 text-[#2ED9B8] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#2ED9B8] animate-pulse" /> NSE LIVE
          </span>
        </div>
        <p className="text-[#8A93A6] text-xs mb-6">
          Real-time NSE prices via Twelve Data. Click any stock to view live details &amp; AI predictions.
        </p>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-3.5 text-[#8A93A6]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search NSE stock (e.g. RELIANCE, TCS, INFY, TATAMOTORS)..."
            className="w-full bg-[#111826] border border-[#1E2838] rounded-xl pl-11 pr-4 py-3 text-sm text-[#ECEEF0] placeholder-[#4E5A70] focus:outline-none focus:border-[#2ED9B8] transition-colors"
          />

          {searchQuery.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-14 bg-[#111826] border border-[#1E2838] rounded-xl overflow-hidden shadow-2xl z-30 max-h-72 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-xs font-mono text-[#8A93A6] flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" /> Searching NSE market...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <div
                    key={item.symbol}
                    className="p-3.5 border-b border-[#1E2838] hover:bg-[#1E2838]/60 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div onClick={() => handleStockClick(item.symbol)} className="flex-1">
                      <span className="font-mono text-sm font-bold text-[#2ED9B8]">{item.symbol}</span>
                      <p className="text-xs text-[#8A93A6]">{item.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#4E5A70] px-2 py-0.5 rounded bg-[#0A0F1A] border border-[#1E2838]">
                        {item.exchange || 'NSE'}
                      </span>
                      {token && (
                        <button
                          onClick={(e) => toggleWatchlist(item.symbol, e)}
                          disabled={watchlistLoading.has(item.symbol)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            watchedSet.has(item.symbol)
                              ? 'bg-[#2ED9B8]/20 text-[#2ED9B8]'
                              : 'bg-[#1E2838] text-[#8A93A6] hover:text-[#2ED9B8]'
                          }`}
                        >
                          {watchlistLoading.has(item.symbol)
                            ? <Loader2 size={13} className="animate-spin" />
                            : watchedSet.has(item.symbol)
                              ? <Check size={13} />
                              : <Plus size={13} />
                          }
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-[#8A93A6]">
                  No results found. Try the full symbol e.g. <span className="text-[#2ED9B8] font-mono">HDFCBANK</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stock list */}
        <div className="space-y-3">
          {loadingPrices
            ? DEFAULT_SYMBOLS.map(s => <StockSkeleton key={s.symbol} />)
            : stocks.map((s) => {
                const up = (s.change_pct ?? 0) >= 0;
                const watched = watchedSet.has(s.symbol);
                const toggling = watchlistLoading.has(s.symbol);

                return (
                  <div
                    key={s.symbol}
                    className="flex items-center justify-between bg-[#111826] border border-[#1E2838] rounded-2xl px-5 py-4 hover:border-[#2ED9B8]/40 transition-colors"
                  >
                    {/* Symbol + name */}
                    <div
                      onClick={() => handleStockClick(s.symbol)}
                      className="flex-1 cursor-pointer flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#0A0F1A] border border-[#1E2838] flex items-center justify-center font-mono text-xs font-bold text-[#2ED9B8]">
                        {s.symbol.substring(0, 3)}
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold text-[#ECEEF0] hover:text-[#2ED9B8] transition-colors">
                          {s.symbol}
                        </p>
                        <p className="text-[#8A93A6] text-xs truncate">{s.name}</p>
                      </div>
                    </div>

                    {/* Price + change */}
                    <div className="text-right mr-4 cursor-pointer" onClick={() => handleStockClick(s.symbol)}>
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
                      {/* Watchlist toggle */}
                      {token && (
                        <button
                          onClick={(e) => toggleWatchlist(s.symbol, e)}
                          disabled={toggling}
                          title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                          className={`p-2 rounded-xl transition-all ${
                            watched
                              ? 'bg-[#2ED9B8]/20 text-[#2ED9B8] border border-[#2ED9B8]/40'
                              : 'bg-[#1E2838] text-[#8A93A6] hover:text-[#2ED9B8] border border-transparent'
                          }`}
                        >
                          {toggling
                            ? <Loader2 size={14} className="animate-spin" />
                            : watched ? <Check size={14} /> : <Plus size={14} />
                          }
                        </button>
                      )}

                      <button
                        onClick={() => handleStockClick(s.symbol)}
                        className="px-3.5 py-1.5 rounded-full bg-[#1E2838] text-[#ECEEF0] text-xs font-mono hover:bg-[#2ED9B8] hover:text-[#0A0F1A] transition-colors flex items-center gap-1"
                      >
                        <Sparkles size={13} /> AI
                      </button>

                      <button
                        onClick={() => navigate(`/order/${s.symbol}?side=buy`)}
                        className="px-4 py-1.5 rounded-full bg-[#2ED9B8] text-[#0A0F1A] text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </main>
    </div>
  );
}