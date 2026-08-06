import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';
import { searchStocks, getMovers } from '../services/stockApi';
import { Search, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

const DEFAULT_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 2945.6, prevClose: 2895.2 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', ltp: 3812.4, prevClose: 3848.1 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', ltp: 1675.2, prevClose: 1651.0 },
  { symbol: 'INFY', name: 'Infosys', ltp: 1462.1, prevClose: 1490.0 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', ltp: 1188.35, prevClose: 1203.3 },
  { symbol: 'SBIN', name: 'State Bank of India', ltp: 824.6, prevClose: 807.5 },
  { symbol: 'ITC', name: 'ITC Ltd', ltp: 462.9, prevClose: 465.8 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', ltp: 968.4, prevClose: 928.1 },
];

function fmt(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LiveMarket({
  watchlistSymbols = [],
  onToggleWatchlist = () => {},
}) {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState(DEFAULT_STOCKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const watchSet = new Set(watchlistSymbols);

  // Live stock search trigger
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

  const handleStockClick = (symbol) => {
    navigate(`/stock/${symbol}`);
  };

  return (
    <div className="min-h-screen flex bg-[#0A0F1A] text-[#ECEEF0] font-sans">
      <AmbientBackground opacity={0.12} />
      <Sidebar />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-8 pb-20">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-2xl font-bold text-[#ECEEF0]">Live Market</h1>
          <span className="inline-flex items-center gap-1.5 text-[#2ED9B8] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#2ED9B8] animate-pulse" /> NSE LIVE
          </span>
        </div>
        <p className="text-[#8A93A6] text-xs mb-6">Search any Indian stock symbol or click to view live details & Grok predictions.</p>

        {/* Global Stock Search Bar */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-3.5 text-[#8A93A6]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock symbol (e.g. RELIANCE, TCS, INFY, TATAMOTORS)..."
            className="w-full bg-[#111826] border border-[#1E2838] rounded-xl pl-11 pr-4 py-3 text-sm text-[#ECEEF0] placeholder-[#4E5A70] focus:outline-none focus:border-[#2ED9B8] transition-colors"
          />

          {/* Search Dropdown Results */}
          {searchQuery.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-14 bg-[#111826] border border-[#1E2838] rounded-xl overflow-hidden shadow-2xl z-30 max-h-72 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-xs font-mono text-[#8A93A6]">Searching Twelve Data NSE market...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <div
                    key={item.symbol}
                    onClick={() => handleStockClick(item.symbol)}
                    className="p-3.5 border-b border-[#1E2838] hover:bg-[#1E2838]/60 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="font-mono text-sm font-bold text-[#2ED9B8]">{item.symbol}</span>
                      <p className="text-xs text-[#8A93A6]">{item.name}</p>
                    </div>
                    <span className="text-[10px] font-mono text-[#4E5A70] px-2 py-0.5 rounded bg-[#0A0F1A] border border-[#1E2838]">
                      {item.exchange || 'NSE'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-xs text-[#8A93A6]">
                  No exact match. Click directly on any symbol to view live quotes and AI predictions.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stock List */}
        <div className="space-y-3">
          {stocks.map((s) => {
            const chg = s.ltp - s.prevClose;
            const chgPct = (chg / s.prevClose) * 100;
            const up = chg >= 0;
            const watchlisted = watchSet.has(s.symbol);

            return (
              <div
                key={s.symbol}
                className="flex items-center justify-between bg-[#111826] border border-[#1E2838] rounded-2xl px-5 py-4 hover:border-[#2ED9B8]/40 transition-colors"
              >
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

                <div className="text-right mr-4 cursor-pointer" onClick={() => handleStockClick(s.symbol)}>
                  <p className="font-mono text-sm font-semibold text-[#ECEEF0]">₹{fmt(s.ltp)}</p>
                  <p className={`font-mono text-xs flex items-center justify-end gap-0.5 ${up ? 'text-[#2ED9B8]' : 'text-[#EF5A5A]'}`}>
                    {up ? '+' : ''}{chgPct.toFixed(2)}%
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStockClick(s.symbol)}
                    className="px-3.5 py-1.5 rounded-full bg-[#1E2838] text-[#ECEEF0] text-xs font-mono hover:bg-[#2ED9B8] hover:text-[#0A0F1A] transition-colors flex items-center gap-1"
                  >
                    <Sparkles size={13} /> AI Predict
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
          })}
        </div>
      </main>
    </div>
  );
}