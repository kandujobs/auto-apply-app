import React, { useState, useEffect } from 'react';
import { checkHealth } from '../services/healthCheck';

export default function ConnectionTest() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const health = await checkHealth();
      setStatus(health);
    } catch (error) {
      setStatus({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Connection Status</h3>
      
      <button 
        onClick={testConnection}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>

      {status && (
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full mr-2 bg-gray-300"></span>
            <span>Internet: {status.internet ? '✅ Connected' : '❌ Failed'}</span>
          </div>
          
          <div className="flex items-center">
            <span className={`w-4 h-4 rounded-full mr-2 ${status.backend ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Backend: {status.backend ? '✅ Connected' : '❌ Failed'}</span>
          </div>
          
          <div className="flex items-center">
            <span className={`w-4 h-4 rounded-full mr-2 ${status.supabase ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Database: {status.supabase ? '✅ Connected' : '❌ Failed'}</span>
          </div>

          {status.error && (
            <div className="text-red-500 text-sm">
              Error: {status.error}
            </div>
          )}

          <div className="text-xs text-gray-500 mt-2">
            Backend URL: {import.meta.env.VITE_BACKEND_URL || 'Not set'}
          </div>
        </div>
      )}
    </div>
  );
}
