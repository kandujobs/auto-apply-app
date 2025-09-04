import React, { useState, useEffect } from 'react';

interface CheckpointPortalProps {
  isOpen: boolean;
  onClose: () => void;
  portalUrl?: string;
}

const CheckpointPortal: React.FC<CheckpointPortalProps> = ({ isOpen, onClose, portalUrl }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen, portalUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError('Failed to load checkpoint portal');
    setIsLoading(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Security Checkpoint</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading checkpoint portal...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <div className="text-center">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          
          {portalUrl && (
            <iframe
              src={portalUrl}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title="Security Checkpoint Portal"
              allow="clipboard-read; clipboard-write"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckpointPortal;



