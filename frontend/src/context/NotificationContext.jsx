import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useAuth } from './AuthContext';
import * as api from '../api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [socketUrl, setSocketUrl] = useState(null);

    // When the user logs in, set the WebSocket URL
    useEffect(() => {
        if (user) {
            const token = localStorage.getItem('token');
            setSocketUrl(`ws://127.0.0.1:8080/ws?token=${token}`);
        } else {
            setSocketUrl(null); // Disconnect when the user logs out
        }
    }, [user]);

    // Establish the WebSocket connection
    const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
        shouldReconnect: (closeEvent) => true,
    });

    // Fetch historical notifications
    useEffect(() => {
        if (user) {
            api.getNotifications()
                .then(response => setNotifications(Array.isArray(response.data) ? response.data : []))
                .catch(err => console.error("Failed to fetch notifications:", err));
        }
    }, [user]);

    // Handle new incoming WebSocket messages
    useEffect(() => {
        if (lastMessage !== null) {
            const messageData = lastMessage.data;
            if (messageData.startsWith("notification|")) {
                try {
                    const newNotification = JSON.parse(messageData.substring(13));
                    setNotifications(prev => [newNotification, ...prev]);
                } catch (e) {
                    console.error("Failed to parse notification JSON:", e);
                }
            }
        }
    }, [lastMessage]);

    // Define interaction functions using useCallback for stability
    const joinRoom = useCallback((rfqId) => {
        if (readyState === ReadyState.OPEN) sendMessage(`JOIN|${rfqId}`);
    }, [readyState, sendMessage]);

    const leaveRoom = useCallback((rfqId) => {
        if (readyState === ReadyState.OPEN) sendMessage(`LEAVE|${rfqId}`);
    }, [readyState, sendMessage]);

    const sendChatMessage = useCallback((rfqId, msg) => {
        if (readyState === ReadyState.OPEN) sendMessage(`CHAT|${rfqId}|${msg}`);
    }, [readyState, sendMessage]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Provide all necessary state and functions
    const value = {
        notifications,
        unreadCount,
        readyState,
        lastMessage,
        joinRoom,
        leaveRoom,
        sendChatMessage,
        sendMessage, // <-- THE FIX: Export the raw sendMessage function
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    return useContext(NotificationContext);
};