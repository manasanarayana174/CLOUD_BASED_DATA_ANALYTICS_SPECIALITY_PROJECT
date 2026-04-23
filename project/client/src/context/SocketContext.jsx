import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [lastVitalsUpdate, setLastVitalsUpdate] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Determine URL based on environment (default to localhost:5000)
        const socketInstance = io('http://localhost:5000');

        socketInstance.on('connect', () => {
            console.log('Socket Connected');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket Disconnected');
            setIsConnected(false);
        });

        socketInstance.on('alert:new', (newAlert) => {
            setAlerts(prev => [newAlert, ...prev]);
        });

        socketInstance.on('vitals_updated', (data) => {
            setLastVitalsUpdate(data.timestamp);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected, alerts, lastVitalsUpdate }}>
            {children}
        </SocketContext.Provider>
    );
};
