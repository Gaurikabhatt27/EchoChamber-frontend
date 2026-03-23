import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Determine backend URL logic (fallback to localhost:5000)
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    // Extract the base URL by removing /api if it exists to connect exactly to the root port
    const socketUrl = backendUrl.replace(/\/api\/?$/, '');
    
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'] // Try WebSocket first, fallback to polling
    });
    
    setSocket(newSocket);

    // Clean up socket on unmount
    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
