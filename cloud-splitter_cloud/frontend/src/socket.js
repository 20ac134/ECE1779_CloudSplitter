import { io } from 'socket.io-client';
const origin = import.meta.env.VITE_API_ORIGIN || 'http://142.93.155.200:8080';
export const socket = io(origin, { transports: ['websocket'] });
