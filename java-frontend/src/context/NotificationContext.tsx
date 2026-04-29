import React, { createContext, useContext, useState, useEffect } from 'react';
import { messageService } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const refreshUnreadCount = async () => {
    if (user) {
      try {
        const count = await messageService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading unread count:', error);
        setUnreadCount(0);
      }
    } else {
      setUnreadCount(0);
    }
  };

  // Load unread count when user changes
  useEffect(() => {
    refreshUnreadCount();
  }, [user]);

  // Poll for unread count every 30 seconds if user is logged in
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};