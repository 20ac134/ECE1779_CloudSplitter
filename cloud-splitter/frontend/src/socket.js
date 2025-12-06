import { io } from 'socket.io-client';
const origin = import.meta.env.VITE_API_ORIGIN || 'http://localhost:8080';
export const socket = io(origin, { transports: ['websocket'] });
