import React, { useState, useEffect } from 'react';
import { FiX, FiRefreshCw, FiCheck } from 'react-icons/fi';

interface CheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkpointData: {
    message: string;
    checkpointUrl: string;
    screenshot: string;
    userId: string;
  } | null;
  onCheckpointCompleted: () => void;
}

export default function CheckpointModal({ 
  isOpen, 
  onClose, 
  checkpointData, 
  onCheckpointCompleted 
}: CheckpointModalProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [status, setStatus] = useState<'waiting' | 'completed' | 'error'>('waiting');

  useEffect(() => {
    if (isOpen && checkpointData) {
      setStatus('waiting');
      setIsCompleting(false);
    }
  }, [isOpen, checkpointData]);

  const handleCompleteCheckpoint = async () => {
    setIsCompleting(true);
    setStatus('waiting');
    
    // The backend will automatically detect when the user completes the checkpoint
    // by monitoring the URL changes. We just need to wait for the completion signal.
    console.log('User is completing checkpoint...');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!isOpen || !checkpointData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiRefreshCw className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Security Checkpoint Required</h2>
              <p className="text-sm text-gray-600">LinkedIn has requested additional verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">What you need to do:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Complete the LinkedIn security verification shown in the screenshot below</li>
                <li>Follow any additional steps LinkedIn requires (phone verification, email confirmation, etc.)</li>
                <li>Once completed, click "I've Completed the Checkpoint" below</li>
                <li>Our system will automatically detect when you're done and continue</li>
              </ol>
            </div>

            {/* Screenshot */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b">
                <h4 className="font-medium text-gray-900">LinkedIn Checkpoint Page</h4>
              </div>
              <div className="bg-gray-50 p-4">
                <img
                  src={checkpointData.screenshot}
                  alt="LinkedIn Security Checkpoint"
                  className="w-full h-auto rounded border shadow-sm"
                  style={{ maxHeight: '500px', objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* Status */}
            {status === 'waiting' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <FiRefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />
                  <span className="text-yellow-800 font-medium">Waiting for you to complete the checkpoint...</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Complete the verification steps shown above, then click the button below.
                </p>
              </div>
            )}

            {status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <FiCheck className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">Checkpoint completed successfully!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  The session will continue automatically.
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <FiX className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">Checkpoint completion failed</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Please try again or contact support if the issue persists.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Refresh Page
            </button>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel Session
            </button>
            
            <button
              onClick={handleCompleteCheckpoint}
              disabled={isCompleting || status === 'completed'}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isCompleting ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  <span>I've Completed the Checkpoint</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
