import { io } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || API_BASE;

export const createSocket = () => {
  return io(WS_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true
  });
};

// const socket = createSocket();
// socket.emit('join', myUserId); // join room for this user
// socket.on('message', (msg) => {
//   // handle incoming message in UI
// });