import React, { useState, useRef, useEffect } from 'react';
import { Job } from '../types/Job';
import { supabase } from '../supabaseClient';
import { getBackendEndpoint } from '../utils/backendUrl';
import { STANDARD_TAGS } from '../data/tags';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import Notification from './Notification';

import { sessionService } from '../services/sessionService';

// Declare global WebSocket property
declare global {
  interface Window {
    globalWebSocket?: WebSocket;
  }
}

// JobStatsBubble component that cycles through different statistics
const JobStatsBubble: React.FC<{ totalJobs: number; remainingJobs: number; viewedJobs: number }> = ({ 
  totalJobs, 
  remainingJobs, 
  viewedJobs 
}) => {
  const [currentStat, setCurrentStat] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat(prev => (prev + 1) % 3);
    }, 2000); // Change every 2 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const stats = [
    { label: 'available', value: totalJobs },
    { label: 'remaining', value: remainingJobs },
    { label: 'viewed', value: viewedJobs }
  ];
  
  const currentStatData = stats[currentStat];
  
  return (
    <span className="transition-opacity duration-500">
      {currentStatData.value} {currentStatData.label}
    </span>
  );
};

interface SwipeCardProps {
  jobs: Job[];
  currentIndex: number;
  onSwipe: (direction: 'left' | 'right', job: Job) => void;
  onSaveJob: (job: Job) => Promise<void>;
  onApplyJob: (job: Job) => Promise<void>; // New simple apply function
  onAnswerQuestion: (question: string, answer: string) => Promise<void>; // Handle user answers
  savedJobs: Job[];
  onNextJob: () => void;
  userSkills?: string[];
  userInterests?: string[];
  onExpandSearch?: () => void; // New prop for expanding search
  isSessionActive?: boolean; // New prop for session status

  totalJobs?: number;
  remainingJobs?: number;
  viewedJobs?: number;
  
  // Auto-apply limit props
  autoAppliesUsed?: number;
  autoApplyLimit?: number;
}

