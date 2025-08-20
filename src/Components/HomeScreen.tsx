import React, { useState, useEffect } from "react";
import { Job } from "../types/Job";
import SwipeCard from "./SwipeCard";
import AdditionalQuestionsModal from "./AdditionalQuestionsModal";
import Notification from "./Notification";
import Logo from "./Logo";


import { supabase } from '../supabaseClient';
import { fetchLinkedInFetchedJobs, convertLinkedInFetchedToAppJobFormat } from '../services/linkedinFetchedJobs';
import { markJobAsViewed, getJobPaginationState } from '../services/jobPaginationService';
import { startEasyApplyWorker } from '../services/easyApplyWorker';
import { sessionService } from '../services/sessionService';

import { useNetworkStatus } from '../hooks/useNetworkStatus';
import NetworkStatusBanner from './NetworkStatusBanner';
import NetworkStatusModal from './NetworkStatusModal';
import SessionManager from './SessionManager';
import { getBackendEndpoint } from '../utils/backendUrl';


interface UserAnswer {
  jobTitle: string;
  companyName: string;
  questions: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

interface HomeScreenProps {
  goToApplied: () => void;
  goToProfile: () => void;
  goToSaved: () => void;
  goToFilters: () => void;
  goToNotifications: () => void;
  goToPaywall: () => void;
  onApplyJob: (job: Job) => Promise<void>;
  onAnswerQuestion: (question: string, answer: string) => Promise<void>;
  onSaveJob: (job: Job) => Promise<void>;
  onRejectJob: (job: Job) => Promise<void>;
  savedJobs: Job[];
  userAnswers?: UserAnswer[];
  onSaveUserAnswers?: (answers: UserAnswer[]) => void;
  updateBadgeProgress: (badgeId: string, increment?: number) => void;
  userLocation: string;
  userRadius: number;
  jobs: Job[];
  jobsLoading: boolean;
  appliedJobs?: Job[];
  rejectedJobs?: Job[];
  profileData?: {
    location: string;
    radius: number;
    salary_min: number;
    salary_max: number;
    latitude: number;
    longitude: number;
  } | null;
}



const HomeScreen: React.FC<HomeScreenProps> = ({
  goToApplied,
  goToProfile,
  goToSaved,
  goToFilters,
  goToNotifications,
  goToPaywall,
  onApplyJob,
  onAnswerQuestion,
  onSaveJob,
  onRejectJob,
  savedJobs,
  userAnswers = [],
  onSaveUserAnswers,
  updateBadgeProgress,
  userLocation,
  userRadius,
  jobs,
  jobsLoading,
  appliedJobs,
  rejectedJobs,
  profileData,
}) => {
  const [currentJobIndex, setCurrentJobIndex] = useState(() => {
    // Try to restore from localStorage, but also calculate based on swiped jobs
    const savedIndex = localStorage.getItem('currentJobIndex');
    if (savedIndex) {
      const parsedIndex = parseInt(savedIndex, 10);
      // Ensure the index is valid for current job list
      if (!isNaN(parsedIndex) && parsedIndex >= 0) {
        return parsedIndex;
      }
    }
    return 0;
  });
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [isJobFetching, setIsJobFetching] = useState(false);
  const [jobFetchPercentage, setJobFetchPercentage] = useState<number>(0);
  const [pendingAction, setPendingAction] = useState<'apply' | 'reject' | null>(null);
  const [pendingJob, setPendingJob] = useState<Job | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [localUserAnswers, setLocalUserAnswers] = useState<UserAnswer[]>(userAnswers);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [showApplyNotification, setShowApplyNotification] = useState(false);
  const [showWorkerNotification, setShowWorkerNotification] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState(userLocation);
  const [radiusInput, setRadiusInput] = useState(userRadius.toString());
  const [savingLocation, setSavingLocation] = useState(false);
  const [paginationState, setPaginationState] = useState({
    totalJobs: 0,
    remainingJobs: 0,
    viewedJobs: 0
  });

  const [networkModalVisible, setNetworkModalVisible] = useState(false);
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const [isFetchingMoreJobs, setIsFetchingMoreJobs] = useState(false);
  const { isOnline } = useNetworkStatus();
  
  // Show network modal when offline
  useEffect(() => {
    if (!isOnline) {
      setNetworkModalVisible(true);
    } else {
      setNetworkModalVisible(false);
    }
  }, [isOnline]);
  const [linkedInJobs, setLinkedInJobs] = useState<Job[]>([]);
  const [linkedInJobsLoading, setLinkedInJobsLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [processingJobs, setProcessingJobs] = useState<Set<string>>(new Set());
  const [jobFetchProgress, setJobFetchProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  




  useEffect(() => {
    async function fetchAutoApplyEnabled() {
      // Always enable auto-apply for all jobs
      // setAutoApplyEnabled(true); // This line is removed
      
      // Also update the database to reflect this setting
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const userId = userData.user.id;
        await supabase
          .from('profiles')
          .update({ auto_apply_enabled: true })
          .eq('id', userId);
      }
    }
    fetchAutoApplyEnabled();
  }, []);

    // Load existing jobs from Supabase on mount
  useEffect(() => {
    const loadExistingJobs = async () => {
      try {
        console.log('🔄 Loading existing jobs from Supabase...');
        setLinkedInJobsLoading(true);
        const result = await fetchLinkedInFetchedJobs();
        if (result.success) {
          const convertedJobs = result.jobs.map(convertLinkedInFetchedToAppJobFormat);
          setLinkedInJobs(convertedJobs);
          console.log(`✅ Loaded ${convertedJobs.length} existing jobs from Supabase`);
          
          // Update pagination state to reflect existing jobs
          await updatePaginationState();
        } else if (result.error) {
          console.error('Failed to load existing jobs:', result.error);
        }
      } catch (error) {
        console.error('Error loading existing jobs:', error);
      } finally {
        setLinkedInJobsLoading(false);
      }
    };
    
    loadExistingJobs();
  }, []); // Only run once on mount
  


    // Set up WebSocket progress tracking for job fetching
  useEffect(() => {
    sessionService.setProgressCallback((progress: string) => {
      console.log('[HomeScreen] Progress update:', progress);
      
      // Handle session closure detection
      if (progress.includes('Browser session was closed')) {
        console.log('[HomeScreen] Browser session closed detected, stopping all fetch attempts');
        setIsJobFetching(false);
        setIsAutoFetching(false);
        setIsFetchingMoreJobs(false);
        setJobFetchProgress(null);
        setJobFetchPercentage(0);
        return;
      }
      
      // Only handle job fetch related progress
      if (progress.includes('Starting job fetch') || 
          progress.includes('Extracting job') || 
          progress.includes('Saving job') || 
          progress.includes('Job fetch completed') ||
          progress.includes('Job fetch failed')) {
        
        console.log('[HomeScreen] Job fetch progress detected:', progress);
        
        // Update the existing jobFetchProgress object
        if (progress.includes('Extracting job')) {
          const match = progress.match(/Extracting job (\d+)\/(\d+)/);
          if (match) {
            const jobNumber = parseInt(match[1]);
            const totalJobs = parseInt(match[2]);
            const percentage = Math.round((jobNumber / totalJobs) * 100);
            setJobFetchPercentage(percentage);
            setJobFetchProgress({ current: jobNumber, total: totalJobs, message: progress });
          }
        } else if (progress.includes('Saving job')) {
          const match = progress.match(/Saving job (\d+)\/\d+/);
          if (match) {
            const jobNumber = parseInt(match[1]);
            const totalMatch = progress.match(/Saving job \d+\/(\d+)/);
            const total = totalMatch ? parseInt(totalMatch[1]) : 15;
            const percentage = Math.round((jobNumber / total) * 100);
            setJobFetchPercentage(percentage);
            setJobFetchProgress({ current: jobNumber, total, message: progress });
          }
        } else if (progress.includes('Job fetch completed')) {
          setJobFetchPercentage(100);
          // Use the current total from existing progress or default to 15
          const currentTotal = jobFetchProgress?.total || 15;
          setJobFetchProgress({ current: currentTotal, total: currentTotal, message: progress });
          setIsJobFetching(false);
          setIsAutoFetching(false); // Reset auto fetching flag
          setIsFetchingMoreJobs(false); // Reset fetching more jobs flag
          
          // Load the fetched jobs
          setTimeout(async () => {
            try {
              const result = await fetchLinkedInFetchedJobs();
              if (result.success) {
                const convertedJobs = result.jobs.map(convertLinkedInFetchedToAppJobFormat);
                setLinkedInJobs(convertedJobs);
                console.log(`✅ Loaded ${convertedJobs.length} fresh jobs after fetch completion`);
                
                // Reset job index to start with fresh jobs
                setCurrentJobIndex(0);
                localStorage.removeItem('currentJobIndex');
                
                // Update pagination state to reflect new jobs
                await updatePaginationState();
              } else if (result.error) {
                console.error('Failed to load fresh jobs:', result.error);
              }
            } catch (error) {
              console.error('Error loading fresh jobs:', error);
            } finally {
              setJobFetchProgress(null);
            }
          }, 2000); // Wait 2 seconds for database to be updated
        } else if (progress.includes('Starting job fetch')) {
          setJobFetchPercentage(0);
          setJobFetchProgress({ current: 0, total: 15, message: progress });
          setIsJobFetching(true);
        } else if (progress.includes('Job fetch failed')) {
          // Reset flags when job fetch fails
          setIsJobFetching(false);
          setIsAutoFetching(false);
          setIsFetchingMoreJobs(false);
          setJobFetchProgress(null);
          setJobFetchPercentage(0);
        } else {
          // For other progress messages, update the message
          setJobFetchProgress(prev => prev ? { ...prev, message: progress } : { current: 0, total: 15, message: progress });
        }
      }
    });

    return () => {
      sessionService.setProgressCallback(null);
    };
  }, []);






  const [autoAppliesUsed, setAutoAppliesUsed] = useState(() => Number(localStorage.getItem('aa_used')) || 0);
  const [usageDate, setUsageDate] = useState<string | null>(() => localStorage.getItem('aa_usageDate'));
  const [applicationLimit, setApplicationLimit] = useState(15); // Base daily limit
  useEffect(() => {
    async function fetchUsage() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const userId = userData.user.id;
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('auto_applies_used_today, auto_apply_usage_date, login_streak, last_reward_claimed_date')
        .eq('id', userId)
        .single();
      if (error || !profile) return;
      const today = new Date().toISOString().slice(0, 10);
      if (profile.auto_apply_usage_date !== today) {
        // Reset usage for new day
        await supabase.from('profiles').update({ auto_applies_used_today: 0, auto_apply_usage_date: today }).eq('id', userId);
        setAutoAppliesUsed(0);
        setUsageDate(today);
        localStorage.setItem('aa_used', '0');
        localStorage.setItem('aa_usageDate', today);
        setApplicationLimit(15); // Reset to base limit for new day
      } else {
        setAutoAppliesUsed(profile.auto_applies_used_today || 0);
        setUsageDate(profile.auto_apply_usage_date);
        localStorage.setItem('aa_used', String(profile.auto_applies_used_today || 0));
        localStorage.setItem('aa_usageDate', profile.auto_apply_usage_date);
        
        // Calculate daily reward bonus
        const loginStreak = profile.login_streak || 0;
        const lastRewardClaimed = profile.last_reward_claimed_date;
        let rewardBonus = 0;
        
        // Check if reward was claimed today
        if (lastRewardClaimed === today && loginStreak > 0) {
          // 7-day reward cycle with specific amounts
          const rewards = [2, 2, 3, 4, 5, 5, 10]; // Day 1-7 rewards
          const rewardIndex = ((loginStreak - 1) % 7 + 7) % 7;
          rewardBonus = rewards[rewardIndex];
        }
        
        // Update application limit with reward bonus
        setApplicationLimit(15 + rewardBonus);
      }
    }
    fetchUsage();
    
    // Listen for usage count refresh events
    const handleRefreshUsage = () => {
      fetchUsage();
    };
    
    window.addEventListener('refreshUsageCount', handleRefreshUsage);
    
    return () => {
      window.removeEventListener('refreshUsageCount', handleRefreshUsage);
    };
  }, []);

  useEffect(() => {
    if (!userLocation || userLocation.trim() === "" || !userRadius) {
      setShowLocationModal(true);
    }
  }, [userLocation, userRadius]);

  // Initialize pagination state
  useEffect(() => {
    updatePaginationState();
  }, []);

  const handleSaveLocation = async () => {
    if (!locationInput || !radiusInput) return;
    setSavingLocation(true);
    // TODO: Save location and radius to backend or parent state
    // For now, just close the modal
    setShowLocationModal(false);
    setSavingLocation(false);
    // Optionally, call a prop or context to update userLocation/userRadius
  };


  const maxDistance = userRadius + 10;
  // Filter out jobs that have already been swiped (applied, saved, or rejected)
  // This should be based on the job_swipes table, but for now we'll use the local state
  // TODO: Implement proper filtering based on job_swipes table
  const swipedJobIds = new Set([
    ...savedJobs.map(j => j.id),
    ...(typeof appliedJobs !== 'undefined' ? appliedJobs.map(j => j.id) : []),
    ...(typeof rejectedJobs !== 'undefined' ? rejectedJobs.map(j => j.id) : [])
  ]);
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const userLocationLower = (userProfile?.location || userLocation || '').toLowerCase();
  // Only show jobs that are NOT from direct employer, and include LinkedIn fetched jobs
  const availableJobs = [...jobs, ...linkedInJobs]
    .filter(job => job.source !== 'Direct Employer')
    .slice(0, 20); // Limit to 20 jobs

  // Log jobs only when they change, not on every render
  useEffect(() => {
    if (jobs.length > 0 || linkedInJobs.length > 0) {
      console.log(`Jobs passed to HomeScreen: ${jobs.length}, LinkedIn jobs: ${linkedInJobs.length}, Available: ${availableJobs.length}`);
    }
    
    // Update pagination state when jobs change
    if (linkedInJobs.length > 0) {
      updatePaginationState();
    }
  }, [jobs.length, linkedInJobs.length, availableJobs.length]);

  // Calculate the correct starting index based on already swiped jobs
  useEffect(() => {
    if (availableJobs.length > 0 && currentJobIndex === 0) {
      // Only reset to first unswiped job if we're at index 0 (initial load)
      const firstUnswipedIndex = availableJobs.findIndex(job => 
        !swipedJobIds.has(job.id)
      );
      
      if (firstUnswipedIndex !== -1 && firstUnswipedIndex !== 0) {
        setCurrentJobIndex(firstUnswipedIndex);
      }
    }
  }, [availableJobs, swipedJobIds]); // Removed currentJobIndex from dependencies

  // Only reset currentJobIndex when pagination is actually reset (not just when jobs are added)
  useEffect(() => {
    const checkPaginationReset = () => {
      const savedIndex = localStorage.getItem('currentJobIndex');
      // Only reset if there's no saved index AND we're not at 0 AND we have jobs
      if (!savedIndex && currentJobIndex !== 0 && availableJobs.length > 0) {
        console.log('🔄 Detected pagination reset, forcing currentJobIndex to 0');
        setCurrentJobIndex(0);
      }
    };
    
    checkPaginationReset();
  }, [currentJobIndex, availableJobs.length]);



  // Handle job index management
  useEffect(() => {
    // Only reset if we're actually out of bounds (not just when new jobs are added)
    if (availableJobs.length > 0 && currentJobIndex >= availableJobs.length) {
      console.log('🔄 Current job index is out of bounds, resetting to 0');
      setCurrentJobIndex(0);
      localStorage.removeItem('currentJobIndex');
    }
    
    // Note: Job fetching is now triggered by session start, not by reaching the end
    // This provides a better user experience with fresh jobs per session
  }, [currentJobIndex, availableJobs.length]);

  // Note: Job fetching is now triggered by session start, not by pagination reset
  // This provides a better user experience with fresh jobs per session



  const handleNextJob = () => {
    console.log('[HomeScreen] handleNextJob called, current index:', currentJobIndex, 'available jobs:', availableJobs.length);
    
    setCurrentJobIndex(prev => {
      const nextIndex = prev + 1;
      // If we've reached the end, trigger a new job fetch
      if (nextIndex >= availableJobs.length) {
        console.log('[HomeScreen] Reached end of jobs, triggering new job fetch...');
        
        // Trigger new job fetch if session is active
        if (isSessionActive && !isFetchingMoreJobs && !isAutoFetching) {
          triggerNewJobFetch();
        }
        
        return availableJobs.length - 1;
      }
      console.log('[HomeScreen] Advancing to index:', nextIndex);
      return nextIndex;
    });
  };

  // Function to trigger a new job fetch when user reaches the end
  const triggerNewJobFetch = async () => {
    console.log('[HomeScreen] Triggering new job fetch for more jobs...');
    
    if (!isSessionActive) {
      console.log('[HomeScreen] Session not active, cannot fetch more jobs');
      return;
    }
    
    if (isFetchingMoreJobs || isAutoFetching) {
      console.log('[HomeScreen] Already fetching jobs, skipping...');
      return;
    }
    
    setIsFetchingMoreJobs(true);
    setIsJobFetching(true);
    setJobFetchProgress({ current: 0, total: 15, message: 'Fetching more jobs...' });
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Get user's desired job title from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('desired_job_title')
        .eq('id', user.id)
        .single();

      // Prepare search filters from profile data
      const searchFilters = profileData ? {
        location: profileData.location,
        radius: profileData.radius,
        salaryMin: profileData.salary_min,
        salaryMax: profileData.salary_max,
        jobTitle: profile?.desired_job_title || 'Software Engineer'
      } : undefined;

      // Trigger job fetching on backend
      const response = await fetch(getBackendEndpoint('/api/fetch-jobs'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id,
          searchFilters 
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          console.log('⚠️ Job fetch already in progress, waiting for completion...');
          // Don't reset the loading state, let the WebSocket progress handle it
          return;
        } else {
          console.error('Failed to trigger job fetching:', response.status, response.statusText);
          setIsJobFetching(false);
          setJobFetchProgress(null);
          return;
        }
      }

      console.log('✅ New job fetch triggered successfully');
      
      // Progress updates will come via WebSocket
      // Jobs will be loaded automatically when fetch completes
      
    } catch (error) {
      console.error('Error triggering new job fetch:', error);
      setIsJobFetching(false);
      setJobFetchProgress(null);
    } finally {
      setIsFetchingMoreJobs(false);
    }
  };

