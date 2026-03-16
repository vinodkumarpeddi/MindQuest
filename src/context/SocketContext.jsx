import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

  useEffect(() => {
    if (isAuthenticated) {
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('🔌 Connected to Socket.IO server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from Socket.IO server');
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, SOCKET_URL]);

  const value = {
    socket,
    connected
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
