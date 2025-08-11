import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastSeen: Date | null;
  retryCount: number;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastSeen: navigator.onLine ? new Date() : null,
    retryCount: 0,
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        isConnecting: false,
        lastSeen: new Date(),
        retryCount: 0,
      }));
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnecting: false,
        lastSeen: prev.lastSeen,
      }));
    };

    // Test network connectivity
    const testConnection = async () => {
      if (navigator.onLine) {
        setNetworkStatus(prev => ({ ...prev, isConnecting: true }));
        
        try {
          // Try to fetch a small resource to test actual connectivity
          const response = await fetch('/vite.svg', { 
            method: 'HEAD',
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          if (response.ok) {
            setNetworkStatus(prev => ({
              ...prev,
              isOnline: true,
              isConnecting: false,
              lastSeen: new Date(),
              retryCount: 0,
            }));
          } else {
            throw new Error('Network response not ok');
          }
        } catch (error) {
          setNetworkStatus(prev => ({
            ...prev,
            isOnline: false,
            isConnecting: false,
            retryCount: prev.retryCount + 1,
          }));
        }
      }
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test connection on mount and periodically
    testConnection();
    const interval = setInterval(testConnection, 30000); // Test every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const retryConnection = async () => {
    setNetworkStatus(prev => ({ ...prev, isConnecting: true }));
    
    try {
      const response = await fetch('/vite.svg', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: true,
          isConnecting: false,
          lastSeen: new Date(),
          retryCount: 0,
        }));
        return true;
      } else {
        throw new Error('Network response not ok');
      }
    } catch (error) {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnecting: false,
        retryCount: prev.retryCount + 1,
      }));
      return false;
    }
  };

  return {
    ...networkStatus,
    retryConnection,
  };
}; 