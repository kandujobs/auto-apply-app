import React, { useState, useEffect, useRef } from "react";
import HomeScreen from "./Components/HomeScreen";
import AppliedScreen from "./Components/AppliedScreen";
import ProfileScreen from "./Components/ProfileScreen";
import SavedScreen from "./Components/SavedScreen";
import AutoApplyScreen from "./Components/AutoApplyScreen";
import FiltersScreen from "./Components/FiltersScreen";
import OnboardingScreen from "./Components/Onboarding/OnboardingScreen";
import SignInScreen from "./Components/Onboarding/SignInScreen";
import AccountCreationScreen from "./Components/Onboarding/AccountCreationScreen";
import VerifyEmailScreen from "./Components/Onboarding/VerifyEmailScreen";
import ResumeUploadScreen from "./Components/Onboarding/ResumeUploadScreen";
import ResumeReviewScreen from "./Components/Onboarding/ResumeReviewScreen";
import TutorialScreen from "./Components/Onboarding/TutorialScreen";
import BasicInfoScreen from "./Components/Onboarding/BasicInfoScreen";
import ExperienceScreen from "./Components/Onboarding/ExperienceScreen";
import InterestsScreen from "./Components/Onboarding/InterestsScreen";
import NotificationsPrivacyScreen from "./Components/NotificationsPrivacyScreen";
import AccountSettingsScreen from "./Components/AccountSettingsScreen";
import PaywallScreen from "./Components/PaywallScreen";
import TrialExpiryBanner from "./Components/TrialExpiryBanner";
import UpgradeModal from "./Components/UpgradeModal";
import { BadgeAchievementNotification, useBadgeManager } from "./Components/SmartFeedSections/Badges";
import { Job } from "./types/Job";
import { paymentService, UserAccess } from "./services/paymentService";
import PrivacyPolicy from "./Components/PrivacyPolicy";
import TermsOfService from "./Components/TermsOfService";


import { Experience, Education, UserProfile } from "./types/Profile";
import { supabase } from "./supabaseClient";
import { calculateFitScore } from "./data/fitScore";
import UpgradeScreen from "./Components/UpgradeScreen";
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './index.css';
import EmployerSignUpScreen from './Components/Employer/EmployerSignUpScreen';
import EmployerHomeScreen from './Components/Employer/EmployerHomeScreen';
import EmployerApp from './Components/Employer/EmployerApp';
import NetworkStatusModal from './Components/NetworkStatusModal';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { getBackendEndpoint } from './utils/backendUrl';


