import React, { useState, useEffect } from 'react';
import { sessionService, SessionStatus } from '../services/sessionService';
import { paymentService } from '../services/paymentService';
import { triggerJobFetch } from '../services/linkedinFetchedJobs';
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
  const [showJobFetchPrompt, setShowJobFetchPrompt] = useState(false);
  // Checkpoint state persistence
  const CHECKPOINT_STORAGE_KEY = 'checkpoint_modal_state';
  // Session state persistence
  const SESSION_STORAGE_KEY = 'session_state';
  
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

  // Save session state to localStorage
  const saveSessionState = (isActive: boolean, userId: string | null) => {
    if (isActive && userId) {
      const state = {
        isActive,
        userId,
        timestamp: Date.now()
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
      console.log('[SessionManager] Session state saved to localStorage');
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      console.log('[SessionManager] Session state removed from localStorage');
    }
  };
  
  // Load session state from localStorage
  const loadSessionState = () => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        // Check if state is not too old (within 1 hour)
        if (Date.now() - state.timestamp < 60 * 60 * 1000) {
          console.log('[SessionManager] Session state restored from localStorage');
          return state;
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          console.log('[SessionManager] Session state expired, removed from localStorage');
        }
      }
    } catch (error) {
      console.error('[SessionManager] Error loading session state:', error);
      localStorage.removeItem(SESSION_STORAGE_KEY);
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
        setShowJobFetchPrompt(true);
      }
    }
    
    // Restore session state on component mount
    const sessionState = loadSessionState();
    if (sessionState) {
      setSessionStatus({ isActive: true });
      setCurrentUserId(sessionState.userId);
      setShowJobFetchPrompt(true);
      console.log('[SessionManager] Session state restored, showing job fetch prompt');
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

    // Set up session status callback
    sessionService.setSessionStatusCallback((status: SessionStatus) => {
      console.log('[SessionManager] Session status update:', status);
      setSessionStatus(status);
      onSessionChange(status);
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

      // Check payment access (temporarily bypassed for consolidation)
      // const hasAccess = await paymentService.checkUserAccess(user.id);
      // if (!hasAccess) {
      //   onShowPaywall();
      //   return;
      // }

      console.log('[SessionManager] Starting session for user:', user.id);
      setCurrentUserId(user.id);
      
      // Start session
      const result = await sessionService.startSession();
      
      if (result.success) {
        console.log('[SessionManager] Session started successfully');
        setSessionStatus({ isActive: true });
        onSessionStarted();
        
        // Save session state and show job fetch prompt
        saveSessionState(true, user.id);
        setShowJobFetchPrompt(true);
        
        // Start checkpoint polling
        
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
        
        // Clear session state and hide job fetch prompt
        saveSessionState(false, null);
        setShowJobFetchPrompt(false);
        
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
  
  const handleManualJobFetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[SessionManager] Manually triggering job fetch...');
      const jobFetchResult = await triggerJobFetch();
      
      if (jobFetchResult.success) {
        console.log('[SessionManager] ✅ Job fetch triggered successfully');
        setShowJobFetchPrompt(false);
      } else {
        console.error('[SessionManager] ❌ Job fetch failed:', jobFetchResult.error);
        setError(jobFetchResult.error || 'Failed to fetch jobs');
      }
    } catch (error) {
      console.error('[SessionManager] ❌ Error triggering job fetch:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
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
          
          <div className="flex justify-center">
            {sessionStatus.isActive ? (
              <button
                onClick={handleStopSession}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-full shadow-lg hover:from-red-600 hover:to-red-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Stopping...
                  </span>
                ) : (
                  'Stop Session'
                )}
              </button>
            ) : (
              <button
                onClick={handleStartSession}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:from-blue-600 hover:to-blue-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Starting...
                  </span>
                ) : (
                  'Start Session'
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Session Success Message */}
        {showJobFetchPrompt && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Session Started Successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your browser session is ready. Click below to fetch jobs from LinkedIn.</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleManualJobFetch}
                    disabled={isLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? "Fetching Jobs..." : "Fetch Jobs from LinkedIn"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}        
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