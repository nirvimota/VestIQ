export function registerOrderStatusSocket(io, socket) {
  socket.on('subscribe:orders', (userId) => {
    if (userId) socket.join(`orders:${userId}`);
  });
}

export function emitOrderUpdate(io, userId, order) {
  io.to(`orders:${userId}`).emit('order:update', order);
}