function App() {
  const [screen, setScreen] = useState<
    "home" | "applied" | "profile" | "saved" | "notifications" | "filters" | "notificationsPrivacy" | "accountSettings" | "upgrade"
  >("home");

  // Onboarding/sign-in state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  // Start with empty saved jobs
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);

  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);

  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [onboardingStep, setOnboardingStep] = useState<'welcome' | 'resume' | 'review' | 'tutorial' | 'noResumeAnimation' | 'basicInfo' | 'experience' | 'interests'>('welcome');

  // Placeholder parsed resume data
  const [parsedResume, setParsedResume] = useState([
    {
      title: 'Work Experience',
      fields: [
        { label: 'Company', value: 'Acme Corp' },
        { label: 'Role', value: 'Software Engineer' },
        { label: 'Years', value: '2019-2023' },
      ],
    },
    {
      title: 'Education',
      fields: [
        { label: 'School', value: 'State University' },
        { label: 'Degree', value: 'BSc Computer Science' },
      ],
    },
    {
      title: 'Certifications',
      fields: [
        { label: 'Certification', value: 'AWS Certified Developer' },
      ],
    },
    {
      title: 'Account Information',
      fields: [
        { label: 'Email', value: 'user@email.com' },
      ],
    },
    {
      title: 'Other',
      fields: [
        { label: 'LinkedIn', value: 'linkedin.com/in/username' },
      ],
    },
  ]);

  // Store user info for summary
  const [basicInfo, setBasicInfo] = useState<{ name: string; location: string; radius: number } | null>(null);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [interests, setInterests] = useState<{ skills: string[]; interests: string[] } | null>(null);

  // Use badge manager hook
  const { badges, currentAchievement, updateBadgeProgress, closeAchievement, viewBadges } = useBadgeManager();

  const [userLocation, setUserLocation] = useState("New York, NY");
  const [userRadius, setUserRadius] = useState(25);
  
  // Network status
  const { isOnline } = useNetworkStatus();
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  
  // Show network modal when offline
  useEffect(() => {
    if (!isOnline) {
      setShowNetworkModal(true);
    } else {
      setShowNetworkModal(false);
    }
  }, [isOnline]);



  const [signInError, setSignInError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const lastProfileIdRef = useRef<string | null>(null);



  const [checkingAuth, setCheckingAuth] = useState(true);

  const [globalError, setGlobalError] = useState<string | null>(null);

  // Payment and subscription state
  const [showPaywall, setShowPaywall] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);

  // Move these useRef hooks up here
  const homeRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef<HTMLDivElement>(null);
  const appliedRef = useRef<HTMLDivElement>(null);

  // Define applyJob and saveJob functions early to avoid hoisting issues
  async function applyJob(job: Job) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;
    
    // Check if session is active first
            const sessionResponse = await fetch(getBackendEndpoint(`/api/session/status/${userId}`));
    const sessionStatus = await sessionResponse.json();
    
    if (!sessionStatus.sessionActive || !sessionStatus.browserRunning) {
      console.error('[App] No active session or browser not ready');
      return;
    }
    
    // Store job application in job_swipes table
    const { error } = await supabase.from('job_swipes').upsert([
      {
        user_id: userId,
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        swipe_direction: 'right',
        swiped_at: new Date().toISOString(),
      },
    ], { onConflict: 'user_id,job_id' });
    
    if (error) {
      console.error('[App] Failed to apply to job:', error.message);
    } else {
      // Update auto-apply usage in database
      const { data: profile } = await supabase
        .from('profiles')
        .select('auto_applies_used_today, auto_apply_usage_date')
        .eq('id', userId)
        .single();
      
      const today = new Date().toISOString().slice(0, 10);
      const currentUsage = profile?.auto_applies_used_today || 0;
      const newUsage = currentUsage + 1;
      
      await supabase
        .from('profiles')
        .update({ 
          auto_applies_used_today: newUsage,
          auto_apply_usage_date: today
        })
        .eq('id', userId);
      
      // Update localStorage
      localStorage.setItem('aa_used', String(newUsage));
      
      // Navigate the existing browser to the job page and apply
      try {
        const response = await fetch(getBackendEndpoint('/api/apply-job'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId,
            jobId: job.id,
            jobUrl: job.url || `https://www.linkedin.com/jobs/view/${job.id}/`
          }),
        });
        
        if (response.ok) {
          console.log('[App] Job application started successfully');
        } else {
          console.error('[App] Failed to start job application:', response.statusText);
        }
      } catch (error) {
        console.error('[App] Error starting job application:', error);
      }
      
      const jobToAdd: Job = {
        ...job,
        status: (job.status || 'applied') as Job['status'],
        appliedDate: new Date(),
      };
      
      setAppliedJobs(prev => {
        // Check if job already exists with the same status to prevent duplicates
        const existingJob = prev.find(j => j.id === job.id && j.status === jobToAdd.status);
        if (existingJob) {
          return prev; // Return current state unchanged
        }
        
        return [
          jobToAdd,
          ...prev.filter(j => j.id !== job.id)
        ];
      });
      setSavedJobs(prev => prev.filter(j => j.id !== job.id)); // Remove from saved if present
      
      // Refresh applied jobs from database to ensure consistency
      setTimeout(async () => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (userId) {
          const refreshedAppliedJobs = await fetchSwipedJobs(userId, 'right');
          setAppliedJobs(refreshedAppliedJobs);
        }
      }, 1000); // Wait 1 second for database to be updated
    }
  }

  // Save a job (swipe_direction = 'saved')
  async function saveJob(job: Job) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;
    
    // Store job save in job_swipes table
    const { error } = await supabase.from('job_swipes').upsert([
      {
        user_id: userId,
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        swipe_direction: 'saved',
        swiped_at: new Date().toISOString(),
      },
    ], { onConflict: 'user_id,job_id' });
    
    if (error) {
      console.error('[App] Failed to save job:', error.message);
    } else {
      const jobToAdd: Job = {
        ...job,
        status: 'saved',
        appliedDate: new Date(),
      };
      
      setSavedJobs(prev => {
        // Check if job already exists to prevent duplicates
        const existingJob = prev.find(j => j.id === job.id);
        if (existingJob) {
          return prev; // Return current state unchanged
        }
        
        return [jobToAdd, ...prev];
      });
    }
  }

  // Update employer job stats
  const updateEmployerJobStats = async (jobId: string, statType: 'view' | 'application' | 'save') => {
    try {
      const { error } = await supabase
        .from('employer_job_stats')
        .upsert([
          {
            job_id: jobId,
            stat_type: statType,
            count: 1,
            updated_at: new Date().toISOString(),
          },
        ], { onConflict: 'job_id,stat_type' });
      
      if (error) {
        console.error('[App] Failed to update employer job stats:', error.message);
      }
    } catch (error) {
      console.error('[App] Error updating employer job stats:', error);
    }
  };

  const goTo = (target: typeof screen) => () => setScreen(target);

  const handleApplyJob = async (job: Job) => {
    console.log('[App] handleApplyJob called for job:', { id: job.id, title: job.title, company: job.company });
    
    // Check if session is active before applying
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (userId) {
      try {
        const sessionResponse = await fetch(getBackendEndpoint(`/api/session/status/${userId}`));
        const sessionStatus = await sessionResponse.json();
        
        if (!sessionStatus.sessionActive || !sessionStatus.browserRunning) {
          // Show a notification to the user
          alert('Please start a session first before applying to jobs. Click "Start Session" to begin.');
          return;
        }
      } catch (error) {
        console.error('[App] Error checking session status:', error);
        alert('Unable to check session status. Please try starting a session first.');
        return;
      }
    }
    
    // Use the proper applyJob function which handles auto-apply
    await applyJob(job);
    
    // Update badge progress
    updateBadgeProgress('job-hunter');
  };

  const handleSaveJob = async (job: Job) => {
    await saveJob(job);
  };

  const handleRejectJob = (job: Job) => {
    const newRejectedJob: Job = {
      ...job,
      id: Date.now().toString(),
      status: 'rejected',
      appliedDate: new Date()
    };
    
  };

  const handleRemoveSavedJob = (jobId: string) => {
    setSavedJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const handleUpdateJobStatus = (jobId: string, newStatus: 'Applied' | 'Rejected' | 'Response' | 'Saved') => {
    setAppliedJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: newStatus.toLowerCase() as Job['status'] }
        : job
    ));
  };

  const handleSaveUserAnswers = (answers: any[]) => {
    setUserAnswers(answers);
  };

  // Onboarding actions
  const handleUploadResume = () => {
    setOnboardingStep('resume');
  };

  const handleResumeFileChange = (file: File | null) => {
    setResumeFile(file);
  };

  const handleResumeContinue = () => {
    setOnboardingStep('review');
  };

  const handleResumeBack = () => {
    setOnboardingStep('welcome');
  };

  const handleResumeSkip = () => {
    setOnboardingStep('noResumeAnimation');
  };

  const handleNoResumeAnimationComplete = () => {
    setOnboardingStep('basicInfo');
  };

  const handleBasicInfoContinue = async (info: { name: string; location: string; radius: number }) => {
    setBasicInfo(info);
    setUserLocation(info.location);
    setUserRadius(info.radius);
    
    // Save basic info to profiles table
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (userId) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            name: info.name,
            location: info.location,
            radius: info.radius
          }, { onConflict: 'id' });
        
        if (error) {
          console.error('[handleBasicInfoContinue] Error saving basic info:', error);
        } else {
          console.log('[handleBasicInfoContinue] Basic info saved successfully');
        }
      } catch (error) {
        console.error('[handleBasicInfoContinue] Error saving data:', error);
      }
    }
    
    setOnboardingStep('experience');
  };

  const handleBasicInfoBack = () => {
    setShowOnboarding(false);
    setShowSignIn(true);
  };

  const handleGoToSignIn = () => {
    setShowOnboarding(false);
    setShowSignIn(true);
  };
  const handleGoToOnboarding = () => {
    setShowOnboarding(true);
    setShowSignIn(false);
    setShowSignUp(false);
  };

  const handleGoToSignUp = () => {
    setShowSignUp(true);
    setShowOnboarding(false);
    setShowSignIn(false);
  };

  const handleGoBackToSignIn = () => {
    setShowSignIn(true);
    setShowSignUp(false);
    setShowOnboarding(false);
    setShowVerifyEmail(false);
  };

  const handleEmailVerified = () => {
    setShowVerifyEmail(false);
    setShowOnboarding(true);
    setOnboardingStep('basicInfo'); // Start with basic info since user is now authenticated
  };

  // Sign-in actions
  const handleSignIn = async (emailOrPhone: string, password: string) => {
    setSignInError(null);
    setCheckingAuth(true); // Show loading screen
    
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.log('[handleSignIn] Timeout reached, forcing completion');
      setCheckingAuth(false);
      setSignInError('Sign-in timed out. Please try again.');
    }, 10000); // 10 second timeout
    
    let email: string | null = null;
    let phone: string | null = null;
    if (emailOrPhone.includes('@')) {
      email = emailOrPhone;
    } else {
      phone = emailOrPhone;
    }
    
    let result;
    if (email) {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else if (phone) {
      result = await supabase.auth.signInWithPassword({ phone, password });
    }
    
    if (result && result.error) {
      setSignInError(result.error.message);
      setCheckingAuth(false);
      return;
    }
    
    // Successful sign-in, now check if user is employer or regular user
    if (result?.data?.user) {
      // Check if user is an employer by contact_email
      const { data: employerData, error: employerError } = await supabase
        .from('employers')
        .select('id')
        .eq('contact_email', result.data.user.email)
        .single();
      
      if (employerData && !employerError) {
        setIsEmployer(true);
        setShowSignIn(false);
        setShowOnboarding(false);
      } else {
        setIsEmployer(false);
        
        // Check if user has incomplete onboarding - but only if they're not already signed in
        const onboardingStep = localStorage.getItem('onboarding_step');
        if (onboardingStep && onboardingStep !== 'home') {
          // Clear the incomplete onboarding step since user is now signed in
          localStorage.removeItem('onboarding_step');
        }
        
        setShowSignIn(false);
        setShowOnboarding(false);
        try {
          await fetchProfileAndJobs(); // Load profile for regular user
        } catch (error) {
          console.error('[handleSignIn] Error fetching profile:', error);
          // Even if profile fetch fails, we should still show the main app
        }
      }
    }
    
    clearTimeout(timeout);
    setCheckingAuth(false);
  };
  const handleForgotPassword = () => {
    // Add forgot password logic here
    alert("Forgot password clicked");
  };

  const handleGoogleSignUp = async () => {
    setSignUpError(null);
    setCheckingAuth(true);
    
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.log('[handleGoogleSignUp] Timeout reached, forcing completion');
      setCheckingAuth(false);
      setSignUpError('Google sign-up timed out. Please try again.');
    }, 10000); // 10 second timeout
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`
        }
      });
      
      if (error) {
        console.error('Google sign-up error:', error);
        setSignUpError(error.message);
        setCheckingAuth(false);
        return;
      }
      
      // The OAuth flow will redirect the user, so we don't need to handle the success case here
      console.log('Google OAuth initiated:', data);
      
    } catch (err) {
      console.error('Google sign-up exception:', err);
      setSignUpError('Failed to initiate Google sign-up. Please try again.');
      setCheckingAuth(false);
    }
    
    clearTimeout(timeout);
  };

  const handleSignUp = async (emailOrPhone: string, password: string) => {
    setSignUpError(null);
    setCheckingAuth(true);
    
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.log('[handleSignUp] Timeout reached, forcing completion');
      setCheckingAuth(false);
      setSignUpError('Sign-up timed out. Please try again.');
    }, 10000); // 10 second timeout
    
    let email: string | null = null;
    let phone: string | null = null;
    if (emailOrPhone.includes('@')) {
      email = emailOrPhone;
    } else {
      phone = emailOrPhone;
    }
    
    let result;
    if (email) {
      result = await supabase.auth.signUp({ email, password });
    } else if (phone) {
      result = await supabase.auth.signUp({ phone, password });
    }
    
    if (result && result.error) {
      setSignUpError(result.error.message);
      setCheckingAuth(false);
      return;
    }
    
    // Successful sign-up, show verification screen
    if (result?.data?.user) {
      setShowSignUp(false);
      setShowVerifyEmail(true);
      setVerificationEmail(emailOrPhone);
    }
    
    clearTimeout(timeout);
    setCheckingAuth(false);
  };

  const handleReviewContinue = () => {
    setOnboardingStep('tutorial');
  };

  const handleReviewBack = () => {
    setOnboardingStep('resume');
  };

  const handleUpdateResumeSection = (sectionIdx: number, fields: { label: string; value: string }[]) => {
    setParsedResume(prev => prev.map((section, i) => i === sectionIdx ? { ...section, fields } : section));
  };

  const handleTutorialContinue = () => {
    setShowOnboarding(false);
    setShowSignIn(false);
    
    // Always show paywall after tutorial for new users
    // This ensures users see the pricing options after completing onboarding
    if (currentUser) {
      setShowPaywall(true);
    }
  };

  // Payment handlers
  const handlePaywallComplete = () => {
    setShowPaywall(false);
    // Refresh user access after successful trial start
    if (currentUser) {
      paymentService.checkUserAccess(currentUser.id).then(setUserAccess);
    }
  };

  const handleUpgrade = (planId: string) => {
    setShowUpgradeModal(false);
    // Refresh user access after successful upgrade
    if (currentUser) {
      paymentService.checkUserAccess(currentUser.id).then(setUserAccess);
    }
  };

  const handleTrialExpiryUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handleExperienceContinue = async (info: { experience: Experience[]; education: Education[] }) => {
    setExperience(info.experience);
    setEducation(info.education);
    
    console.log('[handleExperienceContinue] Starting to save experience and education data');
    console.log('[handleExperienceContinue] Experience data:', info.experience);
    console.log('[handleExperienceContinue] Education data:', info.education);
    
    // Save experience and education to Supabase
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    console.log('[handleExperienceContinue] User ID:', userId);
    
    if (userId) {
      try {
        // Helper function to convert date strings to proper format
        const formatDate = (dateString: string) => {
          if (!dateString) return null;
          // If it's already in YYYY-MM-DD format, return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
          // Try to parse and format the date
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return null;
          return date.toISOString().split('T')[0];
        };
        
        // Save experience data
        if (info.experience.length > 0) {
          const experienceData = info.experience.map(exp => ({
            id: exp.id,
            profile_id: userId,
            job_title: exp.title,
            company: exp.company,
            location: exp.location,
            start_date: formatDate(exp.startDate),
            end_date: formatDate(exp.endDate),
            is_current: exp.current,
            description: exp.description
          }));
          
          console.log('[handleExperienceContinue] Experience data to save:', experienceData);
          
          const { error: expError } = await supabase
            .from('experience')
            .upsert(experienceData, { onConflict: 'id' });
          
          if (expError) {
            console.error('[handleExperienceContinue] Error saving experience:', expError);
          } else {
            console.log('[handleExperienceContinue] Experience saved successfully');
          }
        } else {
          console.log('[handleExperienceContinue] No experience data to save');
        }
        
        // Save education data
        if (info.education.length > 0) {
          const educationData = info.education.map(edu => ({
            id: edu.id,
            profile_id: userId,
            institution: edu.institution,
            degree: edu.degree,
            field: edu.field,
            start_date: formatDate(edu.startDate),
            end_date: formatDate(edu.endDate),
            gpa: edu.gpa,
            location: edu.location || null
          }));
          
          console.log('[handleExperienceContinue] Education data to save:', educationData);
          
          const { error: eduError } = await supabase
            .from('education')
            .upsert(educationData, { onConflict: 'id' });
          
          if (eduError) {
            console.error('[handleExperienceContinue] Error saving education:', eduError);
          } else {
            console.log('[handleExperienceContinue] Education saved successfully');
          }
        } else {
          console.log('[handleExperienceContinue] No education data to save');
        }
      } catch (error) {
        console.error('[handleExperienceContinue] Error saving data:', error);
      }
    }
    
    setOnboardingStep('interests');
  };

  const handleInterestsContinue = async (info: { skills: string[]; interests: string[] }) => {
    setInterests(info);
    
    // Save interests and skills to profiles table, and mark onboarding as complete
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (userId) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            skills: info.skills,
            interests: info.interests,
            onboarding_complete: true
          }, { onConflict: 'id' });
        
        if (error) {
          console.error('[handleInterestsContinue] Error saving interests:', error);
        } else {
          console.log('[handleInterestsContinue] Interests saved successfully and onboarding marked complete');
        }
      } catch (error) {
        console.error('[handleInterestsContinue] Error saving data:', error);
      }
    }
    
    setOnboardingStep('tutorial');
  };

  // Back handlers
  const handleExperienceBack = () => setOnboardingStep('basicInfo');
  const handleInterestsBack = () => setOnboardingStep('experience');

  // Extracted function to fetch profile and jobs
  async function fetchProfileAndJobs() {
    setProfileLoading(true);
    try {
      console.log('[fetchProfileAndJobs] Starting profile fetch');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.log('[fetchProfileAndJobs] No user found');
        setUserProfile(null);
        setProfileLoading(false);
        return;
      }
    const userId = userData.user.id;
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*, salary_min, salary_max, latitude, longitude, onboarding_complete')
      .eq('id', userId)
      .single();
    if (profileError || !data) {
      console.log('[fetchProfileAndJobs] Profile not found, creating default profile');
      // Create a default profile if none exists
      const defaultProfile = {
        id: userId,
        email: userData.user.email || '',
        name: userData.user.email?.split('@')[0] || 'User',
        location: 'New York, NY',
        phone: '',
        headline: '',
        education: [],
        experience: [],
        skills: [],
        interests: [],
        desired_job_title: 'Intern',
        salary_min: 0,
        salary_max: 0,
        latitude: 0,
        longitude: 0,
        onboarding_complete: false,
        statistics: {
          applied: 0,
          pending: 0,
          offers: 0,
        },
      };
      setUserProfile(defaultProfile);
      setProfileLoading(false);
      return;
    }
    // Fetch education and experience from their own tables
      const { data: education, error: eduError } = await supabase
      .from('education')
      .select('*')
      .eq('profile_id', userId);
      const { data: experience, error: expError } = await supabase
      .from('experience')
      .select('*')
      .eq('profile_id', userId);
    // Map DB fields to app types
    const mappedEducation = (education || []).map((e: any) => ({
      id: e.id,
      institution: e.institution,
      degree: e.degree,
      field: e.field,
      startDate: e.start_date,
      endDate: e.end_date,
      gpa: e.gpa,
      location: e.location,
    }));
    const mappedExperience = (experience || []).map((e: any) => ({
      id: e.id,
      title: e.job_title,
      company: e.company,
      location: e.location,
      startDate: e.start_date,
      endDate: e.end_date,
      current: !!e.is_current,
      description: e.description,
    }));
    const userProfileData = {
      ...data,
      education: mappedEducation,
      experience: mappedExperience,
      skills: data.skills || [],
      interests: data.interests || [],
      desired_job_title: data.desired_job_title || 'Intern',
      salary_min: data.salary_min ?? 0,
      salary_max: data.salary_max ?? 0,
      latitude: data.latitude ?? 0,
      longitude: data.longitude ?? 0,
    };
    console.log('[fetchProfileAndJobs] Setting user profile:', userProfileData);
    setUserProfile(userProfileData);
    setProfileLoading(false);
    } catch (err: any) {
      console.error('[fetchProfileAndJobs] Error:', err);
      setUserProfile(null);
      setProfileLoading(false);
    } finally {
      // Ensure profileLoading is always set to false
      setProfileLoading(false);
    }
  }

  const [isEmployer, setIsEmployer] = useState(false);



  useEffect(() => {
    const checkAuthAndCallbacks = async () => {
      // Check if we're returning from an OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Handle OAuth callback with tokens
        handleOAuthCallback(accessToken, refreshToken);
      } else {
        // Check for Supabase hosted auth callback
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // User is already authenticated via hosted auth
          handleHostedAuthCallback(session);
        } else {
          // Normal auth check
          checkAuth();
        }
      }
    };
    
    checkAuthAndCallbacks();
    
    // Listen for auth state changes (for hosted auth flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('[AuthStateChange] User signed in via hosted auth');
        handleHostedAuthCallback(session);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleHostedAuthCallback = async (session: any) => {
    setCheckingAuth(true);
    console.log('[handleHostedAuthCallback] Processing hosted auth callback');
    
    try {
      if (session.user) {
        console.log('[handleHostedAuthCallback] Hosted auth successful:', session.user.email);
        
        // Check if user is an employer
        try {
          const { data: employerData, error: employerError } = await supabase
            .from('employers')
            .select('id')
            .eq('contact_email', session.user.email)
            .single();
          
          if (employerData && !employerError) {
            console.log('[handleHostedAuthCallback] Employer found, setting isEmployer true');
            setIsEmployer(true);
            setCheckingAuth(false);
            return;
          }
        } catch (error) {
          console.log('[handleHostedAuthCallback] Error checking employers table, proceeding as regular user:', error);
        }
        
        // Set current user for payment checks
        setCurrentUser({
          id: session.user.id,
          email: session.user.email || ''
        });
        
        // For OAuth users, always show onboarding first
        // The profile will be created during the onboarding process
        console.log('[handleHostedAuthCallback] OAuth user, showing onboarding flow');
        setOnboardingStep('basicInfo'); // Start with basic info since user is authenticated
        setShowOnboarding(true);
        setShowSignIn(false);
        setCheckingAuth(false);
        
        // Force page refresh to ensure proper state
        window.location.reload();
        return;
        
        // Check user's payment access
        try {
          const access = await paymentService.checkUserAccess(session.user.id);
          setUserAccess(access);
          
          if (!access.hasAccess) {
            setShowPaywall(true);
          }
        } catch (error) {
          console.error('[handleHostedAuthCallback] Error checking payment access:', error);
        }
        
        await fetchProfileAndJobs();
        setShowOnboarding(false);
        setShowSignIn(false);
      }
    } catch (err) {
      console.error('[handleHostedAuthCallback] Exception:', err);
      setSignUpError('Failed to complete Google sign-in. Please try again.');
    }
    
    setCheckingAuth(false);
  };

  const handleOAuthCallback = async (accessToken: string, refreshToken: string) => {
    setCheckingAuth(true);
    console.log('[handleOAuthCallback] Processing OAuth callback');
    
    try {
      // Set the session with the tokens from the callback
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      if (error) {
        console.error('[handleOAuthCallback] Error setting session:', error);
        setSignUpError('Failed to complete Google sign-in. Please try again.');
        setCheckingAuth(false);
        return;
      }
      
      if (data.user) {
        console.log('[handleOAuthCallback] OAuth sign-in successful:', data.user.email);
        
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Check if user is an employer
        try {
          const { data: employerData, error: employerError } = await supabase
            .from('employers')
            .select('id')
            .eq('contact_email', data.user.email)
            .single();
          
          if (employerData && !employerError) {
            console.log('[handleOAuthCallback] Employer found, setting isEmployer true');
            setIsEmployer(true);
            setCheckingAuth(false);
            return;
          }
        } catch (error) {
          console.log('[handleOAuthCallback] Error checking employers table, proceeding as regular user:', error);
        }
        
        // Set current user for payment checks
        setCurrentUser({
          id: data.user.id,
          email: data.user.email || ''
        });
        
        // For OAuth users, always show onboarding first
        // The profile will be created during the onboarding process
        console.log('[handleOAuthCallback] OAuth user, showing onboarding flow');
        setOnboardingStep('basicInfo'); // Start with basic info since user is authenticated
        setShowOnboarding(true);
        setShowSignIn(false);
        setCheckingAuth(false);
        
        // Force page refresh to ensure proper state
        window.location.reload();
        return;
      }
    } catch (err) {
      console.error('[handleOAuthCallback] Exception:', err);
      setSignUpError('Failed to complete Google sign-in. Please try again.');
    }
    
    setCheckingAuth(false);
  };

  async function checkAuth() {
    setCheckingAuth(true);
    console.log('[checkAuth] Starting auth check');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('[checkAuth] userData:', userData, 'userError:', userError);
    if (userError || !userData.user) {
      console.log('[checkAuth] No user found, showing onboarding');
      setShowOnboarding(true);
      setShowSignIn(false);
      setProfileLoading(false); // Ensure spinner doesn't hang on failed auth
      setCheckingAuth(false);
      return;
    } else {
      // Check if user is an employer by contact_email
      console.log('[checkAuth] Checking employers table for contact_email:', userData.user.email);
      try {
        const { data: employerData, error: employerError } = await supabase
          .from('employers')
          .select('id')
          .eq('contact_email', userData.user.email)
          .single();
        console.log('[checkAuth] employerData:', employerData, 'employerError:', employerError);
        if (employerData && !employerError) {
          console.log('[checkAuth] Employer found, setting isEmployer true');
          setIsEmployer(true);
          setCheckingAuth(false);
          return;
        }
      } catch (error) {
        console.log('[checkAuth] Error checking employers table, proceeding as regular user:', error);
      }
      console.log('[checkAuth] Not an employer, proceeding to user flow');
      
      // Check if user has incomplete onboarding - but only for new users
      const onboardingStep = localStorage.getItem('onboarding_step');
      if (onboardingStep && onboardingStep !== 'home') {
        console.log('[checkAuth] Found incomplete onboarding step:', onboardingStep);
        // Clear the incomplete onboarding step since user is authenticated
        localStorage.removeItem('onboarding_step');
        console.log('[checkAuth] Cleared incomplete onboarding step');
      }
      
      // Check if user has completed onboarding
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', userData.user.id)
        .single();
      
      if (profileError || !profileData || !profileData.onboarding_complete) {
        console.log('[checkAuth] User has not completed onboarding, showing onboarding flow');
        setOnboardingStep('basicInfo'); // Start with basic info since user is authenticated
        setShowOnboarding(true);
        setShowSignIn(false);
        setCheckingAuth(false);
        return;
      }
      
      setShowOnboarding(false);
      setShowSignIn(false);
      
      // Set current user for payment checks
      setCurrentUser({
        id: userData.user.id,
        email: userData.user.email || ''
      });
      
      // Check user's payment access
      try {
        const access = await paymentService.checkUserAccess(userData.user.id);
        setUserAccess(access);
        
        // If user doesn't have access, show paywall after onboarding
        if (!access.hasAccess) {
          setShowPaywall(true);
        }
      } catch (error) {
        console.error('[checkAuth] Error checking payment access:', error);
        // Continue with app even if payment check fails
      }
      
      await fetchProfileAndJobs(); // Load profile after successful auth
    }
    setCheckingAuth(false);
    console.log('[checkAuth] Auth check complete');
  }







  async function fetchSwipedJobs(userId: string, direction: 'right' | 'saved') {
    try {
      // Get the job IDs that were swiped in the specified direction from job_swipes
      const { data: swipes, error: swipesError } = await supabase
        .from('job_swipes')
        .select('job_id, swipe_direction, swiped_at, application_processed, application_success, application_error, application_processed_at')
        .eq('user_id', userId)
        .eq('swipe_direction', direction)
        .order('swiped_at', { ascending: false });
      
      if (swipesError) {
        console.error(`[App] Failed to fetch ${direction} job swipes:`, swipesError.message);
        return [];
      }

      const allJobs: Job[] = [];

      // Process jobs from job_swipes
      if (swipes && swipes.length > 0) {
        // Get the actual job details from linkedin_fetched_jobs
        const jobIds = swipes.map(swipe => swipe.job_id);
        const { data: jobs, error: jobsError } = await supabase
          .from('linkedin_fetched_jobs')
          .select('*')
          .in('id', jobIds);

        if (jobsError) {
          console.error(`[App] Failed to fetch ${direction} job details:`, jobsError.message);
        } else {
          // Create a map of job details for quick lookup
          const jobMap = new Map();
          (jobs || []).forEach((job: any) => {
            jobMap.set(job.id, job);
          });

          // Map the jobs to the expected format with application status
          const mappedJobs = swipes.map((swipe: any) => {
            const job = jobMap.get(swipe.job_id);
            if (!job) return null;

            // Determine status based on application processing
            let status: 'applied' | 'saved' | 'applying' | 'error' = direction === 'right' ? 'applied' : 'saved';
            
            if (direction === 'right') {
              if (swipe.application_processed === false) {
                status = 'applying';
              } else if (swipe.application_processed === true) {
                if (swipe.application_success === true) {
                  status = 'applied';
                } else if (swipe.application_success === false) {
                  status = 'error';
                }
              }
            }

            return {
              id: job.id,
              title: job.job_title || 'Not available',
              company: job.company_name || 'Not available',
              salary: 'Not available',
              location: job.location || 'Not available',
              tags: ['Not available'],
              requirements: ['Not available'],
              benefits: ['Not available'],
              description: job.description || 'Not available',
              fitScore: 0,
              connections: [],
              lat: 0,
              lng: 0,
              status,
              appliedDate: swipe.swiped_at ? new Date(swipe.swiped_at) : new Date(),
              applicationError: swipe.application_error,
              applicationProcessedAt: swipe.application_processed_at ? new Date(swipe.application_processed_at) : null,
              source: 'LinkedIn',
            };
          }).filter((job) => job !== null) as Job[];

          allJobs.push(...mappedJobs);
        }
      }

      // Sort by most recent first
      return allJobs.sort((a, b) => b.appliedDate.getTime() - a.appliedDate.getTime());
    } catch (error) {
      console.error(`[App] Error in fetchSwipedJobs:`, error);
      return [];
    }
  }

  // Fetch applied and saved jobs after profile is loaded
  useEffect(() => {
    async function fetchForUser() {
      if (!userProfile) return;
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userId) {
        setAppliedJobs(await fetchSwipedJobs(userId, 'right'));
        setSavedJobs(await fetchSwipedJobs(userId, 'saved'));
      }
    }
    fetchForUser();
  }, []); // Temporarily removed userProfile dependency to stop infinite loop

  // Poll for status updates every 10 seconds if there are jobs being processed
  useEffect(() => {
    if (!userProfile) return;
    
    const hasProcessingJobs = appliedJobs.some(job => job.status === 'applying');
    if (!hasProcessingJobs) return;

    const interval = setInterval(async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userId) {
        setAppliedJobs(await fetchSwipedJobs(userId, 'right'));
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, []); // Temporarily removed dependencies to stop infinite loop

  // Fetch latest profile data when navigating to filters screen
  useEffect(() => {
    if (screen === 'filters' && userProfile) {
      // Fetch the latest profile data from Supabase to ensure we have the most recent location/radius changes
      const fetchLatestProfile = async () => {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: latestProfile, error } = await supabase
            .from('profiles')
            .select('*, salary_min, salary_max, latitude, longitude')
            .eq('id', userData.user.id)
            .single();
          
          if (!error && latestProfile) {
            // Update the userProfile with the latest data
            setUserProfile(prev => prev ? { ...prev, ...latestProfile } : null);
          }
        }
      };
      
      fetchLatestProfile();
    }
  }, [screen, userProfile]);

  // Refresh applied jobs when navigating to applied screen
  useEffect(() => {
    if (screen === 'applied' && userProfile) {
      const refreshAppliedJobs = async () => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (userId) {
          const refreshedAppliedJobs = await fetchSwipedJobs(userId, 'right');
          setAppliedJobs(refreshedAppliedJobs);
        }
      };
      
      refreshAppliedJobs();
    }
  }, [screen, userProfile]);

  // Handler to run after onboarding completes
  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    await fetchProfileAndJobs(); // Fetch latest profile (with interests) and jobs
  };

  // Remove a saved job (unsave)
  async function handleUnsaveJob(job: Job) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;
    
    // Delete from job_swipes table
    await supabase.from('job_swipes')
      .delete()
      .eq('user_id', userId)
      .eq('job_id', job.id);
    
    // Refetch saved jobs from Supabase
    setSavedJobs(await fetchSwipedJobs(userId, 'saved'));
  }

  // Session-based job loading - start with empty jobs
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Note: Jobs are no longer persisted to localStorage since they're session-based

  // Note: No auto-refresh needed since jobs are session-based

  // Note: Jobs are now only loaded when a session starts
  // No automatic job loading on app startup - purely session-driven





  if (isEmployer) {
    return <EmployerApp />;
  }

  // If user profile is loaded but we're still showing onboarding, fix it
  if (userProfile && showOnboarding && !checkingAuth && !profileLoading) {
    // User profile loaded but showing onboarding, will fix in useEffect
  }
  
  if (showOnboarding) {
    if (onboardingStep === 'welcome') {
      return (
        <OnboardingScreen
          onUploadResume={handleUploadResume}
          onSignIn={handleGoToSignIn}
          onSignUp={handleGoToSignUp}
          onShowTutorial={() => {
            setShowOnboarding(false);
          }}
          onComplete={handleOnboardingComplete}
        />
      );
    }
    if (onboardingStep === 'resume') {
      return (
        <ResumeUploadScreen
          onContinue={handleResumeContinue}
          onBack={handleResumeBack}
          resumeFile={resumeFile}
          onFileChange={handleResumeFileChange}
        />
      );
    }
    if (onboardingStep === 'basicInfo') {
      return (
        <BasicInfoScreen onContinue={handleBasicInfoContinue} onBack={handleBasicInfoBack} />
      );
    }
    if (onboardingStep === 'experience') {
      return (
        <ExperienceScreen
          onContinue={({ experience: exp, education: edu }) => {
            setExperience(exp);
            setEducation(edu);
            setOnboardingStep('interests');
          }}
          onBack={handleExperienceBack}
        />
      );
    }
    if (onboardingStep === 'interests') {
      return (
        <InterestsScreen onContinue={handleInterestsContinue} onBack={handleInterestsBack} />
      );
    }
    if (onboardingStep === 'tutorial') {
      return (
        <TutorialScreen onContinue={handleTutorialContinue} />
      );
    }
  }
  if (showSignIn) {
    return (
      <SignInScreen
        onSignIn={handleSignIn}
        onGoogle={handleGoogleSignUp}
        onForgotPassword={handleForgotPassword}
        onGoToOnboarding={handleGoToOnboarding}
        onGoToSignUp={handleGoToSignUp}
        error={signInError}
        loading={checkingAuth}
      />
    );
  }

  if (showSignUp) {
    return (
      <AccountCreationScreen
        onGoogle={handleGoogleSignUp}
        onLinkedIn={() => {
          // Handle LinkedIn sign-up
          console.log('LinkedIn sign-up clicked');
        }}
        onEmailOrPhone={handleSignUp}
        onBack={handleGoBackToSignIn}
        error={signUpError}
        loading={checkingAuth}
      />
    );
  }

  if (showVerifyEmail) {
    return (
      <VerifyEmailScreen
        email={verificationEmail}
        onVerified={handleEmailVerified}
        onResend={() => {
          // Handle resend logic if needed
          console.log('Resend verification email');
        }}
        onChangeEmail={(newEmail) => {
          setVerificationEmail(newEmail);
        }}
      />
    );
  }

  // Show loading spinner while checking auth or loading profile
  if (checkingAuth || profileLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#A100FF] mb-4"></div>
          <span className="text-xl font-bold text-[#A100FF]">
            {checkingAuth ? "Checking authentication..." : "Loading..."}
          </span>
          <span className="text-sm text-gray-500 mt-2">
            {checkingAuth ? "This may take a few seconds..." : "Loading your profile..."}
          </span>
        </div>
      </div>
    );
  }



  // Add UpgradeScreen rendering
  if (screen === "upgrade") {
    return (
      <UpgradeScreen
        goToHome={goTo("home")}
        goToSaved={goTo("saved")}
        goToApplied={goTo("applied")}
        goToProfile={goTo("profile")}
        goToNotifications={goTo("notifications")}
        goBack={goTo("home")}
      />
    );
  }

  return (
    <div className="phone-container">
      
      {screen === "home" && (
        <>
          <HomeScreen
            goToApplied={goTo("applied")}
            goToProfile={goTo("profile")}
            goToSaved={goTo("saved")}
            goToFilters={goTo("filters")}
            goToNotifications={goTo("notifications")}
            onApplyJob={async (job: Job) => {
              console.log('[App] onApplyJob called for job:', { id: job.id, title: job.title, company: job.company });
              
              // Get current user for session
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                console.error('[App] User not authenticated');
                return;
              }
              
              // Simple apply function that uses the proven test-simple-click.js logic
              try {
                const response = await fetch(getBackendEndpoint('/api/simple-apply'), {
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
                
                if (response.ok) {
                  console.log('[App] Simple apply request sent successfully');
                  // Update job status to show it's being applied
                  setAppliedJobs(prev => [...prev, { ...job, status: 'applying', appliedDate: new Date() }]);
                } else {
                  console.error('[App] Failed to send simple apply request:', response.statusText);
                }
              } catch (error) {
                console.error('[App] Error sending simple apply request:', error);
              }
            }}
            onAnswerQuestion={async (question: string, answer: string) => {
              console.log('[App] onAnswerQuestion called:', { question, answer });
              
              try {
                const response = await fetch(getBackendEndpoint('/api/answer-question'), {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ answer }),
                });
                
                if (response.ok) {
                  console.log('[App] Answer sent successfully');
                } else {
                  console.error('[App] Failed to send answer:', response.statusText);
                }
              } catch (error) {
                console.error('[App] Error sending answer:', error);
              }
            }}
            onSaveJob={async (job: Job) => handleSaveJob(job)}
            onRejectJob={async (job: Job) => handleRejectJob(job)}
            savedJobs={savedJobs}
            userAnswers={userAnswers}
            onSaveUserAnswers={handleSaveUserAnswers}
            updateBadgeProgress={updateBadgeProgress}
            userLocation={userLocation}
            userRadius={userRadius}
            jobs={jobs}
            jobsLoading={jobsLoading}
            appliedJobs={appliedJobs}
            rejectedJobs={appliedJobs.filter(j => j.status === 'rejected')}
            profileData={userProfile ? {
              location: userProfile?.location || '',
              radius: userProfile?.radius || 0,
              salary_min: (userProfile as any)?.salary_min ?? 0,
              salary_max: (userProfile as any)?.salary_max ?? 0,
              latitude: (userProfile as any)?.latitude ?? 0,
              longitude: (userProfile as any)?.longitude ?? 0,
            } : null}

          />
        </>
      )}
      {(screen === "saved" || screen === "applied") && (
        <TransitionGroup component={null}>
          <CSSTransition
            key={screen}
            timeout={500}
            classNames="fadein"
            nodeRef={screen === "saved" ? savedRef : appliedRef}
            unmountOnExit
          >
            <div ref={screen === "saved" ? savedRef : appliedRef}>
              {screen === "saved" && (
                <SavedScreen
                  goToHome={goTo("home")}
                  goToApplied={goTo("applied")}
                  goToProfile={goTo("profile")}
                  goToNotifications={goTo("notifications")}
                  goToFilters={goTo("filters")}
                  savedJobs={savedJobs}
                  onSaveJob={saveJob}
                  onApplyJob={applyJob}
                  onUnsaveJob={handleUnsaveJob}
                  userSkills={userProfile?.skills || interests?.skills || []}
                  userInterests={interests?.interests || []}
                />
              )}
              {screen === "applied" && (
                <AppliedScreen
                  goToHome={goTo("home")}
                  goToProfile={goTo("profile")}
                  goToSaved={goTo("saved")}
                  goToNotifications={goTo("notifications")}
                  goToFilters={goTo("filters")}
                  appliedJobs={appliedJobs}
                  onUpdateJobStatus={handleUpdateJobStatus}
                  userSkills={interests?.skills || []}
                  userInterests={interests?.interests || []}
                />
              )}
            </div>
          </CSSTransition>
        </TransitionGroup>
      )}
          {screen === "profile" && (
            <ProfileScreen
              profile={userProfile}
              setProfile={setUserProfile}
              loading={profileLoading}
              goToHome={goTo("home")}
              goToSaved={goTo("saved")}
              goToApplied={goTo("applied")}
              goToNotifications={goTo("notifications")}
              goToFilters={goTo("filters")}
              goToNotificationsPrivacy={goTo("notificationsPrivacy")}
              goToAccountSettings={goTo("accountSettings")}
              goToQuestions={() => {}}
              appliedJobs={appliedJobs}
            />
          )}
          {screen === "notifications" && (
            <AutoApplyScreen 
              goToHome={goTo("home")}
              goToSaved={goTo("saved")}
              goToApplied={goTo("applied")}
              goToProfile={goTo("profile")}
              goToFilters={goTo("filters")}
            />
          )}
          {screen === "filters" && (
            <FiltersScreen 
              goToHome={goTo("home")}
              goToProfile={goTo("profile")}
              goToSaved={goTo("saved")}
              goToApplied={goTo("applied")}
              goToNotifications={goTo("notifications")}
              userAnswers={userAnswers}
              rejectedJobs={appliedJobs.filter(j => j.status === 'rejected')}
              onApplyJob={(job) => applyJob({ ...job, id: '', status: 'applied', appliedDate: new Date() })}
              onSaveJob={(job) => saveJob({ ...job, id: '', status: 'saved', appliedDate: new Date() })}
              onRemoveRejectedJob={(jobId) => setAppliedJobs(prev => prev.filter(job => job.id !== jobId))}
              onSendFeedback={() => {}}
              badges={badges}
              profile={userProfile ? {
                interests: userProfile?.interests || [],
                location: userProfile?.location || '',
                radius: userProfile?.radius || 0,
                salary_min: (userProfile as any)?.salary_min ?? 0,
                salary_max: (userProfile as any)?.salary_max ?? 0,
                latitude: (userProfile as any)?.latitude ?? 0,
                longitude: (userProfile as any)?.longitude ?? 0,
              } : null}
              loading={profileLoading}
              refetchProfile={fetchProfileAndJobs}
            />
          )}
          {screen === "notificationsPrivacy" && (
            <NotificationsPrivacyScreen goBack={goTo("profile")} />
          )}
          {screen === "accountSettings" && (
            <AccountSettingsScreen 
              goBack={goTo("profile")}
            />
          )}

          {/* Badge Achievement Notification */}
          {currentAchievement && (
            <BadgeAchievementNotification
              achievement={currentAchievement}
              isVisible={true}
              onClose={closeAchievement}
              onViewBadges={() => viewBadges(goTo("filters"))}
            />
          )}

          {/* Network Status Modal */}
          <NetworkStatusModal 
            isOpen={showNetworkModal} 
            onClose={() => setShowNetworkModal(false)} 
          />

          {/* Payment Components */}
          {showPaywall && currentUser && (
            <PaywallScreen
              onComplete={handlePaywallComplete}
              onBack={() => setShowPaywall(false)}
              userId={currentUser.id}
              userEmail={currentUser.email}
            />
          )}

          {userAccess && userAccess.hasAccess && userAccess.type === 'trial' && userAccess.expiresAt && (
            <TrialExpiryBanner
              expiresAt={userAccess.expiresAt}
              onUpgrade={handleTrialExpiryUpgrade}
              onDismiss={() => setUserAccess(prev => prev ? { ...prev, dismissed: true } : null)}
              isVisible={true}
            />
          )}

          {currentUser && (
            <UpgradeModal
              isOpen={showUpgradeModal}
              onClose={() => setShowUpgradeModal(false)}
              onUpgrade={handleUpgrade}
              userId={currentUser.id}
              userEmail={currentUser.email}
              currentPlan={userAccess?.data?.plan_type}
            />
          )}
        </div>
      );
    }

export default App;
