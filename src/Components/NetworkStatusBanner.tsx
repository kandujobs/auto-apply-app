import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface NetworkStatusBannerProps {
  className?: string;
}

const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({ className = '' }) => {
  const { isOnline, isConnecting, retryCount, retryConnection } = useNetworkStatus();

  // Don't show banner if online
  if (isOnline) {
    return null;
  }

  const handleRetry = async () => {
    await retryConnection();
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-3 shadow-lg ${className}`}>
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              {isConnecting ? 'Searching for network...' : 'No internet connection'}
            </span>
          </div>
          {retryCount > 0 && (
            <span className="text-xs opacity-75">
              Retry {retryCount}
            </span>
          )}
        </div>
        <button
          onClick={handleRetry}
          disabled={isConnecting}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            isConnecting
              ? 'bg-white bg-opacity-20 text-white cursor-not-allowed'
              : 'bg-white text-red-500 hover:bg-gray-100'
          }`}
        >
          {isConnecting ? 'Searching...' : 'Retry'}
        </button>
      </div>
    </div>
  );
};

export default NetworkStatusBanner; 