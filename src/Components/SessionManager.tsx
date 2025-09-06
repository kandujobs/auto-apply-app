import React, { useState, useEffect } from 'react';
import { sessionService, SessionStatus } from '../services/sessionService';
import { paymentService } from '../services/paymentService';
import { supabase } from '../supabaseClient';
import { getBackendUrl } from '../utils/backendUrl';
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Checkpoint state persistence
  const CHECKPOINT_STORAGE_KEY = 'checkpoint_modal_state';
  
  // Save checkpoint state to localStorage
  const saveCheckpointState = (isOpen: boolean, userId: string | null, data: any) => {
    if (isOpen && userId) {
      const state = {
        isOpen,
        userId,
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CHECKPOINT_STORAGE_KEY, JSON.stringify(state));
      console.log('[SessionManager] Checkpoint state saved to localStorage');
    } else {
      localStorage.removeItem(CHECKPOINT_STORAGE_KEY);
      console.log('[SessionManager] Checkpoint state removed from localStorage');
    }
  };
  
  // Load checkpoint state from localStorage
  const loadCheckpointState = () => {
    try {
      const stored = localStorage.getItem(CHECKPOINT_STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        // Check if state is not too old (within 30 minutes)
        if (Date.now() - state.timestamp < 30 * 60 * 1000) {
          console.log('[SessionManager] Checkpoint state restored from localStorage');
          return state;
        } else {
          localStorage.removeItem(CHECKPOINT_STORAGE_KEY);
          console.log('[SessionManager] Checkpoint state expired, removed from localStorage');
        }
      }
    } catch (error) {
      console.error('[SessionManager] Error loading checkpoint state:', error);
      localStorage.removeItem(CHECKPOINT_STORAGE_KEY);
    }
    return null;
  };

  // Restore checkpoint state on component mount
  useEffect(() => {
    const restoredState = loadCheckpointState();
    if (restoredState) {
      setCurrentUserId(restoredState.userId);
      setCheckpointData(restoredState.data);
      setIsCheckpointModalOpen(restoredState.isOpen);
      
      // Start polling if modal should be open
      if (restoredState.isOpen) {
        startCheckpointPolling();
      }
    }
  }, []);

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
      
      // Note: We don't clear localStorage here because the user might refresh the page
      // and we want to restore the checkpoint state. It will be cleared when the
      // checkpoint is completed or when the session ends.
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
      // const hasAccess = await paymentService.checkUserAccess(user.id);
      // if (!hasAccess) {
        // onShowPaywall();
        // return;
      // }

      console.log('[SessionManager] Starting session for user:', user.id);
      setCurrentUserId(user.id);
      
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
        
        // Clear checkpoint state when session ends
        saveCheckpointState(false, null, null);
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


  const handleCheckpointModalClose = () => {
    setIsCheckpointModalOpen(false);
    setCheckpointData(null);
    // Clear state from localStorage
    saveCheckpointState(false, null, null);
  };

  const handleCheckpointCompleted = () => {
    console.log('[SessionManager] User completed checkpoint');
    setIsCheckpointModalOpen(false);
    setCheckpointData(null);
    // Clear state from localStorage
    saveCheckpointState(false, null, null);
  };

  // Checkpoint polling function
  const pollForCheckpoint = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch(`${getBackendUrl()}/api/checkpoint/${user.id}/status`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.state === 'checkpoint_required') {
          console.log('[SessionManager] 🛡️ Checkpoint detected via polling');
          setCheckpointData(data);
          setIsCheckpointModalOpen(true);
          setCurrentUserId(user.id);
          // Save state to localStorage
          saveCheckpointState(true, user.id, data);
        } else if (data.state === 'running' && isCheckpointModalOpen) {
          console.log('[SessionManager] ✅ Checkpoint completed via polling');
          setIsCheckpointModalOpen(false);
          setCheckpointData(null);
          // Clear state from localStorage
          saveCheckpointState(false, null, null);
        } else if (data.state === 'failed') {
          console.log('[SessionManager] ❌ Checkpoint failed:', data.message);
          setIsCheckpointModalOpen(false);
          setCheckpointData(null);
          setError(data.message || 'Checkpoint failed');
          // Clear state from localStorage
          saveCheckpointState(false, null, null);
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
        userId={currentUserId || ''}
        onCheckpointCompleted={handleCheckpointCompleted}
      />
    </div>
  );
} 