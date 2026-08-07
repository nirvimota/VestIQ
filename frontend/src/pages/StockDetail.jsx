import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getStockQuote, getAIStockAnalysis, getStockHistory } from '../services/stockApi';
import Sidebar from '../components/layout/Sidebar';
import AmbientBackground from '../components/layout/AmbientBackground';
import { Sparkles, ArrowLeft, TrendingUp, TrendingDown, RefreshCw, X } from 'lucide-react';

function useIsDesktop(breakpoint = 768) {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= breakpoint : true
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isDesktop;
}

export default function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();

  // Only treat this as a popup if we arrived via in-app navigation that set
  // backgroundLocation (Dashboard's openStock) AND we're on a desktop-width
  // screen. A hard refresh or a direct link loses location.state, so it
  // falls back to a normal full page automatically.
  const isModal = isDesktop && Boolean(location.state?.backgroundLocation);

  const [quote, setQuote] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadQuote() {
      try {
        setLoadingQuote(true);
        const data = await getStockQuote(symbol);
        setQuote(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch quote');
      } finally {
        setLoadingQuote(false);
      }
    }
    loadQuote();
  }, [symbol]);

  const handleFetchAI = async () => {
    try {
      setLoadingAi(true);
      const token = localStorage.getItem('token');
      const analysis = await getAIStockAnalysis(symbol, token);
      setAiAnalysis(analysis);
    } catch (err) {
      setAiAnalysis(`AI Analysis unavailable: ${err.message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  const close = () => {
    if (isModal) {
      // go back to wherever we came from (Dashboard) instead of a raw -1,
      // in case someone deep-linked into a stack that doesn't have history
      navigate(location.state.backgroundLocation.pathname || '/dashboard', { replace: false });
    } else {
      navigate(-1);
    }
  };

  const isUp = (quote?.change_pct ?? 0) >= 0;

  const content = (
    <>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={close}
          className="inline-flex items-center gap-2 text-xs font-mono text-[#8A93A6] hover:text-[#ECEEF0] transition-colors"
        >
          {isModal ? <X size={16} /> : <ArrowLeft size={14} />}
          {isModal ? 'Close' : 'Back'}
        </button>
      </div>

      {loadingQuote ? (
        <div className="flex items-center justify-center py-20 text-[#8A93A6] font-mono text-sm">
          <RefreshCw size={18} className="animate-spin mr-2" /> Loading live market quote...
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[#ECEEF0]">
                {quote?.symbol || symbol}
              </h1>
              <p className="text-xs text-[#8A93A6] font-mono mt-1">
                {quote?.name || 'NSE Equity'} · {quote?.exchange || 'NSE'}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="font-mono text-3xl font-bold text-[#ECEEF0]">
                ₹{quote?.price ? quote.price.toLocaleString('en-IN') : 'N/A'}
              </p>
              {quote?.change !== undefined && (
                <p className={`font-mono text-sm flex items-center md:justify-end gap-1 ${isUp ? 'text-[#2ED9B8]' : 'text-[#EF5A5A]'}`}>
                  {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {isUp ? '+' : ''}{quote.change?.toFixed(2)} ({isUp ? '+' : ''}{quote.change_pct?.toFixed(2)}%)
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <div className="bg-[#111826] border border-[#1E2838] rounded-xl p-4">
              <p className="text-[#8A93A6] text-xs font-mono">Day High</p>
              <p className="font-mono text-sm mt-1 text-[#ECEEF0]">₹{quote?.high || 'N/A'}</p>
            </div>
            <div className="bg-[#111826] border border-[#1E2838] rounded-xl p-4">
              <p className="text-[#8A93A6] text-xs font-mono">Day Low</p>
              <p className="font-mono text-sm mt-1 text-[#ECEEF0]">₹{quote?.low || 'N/A'}</p>
            </div>
            <div className="bg-[#111826] border border-[#1E2838] rounded-xl p-4">
              <p className="text-[#8A93A6] text-xs font-mono">Open</p>
              <p className="font-mono text-sm mt-1 text-[#ECEEF0]">₹{quote?.open || 'N/A'}</p>
            </div>
            <div className="bg-[#111826] border border-[#1E2838] rounded-xl p-4">
              <p className="text-[#8A93A6] text-xs font-mono">Volume</p>
              <p className="font-mono text-sm mt-1 text-[#ECEEF0]">{quote?.volume ? quote.volume.toLocaleString('en-IN') : 'N/A'}</p>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="bg-[#111826] border border-[#1E2838] rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#2ED9B8]" />
                <h3 className="font-display text-base font-semibold text-[#ECEEF0]">
                  xAI Grok 4.5 Analyst Insight
                </h3>
              </div>

              {!aiAnalysis && (
                <button
                  onClick={handleFetchAI}
                  disabled={loadingAi}
                  className="px-4 py-2 rounded-full bg-[#2ED9B8] text-[#0A0F1A] text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loadingAi ? 'Analyzing...' : 'Generate AI Analysis'}
                </button>
              )}
            </div>

            {aiAnalysis ? (
              <div className="prose prose-invert max-w-none text-sm text-[#8A93A6] whitespace-pre-line leading-relaxed bg-[#0A0F1A]/60 border border-[#1E2838] p-4 rounded-xl">
                {aiAnalysis}
              </div>
            ) : (
              <p className="text-xs text-[#8A93A6]">
                Click above to run real-time xAI Grok analysis combining live quotes, fundamentals, and latest news sentiment for {symbol}.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/order/${symbol}?side=buy`)}
              className="flex-1 rounded-full bg-[#2ED9B8] text-[#0A0F1A] font-semibold py-3 text-sm hover:opacity-90 transition-opacity"
            >
              Buy {symbol}
            </button>
            <button
              onClick={() => navigate(`/order/${symbol}?side=sell`)}
              className="flex-1 rounded-full border border-[#EF5A5A] text-[#EF5A5A] font-semibold py-3 text-sm hover:bg-[#EF5A5A]/10 transition-colors"
            >
              Sell {symbol}
            </button>
          </div>
        </>
      )}
    </>
  );

  if (isModal) {
    return (
      <AnimatePresence>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(10,15,26,0.72)' }}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0A0F1A] border border-[#1E2838] rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6"
          >
            {content}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0A0F1A] text-[#ECEEF0]">
      <AmbientBackground opacity={0.12} />
      <Sidebar />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-8 pb-24">
        {content}
      </main>
    </div>
  );
}