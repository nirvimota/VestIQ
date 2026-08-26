import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { registerPriceSocket } from './priceSocket.js';
import { registerOrderStatusSocket } from './orderStatusSocket.js';

// Support comma-separated CLIENT_ORIGIN values (same as app.js corsOptions)
const allowedOrigins = env.clientOrigin
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export function attachSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    registerPriceSocket(io, socket);
    registerOrderStatusSocket(io, socket);
    socket.on('disconnect', () => {});
  });

  return io;
}