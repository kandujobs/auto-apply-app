import React, { useState, useEffect } from 'react';
import { sessionService, SessionStatus } from '../services/sessionService';
import { supabase } from '../supabaseClient';
import { paymentService } from '../services/paymentService';

interface SessionManagerProps {
  onSessionChange?: (isActive: boolean) => void;
  onSessionStarted?: () => void; // New callback for when session starts
  onShowPaywall?: () => void; // Callback to show paywall when needed
}

export default function SessionManager({ onSessionChange, onSessionStarted, onShowPaywall }: SessionManagerProps) {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>({ isActive: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const [jobFetchProgress, setJobFetchProgress] = useState<string>('');
  const [jobFetchPercentage, setJobFetchPercentage] = useState<number>(0);
  const hasTriggeredSessionStart = React.useRef(false);

  useEffect(() => {
    // Check initial session status
    checkSessionStatus();
    
    // Set up periodic status check
    const interval = setInterval(() => {
      checkSessionStatus();
    }, 3000); // Check every 3 seconds
    
    // Set up WebSocket progress tracking
    sessionService.setProgressCallback((progress: string) => {
      console.log('[SessionManager] Progress update:', progress);
      setJobFetchProgress(progress);
      
      // Handle session closure detection
      if (progress.includes('Browser session was closed')) {
        console.log('[SessionManager] Browser session closed detected, resetting session state');
        setSessionStatus({ isActive: false });
        setWebsocketConnected(false);
        setJobFetchProgress('');
        setJobFetchPercentage(0);
        onSessionChange?.(false);
        return;
      }
      
      // Calculate progress percentage based on progress message
      if (progress.includes('Extracting job')) {
        const match = progress.match(/Extracting job (\d+)\/15/);
        if (match) {
          const jobNumber = parseInt(match[1]);
          const percentage = Math.round((jobNumber / 15) * 100);
          setJobFetchPercentage(percentage);
        }
      } else if (progress.includes('Saving job')) {
        const match = progress.match(/Saving job (\d+)\/\d+/);
        if (match) {
          const jobNumber = parseInt(match[1]);
          const totalMatch = progress.match(/Saving job \d+\/(\d+)/);
          const total = totalMatch ? parseInt(totalMatch[1]) : 15;
          const percentage = Math.round((jobNumber / total) * 100);
          setJobFetchPercentage(percentage);
        }
      } else if (progress.includes('Job fetch completed')) {
        setJobFetchPercentage(100);
      } else if (progress.includes('Starting job fetch')) {
        setJobFetchPercentage(0);
      }
    });
    
    return () => {
      clearInterval(interval);
      sessionService.setProgressCallback(null);
    };
  }, []);

  // Note: Job fetching is now manually triggered by the user on the discover page

  const checkSessionStatus = async () => {
    try {
      const status = await sessionService.getSessionStatus();
      const wasLoggedIn = sessionStatus.session?.isLoggedIn;
      const isNowLoggedIn = status.session?.isLoggedIn;
      
      // Also check WebSocket connection status
      const wsConnected = sessionService.isSessionActive();
      setWebsocketConnected(wsConnected);
      
      setSessionStatus(status);
      
      // Only consider session active if both backend says so AND WebSocket is connected AND browser is logged in
      const isActuallyActive = !!(status.isActive && wsConnected && status.session?.isLoggedIn);
      onSessionChange?.(isActuallyActive);
      
      // Show success notification when session becomes ready
      // Only trigger if we haven't already triggered AND the session is actually ready
      if (isNowLoggedIn && wsConnected && !hasTriggeredSessionStart.current && isActuallyActive) {
        console.log('🎉 Session is now ready for applications!');
        hasTriggeredSessionStart.current = true;
        // Trigger automatic job fetching for new sessions
        onSessionStarted?.();
      } else if (isNowLoggedIn && wsConnected && hasTriggeredSessionStart.current) {
        console.log('🔍 Session is ready but already triggered, skipping...');
      }
    } catch (error) {
      console.error('Error checking session status:', error);
      setWebsocketConnected(false);
      onSessionChange?.(false);
    }
  };

  const handleStartSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First, check if user has LinkedIn credentials
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setError('User not authenticated');
        return;
      }

      const { data: credentials, error: credentialsError } = await supabase
        .from('linkedin_credentials')
        .select('id')
        .eq('id', userData.user.id)
        .eq('is_active', true)
        .single();

      if (credentialsError || !credentials) {
        setError('LinkedIn credentials not found. Please add your LinkedIn credentials first.');
        return;
      }

      // If we have credentials, check payment access
      try {
        const access = await paymentService.checkUserAccess(userData.user.id);
        
        if (!access.hasAccess) {
          // User doesn't have payment access, show paywall
          console.log('[SessionManager] User has no payment access, showing paywall');
          onShowPaywall?.();
          return;
        }
      } catch (error) {
        console.error('[SessionManager] Error checking payment access:', error);
        // If there's an error checking payment, show paywall as fallback
        onShowPaywall?.();
        return;
      }

      // If we get here, user has both credentials and payment access
      const result = await sessionService.startSession();
      if (result.success) {
        // Wait a moment for WebSocket to connect, then check status
        setTimeout(() => {
          checkSessionStatus();
        }, 1000);
      } else {
        setError(result.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      setError('Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sessionService.stopSession();
      if (result.success) {
        // Reset all session state
        setSessionStatus({ isActive: false });
        setWebsocketConnected(false);
        setJobFetchProgress(''); // Clear job fetch progress
        setJobFetchPercentage(0); // Reset progress percentage
        hasTriggeredSessionStart.current = false; // Reset session start flag
        onSessionChange?.(false);
        console.log('✅ Session stopped successfully');
      } else {
        setError(result.error || 'Failed to stop session');
        console.error('❌ Failed to stop session:', result.error);
      }
    } catch (error) {
      console.error('Error stopping session:', error);
      setError('Failed to stop session');
      // Even if there's an error, reset the state to allow restarting
      setSessionStatus({ isActive: false });
      setWebsocketConnected(false);
      setJobFetchProgress(''); // Clear job fetch progress
      setJobFetchPercentage(0); // Reset progress percentage
      hasTriggeredSessionStart.current = false; // Reset session start flag
      onSessionChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine the actual session state
  const isActuallyActive = sessionStatus.isActive && websocketConnected && sessionStatus.session?.isLoggedIn;
  const isInitializing = sessionStatus.isActive && !websocketConnected;
  const isBrowserReady = sessionStatus.session?.isLoggedIn;

  return (
    <div className="bg-white rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            isActuallyActive ? 'bg-green-500 animate-pulse' : 
            isInitializing ? 'bg-yellow-500' : 
            'bg-red-500'
          }`}></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Application Session
            </h3>
            <p className="text-sm text-gray-600">
              {isActuallyActive 
                ? '✅ Session Ready - You can now apply to jobs!'
                : isBrowserReady && websocketConnected
                ? '🌐 Browser Ready - Waiting for session connection...'
                : isInitializing
                ? '🔄 Initializing session...'
                : 'Session Inactive'
              }
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!isActuallyActive ? (
            <button
              onClick={handleStartSession}
              disabled={isLoading || isInitializing}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Starting...' : 'Start Session'}
            </button>
          ) : (
            <button
              onClick={handleStopSession}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Stopping...' : 'Stop Session'}
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {isActuallyActive && sessionStatus.session && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Progress:</strong> {sessionStatus.session.applicationProgress || 'No progress yet'}
          </p>
          {sessionStatus.session.currentQuestionIndex > 0 && (
            <p className="text-sm text-blue-800">
              <strong>Questions:</strong> {sessionStatus.session.currentQuestionIndex}/{sessionStatus.session.totalQuestions}
            </p>
          )}
          {jobFetchProgress && (
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-xs text-blue-700">
                <span>{jobFetchProgress}</span>
                <span>{jobFetchPercentage}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${jobFetchPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {isInitializing && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>Status:</strong> Initializing session...
          </p>
          {jobFetchProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-yellow-700">
                <span>{jobFetchProgress}</span>
                <span>{jobFetchPercentage}%</span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${jobFetchPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 