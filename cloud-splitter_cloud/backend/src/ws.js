import { Server } from 'socket.io';

export function initWs(httpServer, corsOrigin) {
  const io = new Server(httpServer, { cors: { origin: corsOrigin, credentials: true } });
  io.on('connection', (socket) => {
    socket.on('join_group', (groupId) => socket.join(`group:${groupId}`));
  });
  return io;
}
