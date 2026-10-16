import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function initSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('gym_access_token');
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // Socket.IO chạy cùng backend (port 3001). Nếu apiUrl là /api thì cắt về gốc
  const wsUrl = url.replace(/\/api\/?$/, '');

  socket = io(wsUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    forceNew: false,
  });

  socket.on('connect_error', (err) => {
    // Chỉ log nhẹ để tránh nhiễu
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ws] connect_error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    // Thường vô tình disconnect — client sẽ tự reconnect
  });

  return socket;
}
