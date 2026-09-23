import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getAccessToken, getSocketBaseURL } from '@/api/client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socketUrl = getSocketBaseURL();
    const token = getAccessToken();

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
    socket.on('connect', () => {
      console.log('Socket.io connected to:', socketUrl);
      setConnected(true);
    });
    socket.on('disconnect', () => setConnected(false));
    return () => socket.disconnect();
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

/** Subscribe to a socket event while mounted */
export function useSocketEvent(event, handler) {
  const { socket, connected } = useSocket() || {};
  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [socket, connected, event, handler]);
}