  const handleShowQuestionsModal = (job: Job, action: 'apply' | 'reject') => {
    setPendingJob(job);
    setPendingAction(action);
    setShowQuestionsModal(true);
  };

  const handleQuestionsModalConfirm = (answers: Record<string, string>) => {
    console.log('Additional questions answered:', answers);
    
    if (pendingJob && pendingJob.additionalQuestions) {
      const questionAnswers = pendingJob.additionalQuestions.map(q => ({
        id: q.id,
        question: q.question,
        answer: answers[q.id] || '',
      }));

      const newUserAnswer: UserAnswer = {
        jobTitle: pendingJob.title,
        companyName: pendingJob.company,
        questions: questionAnswers,
      };

      const updatedAnswers = [...localUserAnswers, newUserAnswer];
      setLocalUserAnswers(updatedAnswers);
      
      if (onSaveUserAnswers) {
        onSaveUserAnswers(updatedAnswers);
      }
    }
    
    setShowQuestionsModal(false);
    setPendingAction(null);
    setPendingJob(null);
    
    if (pendingAction === 'apply') {
      // Start the application process with questions answered
      const startApplicationWithQuestions = async () => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) return;
          
          // Add job to applied jobs with "questions" status
          const jobWithQuestionsStatus = {
            ...pendingJob!,
            status: 'questions' as const,
            appliedDate: new Date()
          };
          
          await onApplyJob(jobWithQuestionsStatus);
          
          // Store the job swipe in the database
          const { error: insertError } = await supabase
            .from('job_swipes')
            .upsert({
              user_id: userData.user.id,
              job_id: pendingJob!.id,
              swipe_direction: 'right',
              swiped_at: new Date().toISOString(),
              application_processed: false
            }, {
              onConflict: 'user_id,job_id'
            });
          
          if (insertError) {
            console.error('Error storing job swipe:', insertError);
            // Update status to error
            const jobWithErrorStatus = {
              ...pendingJob!,
              status: 'error' as const,
              appliedDate: new Date()
            };
            await onApplyJob(jobWithErrorStatus);
            return;
          }
          
          // Start backend apply process if it's a LinkedIn job
          if ((pendingJob!.source === 'LinkedIn' || pendingJob!.source === 'LinkedIn Fetched Jobs') && pendingJob!.url) {
            try {
              // Start the easy-apply-worker directly
              await startEasyApplyWorker(userData.user.id, { email: '', password: '' });
              console.log('✅ Job with questions sent to easy-apply-worker');
              
              // Mark job as processing
              const jobWithProcessingStatus = {
                ...pendingJob!,
                status: 'questions' as const,
                appliedDate: new Date()
              };
              await onApplyJob(jobWithProcessingStatus);
              
              setShowWorkerNotification(true);
              
            } catch (error) {
              console.error('❌ Error starting easy-apply-worker (with questions):', error);
              // Update status to error
              const jobWithErrorStatus = {
                ...pendingJob!,
                status: 'error' as const,
                appliedDate: new Date()
              };
              await onApplyJob(jobWithErrorStatus);
            }
          } else {
            // For non-LinkedIn jobs, mark as applied
            const jobWithAppliedStatus = {
              ...pendingJob!,
              status: 'applied' as const,
              appliedDate: new Date()
            };
            await onApplyJob(jobWithAppliedStatus);
            setShowApplyNotification(true);
          }
          
        } catch (error) {
          console.error('Error in application process with questions:', error);
          // Update status to error
          const jobWithErrorStatus = {
            ...pendingJob!,
            status: 'error' as const,
            appliedDate: new Date()
          };
          await onApplyJob(jobWithErrorStatus);
        }
      };
      
      startApplicationWithQuestions();
      handleNextJob();
    } else if (pendingAction === 'reject') {
      onRejectJob(pendingJob!);
      handleNextJob();
    }
  };

  const handleQuestionsModalClose = () => {
    setShowQuestionsModal(false);
    setPendingAction(null);
    setPendingJob(null);
  };

  const handleSwipe = (direction: 'left' | 'right', job: Job) => {
    console.log('[HomeScreen] handleSwipe called:', { direction, jobId: job.id, jobTitle: job.title, currentIndex: currentJobIndex });
    console.log('[HomeScreen] Direction is:', direction, 'This should NOT trigger apply for left swipe');
    updateBadgeProgress('swipe-master');
    
    // Mark job as viewed and check for refetching
    const markJobViewed = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        
        // Mark job as viewed
        await markJobAsViewed(userData.user.id, job.id, direction);
        
        // Update pagination state
        await updatePaginationState();
        
        // Note: Job fetching is now handled by session management, not by swiping
        // This prevents the job fetcher loop issue
      } catch (error) {
        console.error('Error marking job as viewed:', error);
      }
    };
    
    markJobViewed();
    
    // Since we removed swipe functionality, this function now only handles job viewing
    // The actual application is handled by the Apply Now button in SwipeCard
    console.log('📝 Job marked as viewed:', job.title);
    
    // Move to next job after marking as viewed
    handleNextJob();
  };

  const handleSaveJob = async (job: Job) => {
    await onSaveJob(job);
    setShowSaveNotification(true);
    // Move to next job after saving
    handleNextJob();
  };

  const handleApplyJob = async (job: Job) => {
    // Call the original onApplyJob (auto-apply usage is now handled in App.tsx)
    await onApplyJob(job);
    
    // Update local state immediately for better UX
    const newUsage = autoAppliesUsed + 1;
    setAutoAppliesUsed(newUsage);
    
    // Also refresh from database to ensure consistency
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('auto_applies_used_today')
        .eq('id', userData.user.id)
        .single();
      
      if (profile) {
        setAutoAppliesUsed(profile.auto_applies_used_today || 0);
      }
    }
  };

  const updatePaginationState = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      const state = await getJobPaginationState(userData.user.id);
      setPaginationState(state);
    } catch (error) {
      console.error('Error updating pagination state:', error);
    }
  };

  // Auto-apply is always enabled, no need to persist
  useEffect(() => { localStorage.setItem('currentJobIndex', String(currentJobIndex)); }, [currentJobIndex]);

  // Check session status on mount and periodically
  useEffect(() => {
    const checkSessionStatus = async () => {
      try {
        const sessionStatus = await sessionService.getSessionStatus();
        const wasActive = isSessionActive;
        const isNowActive = sessionStatus.isActive;
        setIsSessionActive(isNowActive);
        
        // If session became inactive, reset all fetch states
        if (wasActive && !isNowActive) {
          console.log('[HomeScreen] Session became inactive, resetting all fetch states');
          setIsJobFetching(false);
          setIsAutoFetching(false);
          setIsFetchingMoreJobs(false);
          setJobFetchProgress(null);
          setJobFetchPercentage(0);
        }
      } catch (error) {
        console.error('Error checking session status:', error);
      }
    };

    // Check immediately
    checkSessionStatus();

    // Check every 5 seconds to stay in sync with AutoApplyScreen
    const interval = setInterval(checkSessionStatus, 5000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-50">
      <NetworkStatusBanner />
      <NetworkStatusModal 
        isOpen={networkModalVisible} 
        onClose={() => setNetworkModalVisible(false)} 
      />

      {/* Session Manager - Hidden but active for session management */}
      <div style={{ display: 'none' }}>
        <SessionManager 
          onSessionChange={setIsSessionActive}
          onShowPaywall={goToPaywall}
          onSessionStarted={async () => {
            console.log('[HomeScreen] Session started, triggering automatic job fetch...');
            
            // Prevent multiple rapid job fetch attempts
            if (isAutoFetching) {
              console.log('[HomeScreen] Auto fetch already in progress, skipping...');
              return;
            }
            
            setIsAutoFetching(true);
            setIsJobFetching(true);
            setJobFetchProgress({ current: 0, total: 15, message: 'Starting job fetch with pagination...' });
            
            try {
              // Add a delay to ensure session is fully ready
              await new Promise(resolve => setTimeout(resolve, 2000));
              

              
              // Get current user
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                console.error('No authenticated user found');
                return;
              }

              // Get user's desired job title from profile
              const { data: profile } = await supabase
                .from('profiles')
                .select('desired_job_title')
                .eq('id', user.id)
                .single();

              // Prepare search filters from profile data
              const searchFilters = profileData ? {
                location: profileData.location,
                radius: profileData.radius,
                salaryMin: profileData.salary_min,
                salaryMax: profileData.salary_max,
                jobTitle: profile?.desired_job_title || 'Software Engineer'
              } : undefined;

              // Trigger job fetching on backend
              const response = await fetch(getBackendEndpoint('/api/fetch-jobs'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  userId: user.id,
                  searchFilters 
                }),
              });

              if (!response.ok) {
                if (response.status === 409) {
                  console.log('⚠️ Job fetch already in progress, waiting for completion...');
                  // Don't reset the loading state, let the WebSocket progress handle it
                  return;
                } else {
                  console.error('Failed to trigger job fetching:', response.status, response.statusText);
                  setIsJobFetching(false);
                  setJobFetchProgress(null);
                  return;
                }
              }

              console.log('✅ Job fetch triggered successfully');
              
              // Progress updates will come via WebSocket
              // Jobs will be loaded automatically when fetch completes
              
            } catch (error) {
              console.error('[HomeScreen] Error in automatic job fetch:', error);
              setIsJobFetching(false);
              setJobFetchProgress(null);
            } finally {
              setIsAutoFetching(false);
            }
          }}
        />
      </div>

      {/* Top Nav */}
      <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] p-4 rounded-b-[2rem] z-10 flex items-center justify-center">
        <div className="mt-6 bg-white/100 rounded-3xl flex justify-center items-center px-8 py-2 gap-8 w-fit border-2 border-gray-400">
          <button onClick={goToNotifications} className="text-white text-[30px]">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="35" height="35">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M4.51555 7C3.55827 8.4301 3 10.1499 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3V6M12 12L8 8" stroke="#878787" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"></path>
              </g>
            </svg>
          </button>
          <button onClick={goToProfile} className="text-white text-[30px]">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#878787" strokeWidth="1.896" width="35" height="35">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <g id="style=linear">
                  <g id="profile">
                    <path id="vector" d="M12 11C14.4853 11 16.5 8.98528 16.5 6.5C16.5 4.01472 14.4853 2 12 2C9.51472 2 7.5 4.01472 7.5 6.5C7.5 8.98528 9.51472 11 12 11Z" stroke="#878787" strokeWidth="1.896" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path id="rec" d="M5 18.5714C5 16.0467 7.0467 14 9.57143 14H14.4286C16.9533 14 19 16.0467 19 18.5714C19 20.465 17.465 22 15.5714 22H8.42857C6.53502 22 5 20.465 5 18.5714Z" stroke="#878787" strokeWidth="1.896"></path>
                  </g>
                </g>
              </g>
            </svg>
          </button>
          <button onClick={goToFilters} className="text-white text-[30px]">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#878787" width="35" height="35">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M10.5026 5.01692L9.96661 3.65785C9.62068 2.78072 8.37933 2.78072 8.03339 3.65784L6.96137 6.37599C6.85576 6.64378 6.64378 6.85575 6.37599 6.96137L3.65785 8.03339C2.78072 8.37932 2.78072 9.62067 3.65784 9.96661L6.37599 11.0386C6.64378 11.1442 6.85575 11.3562 6.96137 11.624L8.03339 14.3422C8.37932 15.2193 9.62067 15.2193 9.96661 14.3422L11.0386 11.624C11.1442 11.3562 11.3562 11.1442 11.624 11.0386L14.3422 9.96661C15.2193 9.62068 15.2193 8.37933 14.3422 8.03339L12.9831 7.49738" stroke="#878787" strokeWidth="1.92" strokeLinecap="round"></path>
                <path d="M16.4885 13.3481C16.6715 12.884 17.3285 12.884 17.5115 13.3481L18.3121 15.3781C18.368 15.5198 18.4802 15.632 18.6219 15.6879L20.6519 16.4885C21.116 16.6715 21.116 17.3285 20.6519 17.5115L18.6219 18.3121C18.4802 18.368 18.368 18.4802 18.3121 18.6219L17.5115 20.6519C17.3285 21.116 16.6715 21.116 16.4885 20.6519L15.6879 18.6219C15.632 18.4802 15.5198 18.368 15.3781 18.3121L13.3481 17.5115C12.884 17.3285 12.884 16.6715 13.3481 16.4885L15.3781 15.6879C15.5198 15.632 15.632 15.5198 15.6879 15.3781L16.4885 13.3481Z" stroke="#878787" strokeWidth="1.92"></path>
              </g>
            </svg>
          </button>


        </div>
      </div>



      {/* Page Content Wrapper */}
      <div className="flex-1 flex items-center justify-center px-4 w-full mt-32 mb-32">
        {linkedInJobsLoading || isRefetching || isJobFetching ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#A100FF] mb-4"></div>
            <h2 className="text-xl font-bold text-[#A100FF] mb-2">
              {isFetchingMoreJobs 
                ? '🔄 Fetching More Jobs...' 
                : isJobFetching && jobFetchProgress 
                  ? `🔍 Fetching Jobs (${jobFetchProgress.current}/${jobFetchProgress.total})` 
                  : isRefetching 
                    ? '🔄 Refreshing Jobs' 
                    : linkedInJobsLoading
                      ? '📋 Loading Jobs from Database'
                      : '📋 Loading Jobs'
              }
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              {isFetchingMoreJobs 
                ? 'You\'ve reached the end of available jobs. Fetching fresh opportunities from LinkedIn...' 
                : isJobFetching && jobFetchProgress 
                  ? jobFetchProgress.message 
                  : isRefetching 
                    ? 'Fetching new job opportunities from LinkedIn...' 
                    : linkedInJobsLoading
                      ? 'Loading fresh job opportunities from all over the web...'
                      : 'Fetching fresh job opportunities...'
              }
            </p>
            {isJobFetching && jobFetchProgress && (
              <div className="w-full max-w-xs">
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-[#984DE0] to-[#7300FF] h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(jobFetchProgress.current / jobFetchProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  {jobFetchProgress.current} of {jobFetchProgress.total} jobs processed
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-xs">
                    💡 Extracting detailed job information including salary, location, and descriptions
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : availableJobs.length === 0 && !linkedInJobsLoading ? (
          <div className="flex flex-col items-center justify-center text-center max-w-md">
            <div className="mb-6">
              <Logo size="xl" showText={false} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isSessionActive ? 'No Jobs Available' : 'Start Your Job Search Session'}
            </h2>
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              {isSessionActive 
                ? 'You\'ve reviewed all available jobs! More jobs will be automatically fetched when you run out. Start a session to begin your job search.'
                : 'To discover fresh job opportunities, you need to start an application session. This will open a browser and fetch the latest jobs from LinkedIn.'
              }
            </p>
            {!isSessionActive && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-sm">
                    💡 <strong>Tip:</strong> Jobs are automatically fetched when you need them. (meaning fresh job opportunities every time!)
                  </p>
                </div>
                <button 
                  onClick={goToNotifications}
                  className="bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Start Session
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <SwipeCard
              jobs={availableJobs}
              currentIndex={currentJobIndex}
              onSwipe={handleSwipe}
              onSaveJob={handleSaveJob}
              onApplyJob={handleApplyJob}
              onAnswerQuestion={onAnswerQuestion}
              savedJobs={savedJobs}
              onNextJob={handleNextJob}
              onExpandSearch={goToFilters}
              isSessionActive={isSessionActive}

              totalJobs={paginationState.totalJobs}
              remainingJobs={paginationState.remainingJobs}
              viewedJobs={paginationState.viewedJobs}
              
              autoAppliesUsed={autoAppliesUsed}
              autoApplyLimit={applicationLimit}
            />
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-t-[2rem] p-8 z-10 flex items-center justify-center">
        <div className="w-fit mx-auto bg-white rounded-3xl flex justify-center items-center gap-6 py-3 px-8 shadow-lg border-2 border-gray-400">
          <button onClick={goToSaved} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">
            Saved
          </button>
          <span className="text-purple-600 font-bold text-xl underline decoration-2 underline-offset-4 transition-all duration-300 transform scale-110">
            Discover
          </span>
          <button onClick={goToApplied} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">
            Applied
          </button>
        </div>
      </div>

      {/* Additional Questions Modal */}
      {showQuestionsModal && pendingJob && pendingJob.additionalQuestions && (
        <AdditionalQuestionsModal
          isOpen={showQuestionsModal}
          onClose={handleQuestionsModalClose}
          onConfirm={handleQuestionsModalConfirm}
          questions={pendingJob.additionalQuestions}
          jobTitle={pendingJob.title}
          companyName={pendingJob.company}
        />
      )}

      {/* Save Success Notification */}
      <Notification
        message="Job saved successfully!"
        isVisible={showSaveNotification}
        onClose={() => setShowSaveNotification(false)}
        duration={2000}
      />

      {/* Apply Success Notification */}
      <Notification
        message="Job applied successfully!"
        isVisible={showApplyNotification}
        onClose={() => setShowApplyNotification(false)}
        duration={2000}
      />

      {/* Easy Apply Worker Notification */}
      <Notification
        message="🚀 Easy Apply Worker is starting and will apply to this job automatically..."
        isVisible={showWorkerNotification}
        onClose={() => setShowWorkerNotification(false)}
        duration={4000}
      />





      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-center">Where are you located?</h2>
            <p className="text-gray-600 mb-4 text-center">Enter your location and how far you're willing to search for jobs. This helps us show you the best opportunities!</p>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 text-base"
              placeholder="Enter your city or zip code"
              value={locationInput}
              onChange={e => setLocationInput(e.target.value)}
              disabled={savingLocation}
            />
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 text-base"
              placeholder="Search radius in miles"
              value={radiusInput}
              onChange={e => setRadiusInput(e.target.value)}
              min={1}
              max={200}
              disabled={savingLocation}
            />
            <button
              className="w-full py-3 rounded-full bg-[#A100FF] text-white text-lg font-semibold shadow hover:bg-[#6C00FF] transition-colors mt-2 disabled:opacity-60"
              onClick={handleSaveLocation}
              disabled={!locationInput || !radiusInput || savingLocation}
            >
              {savingLocation ? 'Saving...' : 'Save Location'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