export default function SwipeCard({ jobs, currentIndex, onSwipe, onSaveJob, onApplyJob, onAnswerQuestion, savedJobs, onNextJob, userSkills = [], userInterests = [], onExpandSearch, isSessionActive = false, totalJobs = 0, remainingJobs = 0, viewedJobs = 0, autoAppliesUsed = 0, autoApplyLimit = 15 }: SwipeCardProps) {
  console.log('[SwipeCard] Rendering with jobs:', jobs.length, 'currentIndex:', currentIndex);
  const cardRef = useRef<HTMLDivElement>(null);

  // Application state
  const [isApplying, setIsApplying] = useState(false);
  const [applicationProgress, setApplicationProgress] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [questionOptions, setQuestionOptions] = useState<string[]>([]);
  const [questionType, setQuestionType] = useState<'text' | 'radio' | 'checkbox' | 'number'>('text');
  const [questionInputValue, setQuestionInputValue] = useState<string>('');

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showFailureMessage, setShowFailureMessage] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string>('');

  // Notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');

  // Network status
  const { isOnline } = useNetworkStatus();

  // Local session state as fallback
  const [localSessionActive, setLocalSessionActive] = useState(false);

  // Debug question state changes
  useEffect(() => {
    console.log('[SwipeCard] Question state changed:', { currentQuestion, isApplying, questionType, questionOptions });
  }, [currentQuestion, isApplying, questionType, questionOptions]);

  // Check session status periodically as fallback
  useEffect(() => {
    const checkSessionStatus = async () => {
      try {
        const sessionStatus = await sessionService.getSessionStatus();
        setLocalSessionActive(sessionStatus.isActive);
      } catch (error) {
        console.error('[SwipeCard] Error checking session status:', error);
      }
    };

    // Check immediately
    checkSessionStatus();

    // Check every 3 seconds
    const interval = setInterval(checkSessionStatus, 3000);

    return () => clearInterval(interval);
  }, []);

  // Use prop if available, otherwise use local state
  const effectiveSessionActive = isSessionActive || localSessionActive;
  
  // Check if user has reached their daily auto-apply limit
  const hasReachedDailyLimit = autoAppliesUsed >= autoApplyLimit;
  
  // Calculate the actual limit including any reward bonus
  const actualLimit = autoApplyLimit; // This now includes the reward bonus from HomeScreen
  
  // Listen for usage count refresh events
  useEffect(() => {
    const handleRefreshUsage = () => {
      // Trigger a refresh of the usage count in the parent component
      window.dispatchEvent(new CustomEvent('refreshUsageCount'));
    };
    
    window.addEventListener('refreshUsageCount', handleRefreshUsage);
    
    return () => {
      window.removeEventListener('refreshUsageCount', handleRefreshUsage);
    };
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log('[SwipeCard] Component unmounting, cleaning up WebSocket');
      // Don't close the global WebSocket on unmount, let it persist
    };
  }, []);

  // Session-based WebSocket connection management
  useEffect(() => {
    // Set up session service callbacks
    sessionService.setProgressCallback((progress: string) => {
      console.log('[SwipeCard] Progress update from session:', progress);
      setApplicationProgress(progress);
    });

    sessionService.setQuestionCallback((question: any) => {
      console.log('[SwipeCard] Question received from session:', question);
      
      // Check if this is a cover letter requirement
      const questionText = question.text?.toLowerCase() || '';
      const isCoverLetterRequired = questionText.includes('cover letter') || 
                                   questionText.includes('cover letter is required') ||
                                   questionText.includes('a cover letter is required');
      
      if (isCoverLetterRequired) {
        console.log('[SwipeCard] Cover letter required detected, marking application as unsuccessful');
        
        // Store the swipe as unsuccessful (left swipe) - use current job from jobs array
        const currentJob = jobs[currentIndex];
        if (currentJob) {
          storeSwipe(currentJob, 'left');
        }
        
        // Mark application as unsuccessful and move to next job
        setFailureMessage('❌ Cover letter required - application unsuccessful');
        setShowFailureMessage(true);
        setIsApplying(false);
        setCurrentQuestion('');
        setQuestionOptions([]);
        setQuestionType('text');
        setQuestionInputValue('');
        setApplicationProgress('');
        
        // Show failure message briefly, then move to next job
        setTimeout(() => {
          setShowFailureMessage(false);
          setFailureMessage('');
          onNextJob();
        }, 3000);
        
        return; // Don't show the question UI
      }
      
      // Ensure we're in applying state to show the question UI
      setIsApplying(true);
      
      // Set question data
      setCurrentQuestion(question.text);
      setQuestionOptions(question.options || []);
      setQuestionType(question.type || 'text');
      setQuestionInputValue(''); // Clear input value for new question
      setApplicationProgress('Questions found! Please answer below.');
      
      console.log('[SwipeCard] Question state updated:', {
        isApplying: true,
        currentQuestion: question.text,
        questionOptions: question.options,
        questionType: question.type
      });
    });

    sessionService.setApplicationCompletedCallback((data: any) => {
      console.log('[SwipeCard] Application completed:', data);
      if (data.status === 'completed') {
        setSuccessMessage('🎉 Application submitted successfully!');
        setShowSuccessMessage(true);
        setIsApplying(false);
        setApplicationProgress('');
        setCurrentQuestion('');
        setQuestionOptions([]);
        setQuestionType('text');
        setQuestionInputValue('');
        
        // Show success message for 4 seconds with animation, then move to next job
        setTimeout(() => {
          setShowSuccessMessage(false);
          setSuccessMessage('');
          onNextJob();
        }, 4000);
      } else if (data.status === 'error' || data.status === 'job_closed') {
        setApplicationProgress(data.message || 'Application failed. Please try again.');
        setIsApplying(false);
        setCurrentQuestion('');
        setQuestionOptions([]);
        setQuestionType('text');
        setQuestionInputValue('');
        
        // For job_closed status, automatically move to next job after a short delay
        if (data.status === 'job_closed') {
          setTimeout(() => {
            setApplicationProgress('');
            onNextJob();
          }, 2000); // Wait 2 seconds to show the error message, then move on
        }
      }
    });

    return () => {
      // Clean up callbacks
      sessionService.setProgressCallback(null);
      sessionService.setQuestionCallback(null);
      sessionService.setApplicationCompletedCallback(null);
    };
  }, [jobs, currentIndex, onNextJob]); // Include dependencies to access current job

  const currentJob = jobs[currentIndex];

  const handleSaveClick = (job: Job) => {
    if (!isOnline) {
      console.log('Network offline - save action blocked');
      return;
    }
    onSaveJob(job);
  };

  const isJobSaved = (job: Job) => {
    return savedJobs.some(savedJob => 
      savedJob.title === job.title && 
      savedJob.company === job.company
    );
  };

  async function storeSwipe(job: Job, direction: 'right' | 'left') {
    console.log('[SwipeCard] storeSwipe called with:', { jobId: job.id, direction, jobTitle: job.title, jobCompany: job.company });
    
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    console.log('[SwipeCard] User ID:', userId);
    
    if (!userId) {
      console.error('[SwipeCard] No user ID found, returning early');
      return;
    }
    
    // Simple storage - no complex queue system
    try {
        const dataToInsert = {
          user_id: userId,
          job_id: job.id,
          job_title: job.title,
          company: job.company,
          swipe_direction: direction,
          swiped_at: new Date().toISOString(),
        };
        
        const { error } = await supabase.from('job_swipes').upsert([dataToInsert], { onConflict: 'user_id,job_id' });
        
        if (error) {
          console.error('[SwipeCard] Failed to store swipe:', error);
      } else {
        console.log('[SwipeCard] Successfully stored swipe');
      }
    } catch (error) {
      console.error('[SwipeCard] Exception storing swipe:', error);
    }
  }

  async function handleApplyJob(job: Job) {
    console.log('[SwipeCard] handleApplyJob called for job:', { id: job.id, title: job.title, company: job.company });
    console.log('[SwipeCard] This should ONLY be called when Apply button is clicked, NOT Pass button');
    console.log('[SwipeCard] DEBUG: Starting handleApplyJob function');
    
    try {
      // Check if session is active
      console.log('[SwipeCard] DEBUG: About to check session active');
      const sessionActive = sessionService.isSessionActive();
      console.log('[SwipeCard] Session active check:', sessionActive);
    
    if (!sessionActive) {
      console.log('[SwipeCard] No active session found');
      setApplicationProgress('No active session. Please start a session first.');
      setIsApplying(false);
      return;
    }

    // Check if session is logged in
    try {
      const sessionStatus = await sessionService.getSessionStatus();
      console.log('[SwipeCard] Session status:', sessionStatus);
      
      if (!sessionStatus.isLoggedIn) {
        console.log('[SwipeCard] Session not logged in yet');
        setApplicationProgress('Session is still initializing. Please wait for login to complete.');
        setIsApplying(false);
        return;
      }
    } catch (error) {
      console.error('[SwipeCard] Error checking session status:', error);
      setApplicationProgress('Error checking session status.');
      setIsApplying(false);
      return;
    }
    
    setIsApplying(true);
    setApplicationProgress('Starting application...');
    setCurrentQuestion('');
    setQuestionOptions([]);
    
    try {
      // Get current user for session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setApplicationProgress('User not authenticated');
        setIsApplying(false);
        return;
      }
      
      // Start the application process with session
      console.log('[SwipeCard] Making API call to /api/jobs/simple-apply with data:', { 
        jobUrl: job.url,
        jobTitle: job.title,
        company: job.company,
        userId: user.id
      });
      
      const response = await fetch(getBackendEndpoint('/api/jobs/simple-apply'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          jobUrl: job.url,
          jobTitle: job.title,
          company: job.company,
          userId: user.id
        }),
      });
      
      console.log('[SwipeCard] API response status:', response.status);
      console.log('[SwipeCard] API response ok:', response.ok);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('[SwipeCard] Application started successfully:', responseData);
        setApplicationProgress('Application started - 1-2 mins');
        
        // Store the job as a right swipe in the database
        await storeSwipe(job, 'right');
        
        // Progress updates will come via WebSocket through session
        // No need to poll anymore
      } else {
        const errorData = await response.json();
        console.error('[SwipeCard] Failed to start application:', errorData);
        
        // Handle daily limit reached error
        if (response.status === 429) {
          setApplicationProgress('Daily application limit reached (15 applications). Please try again tomorrow.');
          // Trigger a refresh of the usage count
          window.dispatchEvent(new CustomEvent('refreshUsageCount'));
        } else {
          setApplicationProgress(errorData.error || 'Failed to start application');
        }
        setIsApplying(false);
      }
    } catch (error) {
      console.error('[SwipeCard] Error starting application:', error);
      setApplicationProgress('Error starting application');
      setIsApplying(false);
    }
    } catch (error) {
      console.error('[SwipeCard] CRITICAL ERROR in handleApplyJob:', error);
      if (error instanceof Error) {
        console.error('[SwipeCard] Error stack:', error.stack);
      }
      setApplicationProgress('Critical error in application process');
      setIsApplying(false);
    }
  }



  const handleAnswerSubmit = async () => {
    if (!questionInputValue.trim() && questionType !== 'radio') {
      return; // Don't submit empty answers for text inputs
    }

    const answer = questionInputValue || (questionOptions.length > 0 ? questionOptions[0] : '');
    
    console.log('[SwipeCard] Submitting answer:', answer);
    
    try {
      // Send answer via session service
      sessionService.sendAnswer(answer);
      console.log('[SwipeCard] Answer sent via session');
      
      // Clear the question and continue
      setCurrentQuestion('');
      setQuestionOptions([]);
      setQuestionType('text');
      setQuestionInputValue('');
      setApplicationProgress('Answer received, continuing application...');
      
      // No need to poll - next question will come via WebSocket
      
    } catch (error) {
      console.error('[SwipeCard] Error submitting answer:', error);
      setApplicationProgress('Error submitting answer. Please try again.');
    }
  };

  const handleAnswerChange = (value: string) => {
    setQuestionInputValue(value);
  };

  const handleRadioSelect = (option: string) => {
    setQuestionInputValue(option);
  };

  const handleSkipQuestion = () => {
    console.log('[SwipeCard] Skipping question');
    setCurrentQuestion('');
    setQuestionOptions([]);
    setQuestionType('text');
    setQuestionInputValue('');
    setApplicationProgress('Question skipped, continuing application...');
  };

  const handleCancelApplication = () => {
    console.log('[SwipeCard] Canceling application');
    setIsApplying(false);
    setCurrentQuestion('');
    setQuestionOptions([]);
    setQuestionType('text');
    setQuestionInputValue('');
    setApplicationProgress('');
  };

  // Helper function to extract tags from job
  const extractTags = (job: Job): string[] => {
    const tags: string[] = [];
    
    // Add tags from job data
    if (job.tags && Array.isArray(job.tags)) {
      tags.push(...job.tags);
    }
    
    // Add tags from title and description
    const text = `${job.title} ${job.description || ''}`.toLowerCase();
    
    // Check for skills in user profile
    userSkills.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        tags.push(skill);
      }
    });
    
    // Check for interests in user profile
    userInterests.forEach(interest => {
      if (text.includes(interest.toLowerCase())) {
        tags.push(interest);
      }
    });
    
    // Check for standard tags
    STANDARD_TAGS.forEach(tag => {
      if (text.includes(tag.toLowerCase()) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
    
    // Remove duplicates and return
    return [...new Set(tags)];
  };

  // Helper function to truncate text to two sentences
  const truncateToTwoSentences = (text: string): string => {
    if (!text) return '';
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '');
  };

  const truncateToFourSentences = (text: string): string => {
    if (!text) return '';
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 4).join('. ') + (sentences.length > 4 ? '...' : '');
  };



  if (!currentJob) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No More Jobs</h2>
        <p className="text-gray-600 mb-4">You've seen all available jobs. Try expanding your search criteria.</p>
        {onExpandSearch && (
          <button 
            onClick={onExpandSearch}
            className="bg-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-purple-700 transition-colors"
          >
            Expand Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {currentJob && (
        <div className="flex flex-col items-center gap-4 justify-center h-full">
          <div
            ref={cardRef}
            className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-lg border-4 border-gray-300 overflow-hidden transition-transform duration-200 h-[600px] flex flex-col"
          >
        {/* Network Status Overlay */}
        {!isOnline && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-[2rem]">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">No Internet Connection</p>
              <p className="text-xs text-gray-600 mt-1">Please check your connection to continue</p>
            </div>
          </div>
        )}

        {/* Application Status Overlay */}
        {isApplying && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-[2rem]">
            <div className="bg-white rounded-lg p-6 text-center max-w-sm mx-4">
              {currentQuestion ? (
                // Question UI
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Application Question</h3>
                  <p className="text-gray-700">{currentQuestion}</p>
                  
                  {questionType === 'radio' && questionOptions.length > 0 && (
                    <div className="space-y-2">
                      {questionOptions.map((option, index) => (
                        <label key={index} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="question"
                            value={option}
                            checked={questionInputValue === option}
                            onChange={() => handleRadioSelect(option)}
                            className="text-purple-600"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {questionType === 'text' && (
                    <input
                      type="text"
                      value={questionInputValue}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Enter your answer..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                  
                  {questionType === 'number' && (
                    <input
                      type="number"
                      value={questionInputValue}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Enter number..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAnswerSubmit}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                      Submit Answer
                    </button>
                    <button
                      onClick={handleSkipQuestion}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                  
                  <button
                    onClick={handleCancelApplication}
                    className="w-full px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
                  >
                    Cancel Application
                  </button>
                </div>
              ) : (
                // Loading UI
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-purple-600 mx-auto"></div>
                  <h3 className="text-lg font-bold text-gray-900">Processing Application</h3>
                  <p className="text-gray-600 text-sm">{applicationProgress}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Message Overlay */}
        {showSuccessMessage && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-[2rem] animate-fade-in">
            <div className="bg-white rounded-lg p-6 text-center max-w-sm mx-4 animate-bounce-in">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <svg className="w-10 h-10 text-white animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 animate-fade-in-up">Application Successful!</h3>
              <p className="text-gray-700 mb-2 animate-fade-in-up animation-delay-200">{successMessage}</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-3 animate-fade-in-up animation-delay-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Moving to next job...</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse animation-delay-200"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse animation-delay-400"></div>
              </div>
            </div>
          </div>
        )}

        {/* Failure Message Overlay */}
        {showFailureMessage && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-[2rem] animate-fade-in">
            <div className="bg-white rounded-lg p-6 text-center max-w-sm mx-4 animate-bounce-in">
              <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 animate-fade-in-up">Application Unsuccessful</h3>
              <p className="text-gray-700 mb-2 animate-fade-in-up animation-delay-200">{failureMessage}</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-3 animate-fade-in-up animation-delay-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Moving to next job...</span>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse animation-delay-200"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse animation-delay-400"></div>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Header Section */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          {/* Job Title, Company, and Status */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold text-black leading-tight">
                {currentJob.title}
              </h2>
              <p className="text-gray-600 text-lg font-semibold">
                {currentJob.company}
              </p>
            </div>
            
            {/* Status in top right */}
            <div className="flex flex-col items-end space-y-2 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  <JobStatsBubble totalJobs={totalJobs} remainingJobs={remainingJobs} viewedJobs={viewedJobs} />
                </span>
              </div>
            </div>
          </div>
          
          {/* Tags - Horizontal scroll */}
          <div className="mb-4">
            {extractTags(currentJob).length > 0 ? (
              <div 
                className="flex gap-2 overflow-x-auto pb-2"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {extractTags(currentJob).map((tag, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-[#7300FF] font-bold px-4 py-2 rounded-[2rem] text-sm whitespace-nowrap flex-shrink-0"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 text-sm">No tags available</span>
            )}
          </div>
          
          {/* Location and Salary */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-gray-600 text-sm">
              <span role="img" aria-label="location" className="mr-1">📍</span>
              {currentJob.location || 'Location not specified'}
            </div>
            {currentJob.salary && (
              <div className="text-[#7300FF] font-semibold text-sm">
                {currentJob.salary}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-4">
          {/* Description */}
          {currentJob.description && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {truncateToFourSentences(currentJob.description)}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center w-full px-6 pb-6 flex-shrink-0">
          {/* Pass, Bookmark, and Apply Buttons */}
          <div className="flex gap-4 mb-3 w-full justify-between items-center">
            {/* Pass Button - Left */}
            <button 
              id="pass-button"
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-semibold text-lg transition-colors shadow-lg flex-1 min-w-0 z-10 relative"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[SwipeCard] Pass button clicked - ID:', e.currentTarget.id);
                onSwipe('left', currentJob);
              }}
              disabled={isApplying}
              type="button"
            >
              Pass
            </button>
            
            {/* Bookmark Button - Center */}
            <button
              id="bookmark-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[SwipeCard] Bookmark button clicked - ID:', e.currentTarget.id);
                handleSaveClick(currentJob);
              }}
              disabled={isApplying}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 flex-shrink-0 z-10 relative ${
                isJobSaved(currentJob)
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-200'
              }`}
              type="button"
            >
              {isJobSaved(currentJob) ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              )}
            </button>
            
            {/* Apply Button - Right */}
            <button 
              id="apply-button"
              className={`px-6 py-3 rounded-full font-semibold text-lg transition-colors shadow-lg flex-1 min-w-0 z-10 relative ${
                effectiveSessionActive && !hasReachedDailyLimit
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[SwipeCard] Apply button clicked - ID:', e.currentTarget.id);
                
                // Check if button is disabled and show appropriate message
                if (!effectiveSessionActive) {
                  setNotificationMessage('You need to start a session first before applying to jobs.');
                  setShowNotification(true);
                  return;
                }
                
                if (hasReachedDailyLimit) {
                  setNotificationMessage('You have reached your daily application limit. Please try again tomorrow.');
                  setShowNotification(true);
                  return;
                }
                
                // Only proceed if session is active and limit not reached
                if (effectiveSessionActive && !hasReachedDailyLimit) {
                  handleApplyJob(currentJob);
                }
              }}
              disabled={isApplying}
              type="button"
            >
              {isApplying ? 'Applying...' : 
               hasReachedDailyLimit ? 'Daily Limit Reached' : 
               effectiveSessionActive ? 'Apply' : 'Apply'}
            </button>
          </div>
          

        </div>
          </div>
        </div>
      )}
      
      {/* In-app Notification */}
      <Notification
        message={notificationMessage}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
        duration={3000}
      />

    </div>
  );
} 