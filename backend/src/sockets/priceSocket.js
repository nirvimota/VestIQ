import { getQuote } from '../services/marketDataService.js';

export function registerPriceSocket(io, socket) {
  const subscriptions = new Set();

  socket.on('subscribe:symbol', (symbol) => {
    if (symbol) subscriptions.add(symbol.toUpperCase());
  });

  socket.on('unsubscribe:symbol', (symbol) => {
    subscriptions.delete(symbol?.toUpperCase());
  });

  const interval = setInterval(async () => {
    for (const symbol of subscriptions) {
      const quote = await getQuote(symbol);
      if (quote) socket.emit(`price:${symbol}`, quote);
    }
  }, 2000);

  socket.on('disconnect', () => clearInterval(interval));
}