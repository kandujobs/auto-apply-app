import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

interface BrowserPortalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  portalData?: any;
}

interface ScreenshotData {
  screenshot: string;
  timestamp: number;
}

const BrowserPortal: React.FC<BrowserPortalProps> = ({ isOpen, onClose, userId, portalData }) => {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);

  // Handle portal data updates
  useEffect(() => {
    if (!portalData) return;

    console.log('[BrowserPortal] Received portal data:', portalData);

    if (portalData.type === 'browser_screenshot') {
      setScreenshot(`data:image/jpeg;base64,${portalData.screenshot}`);
      setLastUpdate(new Date());
    } else if (portalData.type === 'browser_portal_ready') {
      console.log('🖥️ Browser portal ready');
    } else if (portalData.type === 'browser_portal_closed') {
      console.log('🖥️ Browser portal closed');
      onClose();
    } else if (portalData.type === 'click_confirmed') {
      console.log('✅ Click confirmed');
    } else if (portalData.type === 'input_confirmed') {
      console.log('✅ Input confirmed');
    } else if (portalData.type === 'keypress_confirmed') {
      console.log('✅ Key press confirmed');
    }
  }, [portalData, onClose]);

  // Handle image click
  const handleImageClick = async (event: React.MouseEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const rect = img.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Scale coordinates to match image dimensions
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const scaledX = Math.round(x * scaleX);
    const scaledY = Math.round(y * scaleY);

    setClickCoords({ x: scaledX, y: scaledY });
    setIsLoading(true);

    try {
      const response = await fetch('/api/browser-portal/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          x: scaledX,
          y: scaledY,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send click');
      }

      console.log(`🖱️ Click sent to (${scaledX}, ${scaledY})`);
    } catch (error) {
      console.error('Error sending click:', error);
      setError('Failed to send click');
    } finally {
      setIsLoading(false);
      // Clear click coordinates after a short delay
      setTimeout(() => setClickCoords(null), 1000);
    }
  };

  // Handle input field interaction
  const handleInput = async (selector: string, value: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/browser-portal/input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          selector,
          value,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send input');
      }

      console.log(`⌨️ Input sent to ${selector}`);
    } catch (error) {
      console.error('Error sending input:', error);
      setError('Failed to send input');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = async (key: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/browser-portal/keypress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          key,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send key press');
      }

      console.log(`⌨️ Key press sent: ${key}`);
    } catch (error) {
      console.error('Error sending key press:', error);
      setError('Failed to send key press');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      // Handle special keys
      if (event.key === 'Enter') {
        event.preventDefault();
        handleKeyPress('Enter');
      } else if (event.key === 'Tab') {
        event.preventDefault();
        handleKeyPress('Tab');
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🖥️ Browser Portal</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="relative">
          {screenshot ? (
            <div className="relative inline-block">
              <img
                src={screenshot}
                alt="Browser screenshot"
                className="border border-gray-300 rounded max-w-full h-auto"
                style={{ cursor: isLoading ? 'wait' : 'crosshair' }}
                onClick={handleImageClick}
              />
              
              {/* Click indicator */}
              {clickCoords && (
                <div
                  className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse pointer-events-none"
                  style={{
                    left: `${clickCoords.x}px`,
                    top: `${clickCoords.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
              <div className="text-gray-500">Waiting for browser screenshot...</div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div>
            {lastUpdate && (
              <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>
          <div className="flex space-x-2">
            {isLoading && <span>⏳ Processing...</span>}
            <span>🖱️ Click to interact</span>
            <span>⌨️ Use keyboard for special keys</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => handleKeyPress('Enter')}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            Enter
          </button>
          <button
            onClick={() => handleKeyPress('Tab')}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            Tab
          </button>
          <button
            onClick={() => handleKeyPress('Escape')}
            disabled={isLoading}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50"
          >
            Escape
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ul className="space-y-1 text-gray-700">
            <li>• Click anywhere on the browser image to interact</li>
            <li>• Use the quick action buttons for common keys</li>
            <li>• The portal will automatically close when login is complete</li>
            <li>• You can close manually with the X button or Escape key</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BrowserPortal;
