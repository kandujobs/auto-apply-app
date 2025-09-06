import React, { useState, useEffect } from 'react';
import { sessionService, SessionStatus } from '../services/sessionService';
import { paymentService } from '../services/paymentService';
import { supabase } from '../supabaseClient';
import { getBackendEndpoint } from '../utils/backendUrl';
import CheckpointModal from './CheckpointModal';

interface SessionManagerProps {
  onSessionChange: (session: SessionStatus) => void;
  onSessionStarted: () => void;
  onShowPaywall: () => void;
}

export default function SessionManager({ onSessionChange, onSessionStarted, onShowPaywall }: SessionManagerProps) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>({ isActive: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);
  const [checkpointData, setCheckpointData] = useState<any>(null);
  const [checkpointPollingInterval, setCheckpointPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set up session service callbacks
    sessionService.setProgressCallback((progress: string) => {
      console.log('[SessionManager] Progress update:', progress);
    });

    sessionService.setQuestionCallback((question: any) => {
      console.log('[SessionManager] Question update:', question);
    });

    sessionService.setApplicationCompletedCallback((data: any) => {
      console.log('[SessionManager] Application completed:', data);
    });

    // Set up checkpoint callback
    sessionService.setCheckpointPortalCallback((data: any) => {
      console.log('[SessionManager] Checkpoint data received:', data);
      
      if (data.type === 'checkpoint_detected') {
        console.log('[SessionManager] 🛡️ Checkpoint detected with screenshot');
        setCheckpointData(data);
        setIsCheckpointModalOpen(true);
      } else if (data.type === 'checkpoint_completed') {
        console.log('[SessionManager] ✅ Checkpoint completed');
        setIsCheckpointModalOpen(false);
        setCheckpointData(null);
      }
    });

    // Cleanup on unmount
    return () => {
      sessionService.setProgressCallback(null);
      sessionService.setQuestionCallback(null);
      sessionService.setApplicationCompletedCallback(null);
      sessionService.setCheckpointPortalCallback(null);
      
      // Clear checkpoint polling
      if (checkpointPollingInterval) {
        clearInterval(checkpointPollingInterval);
        setCheckpointPollingInterval(null);
      }
    };
  }, []);

  const handleStartSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await import('../supabaseClient').then(m => m.supabase.auth.getUser());
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Check payment access
      const hasAccess = await paymentService.checkUserAccess(user.id);
      if (!hasAccess) {
        onShowPaywall();
        return;
      }

      console.log('[SessionManager] Starting session for user:', user.id);
      
      // Start session
      const result = await sessionService.startSession();
      
      if (result.success) {
        console.log('[SessionManager] Session started successfully');
        setSessionStatus({ isActive: true });
        onSessionStarted();
        
        // Start checkpoint polling
        startCheckpointPolling();
      } else {
        console.error('[SessionManager] Failed to start session:', result.error);
        setError(result.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('[SessionManager] Error starting session:', error);
      setError(error instanceof Error ? error.message : 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await sessionService.stopSession();
      
      if (result.success) {
        console.log('[SessionManager] Session stopped successfully');
        setSessionStatus({ isActive: false });
        
        // Stop checkpoint polling
        stopCheckpointPolling();
      } else {
        console.error('[SessionManager] Failed to stop session:', result.error);
        setError(result.error || 'Failed to stop session');
      }
    } catch (error) {
      console.error('[SessionManager] Error stopping session:', error);
      setError(error instanceof Error ? error.message : 'Failed to stop session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugStartSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[SessionManager] Starting debug session');
      
      // Start session with debug flag
      const result = await sessionService.startSession();
      
      if (result.success) {
        console.log('[SessionManager] Debug session started successfully');
        setSessionStatus({ isActive: true });
        onSessionStarted();
      } else {
        console.error('[SessionManager] Failed to start debug session:', result.error);
        setError(result.error || 'Failed to start debug session');
      }
    } catch (error) {
      console.error('[SessionManager] Error starting debug session:', error);
      setError(error instanceof Error ? error.message : 'Failed to start debug session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckpointModalClose = () => {
    setIsCheckpointModalOpen(false);
    setCheckpointData(null);
  };

  const handleCheckpointCompleted = () => {
    console.log('[SessionManager] User completed checkpoint');
    setIsCheckpointModalOpen(false);
    setCheckpointData(null);
  };

  // Checkpoint polling function
  const pollForCheckpoint = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`/api/session/checkpoint/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.type === 'checkpoint_detected') {
          console.log('[SessionManager] 🛡️ Checkpoint detected via polling');
          setCheckpointData(data);
          setIsCheckpointModalOpen(true);
        } else if (data.type === 'checkpoint_completed') {
          console.log('[SessionManager] ✅ Checkpoint completed via polling');
          setIsCheckpointModalOpen(false);
          setCheckpointData(null);
        }
      }
    } catch (error) {
      console.error('[SessionManager] Error polling for checkpoint:', error);
    }
  };

  // Start checkpoint polling when session is active
  const startCheckpointPolling = () => {
    if (checkpointPollingInterval) {
      clearInterval(checkpointPollingInterval);
    }
    
    const interval = setInterval(pollForCheckpoint, 2000); // Poll every 2 seconds
    setCheckpointPollingInterval(interval);
    console.log('[SessionManager] Started checkpoint polling');
  };

  // Stop checkpoint polling
  const stopCheckpointPolling = () => {
    if (checkpointPollingInterval) {
      clearInterval(checkpointPollingInterval);
      setCheckpointPollingInterval(null);
      console.log('[SessionManager] Stopped checkpoint polling');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Session Management</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600">Status: {sessionStatus.isActive ? 'Active' : 'Inactive'}</p>
            {sessionStatus.session && (
              <p className="text-sm text-gray-600">
                Logged in: {sessionStatus.session.isLoggedIn ? 'Yes' : 'No'}
              </p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleStartSession}
              disabled={isLoading || sessionStatus.isActive}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Starting...' : 'Start Session'}
            </button>
            
            <button
              onClick={handleDebugStartSession}
              disabled={isLoading || sessionStatus.isActive}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Starting...' : 'Debug Start'}
            </button>
            
            <button
              onClick={handleStopSession}
              disabled={isLoading || !sessionStatus.isActive}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Stopping...' : 'Stop Session'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Checkpoint Modal */}
      <CheckpointModal
        isOpen={isCheckpointModalOpen}
        onClose={handleCheckpointModalClose}
        checkpointData={checkpointData}
        onCheckpointCompleted={handleCheckpointCompleted}
      />
    </div>
  );
} 