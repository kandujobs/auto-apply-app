import React, { useState, useEffect } from 'react';
import { FiX, FiRefreshCw, FiCheck, FiMousePointer } from 'react-icons/fi';
import { getBackendUrl } from '../utils/backendUrl';

interface CheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCheckpointCompleted: () => void;
}

export default function CheckpointModal({ 
  isOpen, 
  onClose, 
  userId,
  onCheckpointCompleted 
}: CheckpointModalProps) {
  const [imgUrl, setImgUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Generate fresh image URL with timestamp to prevent caching
  const refreshImage = () => {
    const timestamp = Date.now();
    setImgUrl(`${getBackendUrl()}/api/checkpoint/${userId}/frame.png?t=${timestamp}`);
  };

  useEffect(() => {
    if (isOpen && userId) {
      refreshImage();
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen, userId]);

  const sendAction = async (payload: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${getBackendUrl()}/api/checkpoint/${userId}/action`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Action failed');
      }
      
      // Refresh the image after action
      setTimeout(refreshImage, 500);
      
    } catch (err) {
      console.error('Error sending action:', err);
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isLoading) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log(`Clicked at coordinates: (${x}, ${y})`);
    sendAction({ type: 'click', x: Math.round(x), y: Math.round(y) });
  };

  const handleInputSubmit = () => {
    if (!inputValue.trim() || isLoading) return;
    
    sendAction({ 
      type: 'type', 
      selector: 'input:focus', 
      text: inputValue 
    });
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit();
    }
  };

  const handlePressKey = (key: string) => {
    sendAction({ type: 'press', key });
  };

  const handleCompleteCheckpoint = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${getBackendUrl()}/api/checkpoint/${userId}/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete checkpoint');
      }
      
      console.log('[CheckpointModal] Checkpoint completion response:', result);
      onCheckpointCompleted();
      
    } catch (err) {
      console.error('Error completing checkpoint:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete checkpoint');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !userId) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiRefreshCw className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">LinkedIn Checkpoint</h2>
              <p className="text-sm text-gray-600">Complete the verification below</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Click directly on the screenshot where you'd normally click on LinkedIn.
            Use the input field below to type text, and the buttons for common actions.
          </p>
        </div>

        {/* Screenshot */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="bg-gray-100 px-3 py-2 border-b flex items-center justify-between">
            <h4 className="font-medium text-gray-900 text-sm">Live Screenshot</h4>
            <button
              onClick={refreshImage}
              disabled={isLoading}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center space-x-1"
            >
              <FiRefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
          <div className="bg-gray-50 p-2">
            {imgUrl ? (
              <img
                src={imgUrl}
                alt="LinkedIn Checkpoint"
                className="w-full rounded-lg cursor-crosshair border shadow-sm"
                onClick={handleImageClick}
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <FiRefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3">
          {/* Text Input */}
          <div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type text to send to focused field..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleInputSubmit}
              disabled={!inputValue.trim() || isLoading}
              className="mt-2 w-full bg-blue-600 text-white text-sm py-2 px-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send Text
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handlePressKey('Enter')}
              disabled={isLoading}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
            >
              <span>⏎</span>
              <span>Enter</span>
            </button>
            <button
              onClick={() => handlePressKey('Tab')}
              disabled={isLoading}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
            >
              <span>⇥</span>
              <span>Tab</span>
            </button>
            <button
              onClick={() => handlePressKey('Escape')}
              disabled={isLoading}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
            >
              <span>⎋</span>
              <span>Escape</span>
            </button>
            <button
              onClick={() => sendAction({ type: 'wait' })}
              disabled={isLoading}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
            >
              <FiRefreshCw className="w-3 h-3" />
              <span>Wait</span>
            </button>
          </div>

          {/* Complete Button */}
          <button
            onClick={handleCompleteCheckpoint}
            disabled={isLoading}
            className="w-full bg-green-600 text-white text-sm py-3 px-4 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <FiRefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FiCheck className="w-4 h-4" />
                <span>I've Completed the Checkpoint</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Click the screenshot to interact with LinkedIn directly. The system will automatically detect when you're done.
          </p>
        </div>
      </div>
    </div>
  );
}