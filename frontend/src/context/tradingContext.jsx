// C:\nirvi\vestIQ\frontend\src\context\tradingContext.jsx
import { createContext, useState, useCallback } from "react";

export const TradingContext = createContext({
  transactions: [],
  watchlist: [],
  addTransaction: () => {},
  addToWatchlist: () => {},
});

export function TradingProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [watchlist, setWatchlist] = useState([]);

  const addTransaction = useCallback((order) => {
    // order: { symbol, type, qty, price }
    const tx = {
      id: `ord_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...order,
    };
    setTransactions((prev) => [tx, ...prev]);
    return tx;
  }, []);

  const addToWatchlist = useCallback((symbol) => {
    setWatchlist((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
  }, []);

  return (
    <TradingContext.Provider
      value={{ transactions, watchlist, addTransaction, addToWatchlist }}
    >
      {children}
    </TradingContext.Provider>
  );
}