import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Đọc `exp` của JWT mà không verify (chỉ để tự kiểm tra hạn trước khi kết nối).
 * Trả về false nếu token hỏng/không đọc được → để server quyết định như bình thường.
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

export function initSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('gym_access_token');
  if (!token) {
    socket?.disconnect();
    socket = null;
    return null;
  }
  // Token hết hạn → không kết nối WS tránh log WARN "jwt expired" lặp mỗi lần
  // mount; request REST tiếp theo sẽ bị 401 và axios tự redirect về /login.
  if (isTokenExpired(token)) {
    socket?.disconnect();
    socket = null;
    return null;
  }

  if (socket) {
    const currentToken =
      typeof socket.auth === 'object' && socket.auth !== null ? socket.auth.token : undefined;
    if (currentToken === token) {
      if (!socket.connected && !socket.active) socket.connect();
      return socket;
    }

    socket.auth = { token };
    if (socket.connected) socket.disconnect();
    if (!socket.active) socket.connect();
    return socket;
  }

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
    // Token hết hạn giữa phiên → ngắt hẳn, không reconnect lặp với token cũ
    // (mỗi lần reconnect backend lại log WARN "jwt expired"). Request REST
    // kế tiếp sẽ 401 và axios tự redirect về /login.
    if (/jwt (expired|invalid)/i.test(err.message)) {
      socket?.disconnect();
      return;
    }
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

export function ensureSocket(): Socket | null {
  if (socket?.connected) return socket;
  return initSocket();
}
