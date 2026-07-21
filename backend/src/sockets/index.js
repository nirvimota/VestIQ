import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { registerPriceSocket } from './priceSocket.js';
import { registerOrderStatusSocket } from './orderStatusSocket.js';

export function attachSockets(httpServer) {
  const io = new Server(httpServer, { cors: { origin: env.clientOrigin } });

  io.on('connection', (socket) => {
    registerPriceSocket(io, socket);
    registerOrderStatusSocket(io, socket);
    socket.on('disconnect', () => {});
  });

  return io;
}