import React, { useState, useEffect } from 'react';
import { checkHealth, getHealthStatusMessage, HealthStatus } from '../services/healthCheck';

interface NetworkStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NetworkStatusModal: React.FC<NetworkStatusModalProps> = ({ isOpen, onClose }) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      const status = await checkHealth();
      setHealthStatus(status);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      performHealthCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Network Status</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Checking services...</span>
          </div>
        ) : healthStatus ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 mb-2">
                {getHealthStatusMessage(healthStatus)}
              </p>
              <p className="text-sm text-gray-500">
                Last checked: {healthStatus.timestamp.toLocaleTimeString()}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Internet Connection</span>
                <div className={`w-3 h-3 rounded-full ${healthStatus.internet ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Backend Server</span>
                <div className={`w-3 h-3 rounded-full ${healthStatus.backend ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Database</span>
                <div className={`w-3 h-3 rounded-full ${healthStatus.supabase ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={performHealthCheck}
                disabled={isLoading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Checking...' : 'Refresh Status'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Unable to check network status</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkStatusModal; 