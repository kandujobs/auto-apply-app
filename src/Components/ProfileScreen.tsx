import React, { useState, useEffect, useRef } from "react";
import EducationSection from "./ProfileSections/EducationSection";
import ExperienceSection from "./ProfileSections/ExperienceSection";
import SkillsSection from "./ProfileSections/SkillsSection";
import Notification from "./Notification";
import { UserProfile, Education, Experience } from "../types/Profile";
import { Job } from "../types/Job";
import { supabase } from '../supabaseClient';
import { uploadResume, getUserResumes, getLatestUserResume } from '../utils/resumeUpload';
import BasicInfoSection from "./ProfileSections/BasicInfoSection";
import RoadmapSection from "./ProfileSections/RoadmapSection";
import RejectedJobsSection from "./SmartFeedSections/RejectedJobsSection";
import ResumePreview from "./ResumePreview";
import { FaQuestionCircle } from 'react-icons/fa';

interface ProfileScreenProps {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  loading: boolean;
  goToHome: () => void;
  goToSaved?: () => void;
  goToApplied?: () => void;
  goToNotifications?: () => void;
  goToFilters?: () => void;
  goToNotificationsPrivacy?: () => void;
  goToAccountSettings?: () => void;
  goToQuestions: () => void;
  appliedJobs: Job[];
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  profile,
  setProfile,
  loading,
  goToHome, 
  goToSaved, 
  goToApplied,
  goToNotifications,
  goToFilters,
  goToNotificationsPrivacy,
  goToAccountSettings,
  goToQuestions,
  appliedJobs
}) => {
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(profile);
  const [showAllStats, setShowAllStats] = useState(false);
  const [showEditNotification, setShowEditNotification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'stats' | 'profile' | 'roadmap'>('profile');

  // Resume upload state
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Resume preview state
  const [showResumePreview, setShowResumePreview] = useState(false);
  
  // User resumes from storage
  const [userResumes, setUserResumes] = useState<any[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [currentResume, setCurrentResume] = useState<any>(null);

  useEffect(() => {
    setEditingProfile(profile);
  }, [profile]);

  // Load user resumes from storage when profile changes
  useEffect(() => {
    const loadUserResumes = async () => {
      if (!profile?.id) return;
      
      setLoadingResumes(true);
      try {
        const resumes = await getUserResumes(profile.id);
        setUserResumes(resumes);
        
        // Get the latest resume
        const latestResume = await getLatestUserResume(profile.id);
        setCurrentResume(latestResume);
      } catch (error) {
        console.error('Error loading user resumes:', error);
      } finally {
        setLoadingResumes(false);
      }
    };

    loadUserResumes();
  }, [profile?.id]);

  // Calculate statistics from applied jobs
  // State for all job swipes and job details
  const [allJobSwipes, setAllJobSwipes] = useState<any[]>([]);
  const [jobDetails, setJobDetails] = useState<any[]>([]);
  const [swipesLoading, setSwipesLoading] = useState(true);

  // Fetch all job swipes and job details from database
  useEffect(() => {
    const fetchAllJobSwipes = async () => {
      if (!profile) return;
      
      try {
        setSwipesLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        // Fetch all job swipes (left, right, saved)
        const { data: swipes, error } = await supabase
          .from('job_swipes')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('swiped_at', { ascending: false });

        if (error) {
          console.error('Error fetching job swipes:', error);
        } else {
          setAllJobSwipes(swipes || []);
          
          // Fetch job details for all swipes
          if (swipes && swipes.length > 0) {
            const jobIds = swipes.map(swipe => swipe.job_id).filter(id => id);
            if (jobIds.length > 0) {
              const { data: jobs, error: jobsError } = await supabase
                .from('linkedin_fetched_jobs')
                .select('*')
                .in('id', jobIds);

              if (jobsError) {
                console.error('Error fetching job details:', jobsError);
              } else {
                setJobDetails(jobs || []);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching job swipes:', error);
      } finally {
        setSwipesLoading(false);
      }
    };

    fetchAllJobSwipes();
  }, [profile]);

  const calculateStatistics = () => {
    // Calculate from all job swipes - add null check
    if (!allJobSwipes || !Array.isArray(allJobSwipes)) {
      return { left: 0, right: 0, saved: 0 };
    }
    const left = allJobSwipes.filter(swipe => swipe.swipe_direction === 'left').length;
    const right = allJobSwipes.filter(swipe => swipe.swipe_direction === 'right').length;
    const saved = allJobSwipes.filter(swipe => swipe.swipe_direction === 'saved').length;
    
    return { left, right, saved };
  };

  const statistics = calculateStatistics();

  // Calculate stats
  const totalSwipes = statistics.left + statistics.right + statistics.saved;
  const applicationRate = totalSwipes > 0 ? Math.round((statistics.right / totalSwipes) * 100) : 0;
  const rejectionRate = totalSwipes > 0 ? Math.round((statistics.left / totalSwipes) * 100) : 0;

  // Bar segment widths - ensure they add up to 100% and handle edge cases
  const appliedPct = totalSwipes > 0 ? Math.min((statistics.right / totalSwipes) * 100, 100) : 0;
  const rejectedPct = totalSwipes > 0 ? Math.min((statistics.left / totalSwipes) * 100, 100 - appliedPct) : 0;

  // Helper to get most common job title from swipes with job details
  function getMostCommonTitleFromSwipes(swipes: any[], direction: string) {
    if (!swipes || !Array.isArray(swipes) || !swipes.length) return "-";
    const directionSwipes = swipes.filter(swipe => swipe.swipe_direction === direction);
    if (!directionSwipes.length) return "-";
    
    const counts: Record<string, number> = {};
    directionSwipes.forEach(swipe => {
      // Try to get job title from job details first, then fallback to swipe data
      const jobDetail = jobDetails.find(job => job.id === swipe.job_id);
      const title = jobDetail?.job_title || swipe.job_title || 'Unknown';
      counts[title] = (counts[title] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }
  
  const mostCommonApplied = getMostCommonTitleFromSwipes(allJobSwipes, 'right');
  const mostCommonRejected = getMostCommonTitleFromSwipes(allJobSwipes, 'left');

  // Add placeholder resume fields for demo (remove when real backend is ready)
  // const profileWithResume = profile ? {
  //   ...profile,
  //   resumeUrl: (profile as any).resumeUrl || null, // Replace with real logic
  //   resumeFileName: (profile as any).resumeFileName || null, // Replace with real logic
  // } : null;

  // Skip loading state like other screens - render with available data
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center text-xl">No profile data available</div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500 text-xl">{error}</div>;
  }

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEditingProfile(prev => prev ? ({
      ...prev,
      education: (prev.education || []).map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }) : null);
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setEditingProfile(prev => prev ? ({
      ...prev,
      experience: (prev.experience || []).map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }) : null);
  };

  // Save handlers
  const handleSaveEducation = async (updatedEducation: Education[]) => {
    if (!profile) return;
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await supabase
        .from('education')
        .delete()
        .eq('profile_id', userData.user.id);
      // Map and filter fields to match DB schema
      const EDUCATION_COLUMNS = [
        'id', 'profile_id', 'institution', 'degree', 'field', 'start_date', 'end_date', 'gpa'
      ];
      function toDateYYYYMMDD(str: string | undefined) {
        if (!str) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
        if (/^\d{4}-\d{2}$/.test(str)) return str + '-01';
        const monthYear = str.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i);
        if (monthYear) {
          const month = [
            'January','February','March','April','May','June','July','August','September','October','November','December'
          ].indexOf(monthYear[1]) + 1;
          return `${monthYear[2]}-${String(month).padStart(2, '0')}-01`;
        }
        const year = str.match(/^(\d{4})$/);
        if (year) return `${year[1]}-01-01`;
        return null;
      }
      const educationRows = updatedEducation.map((e) => {
        const row: any = { profile_id: userData.user.id };
        row.id = e.id;
        row.institution = e.institution;
        row.degree = e.degree;
        row.field = e.field;
        row.start_date = toDateYYYYMMDD(e.startDate);
        row.end_date = toDateYYYYMMDD(e.endDate);
        row.gpa = e.gpa;
        // Only include allowed columns
        return Object.fromEntries(
          Object.entries(row).filter(([k, v]) => EDUCATION_COLUMNS.includes(k) && v !== undefined)
        );
      });
      if (educationRows.length > 0) {
        await supabase
          .from('education')
          .upsert(educationRows, { onConflict: 'id' });
      }
      setProfile({ ...profile, education: updatedEducation });
      setEditingProfile({ ...profile, education: updatedEducation });
      setShowEditNotification(true);
    }
  };

  const handleSaveExperience = async (updatedExperience: Experience[]) => {
    if (!profile) return;
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await supabase
        .from('experience')
        .delete()
        .eq('profile_id', userData.user.id);
      // Map and filter fields to match DB schema
      const EXPERIENCE_COLUMNS = [
        'id', 'profile_id', 'job_title', 'company', 'location', 'start_date', 'end_date', 'is_current', 'description'
      ];
      function toDateYYYYMMDD(str: string | undefined) {
        if (!str) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
        if (/^\d{4}-\d{2}$/.test(str)) return str + '-01';
        const monthYear = str.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i);
        if (monthYear) {
          const month = [
            'January','February','March','April','May','June','July','August','September','October','November','December'
          ].indexOf(monthYear[1]) + 1;
          return `${monthYear[2]}-${String(month).padStart(2, '0')}-01`;
        }
        const year = str.match(/^(\d{4})$/);
        if (year) return `${year[1]}-01-01`;
        return null;
      }
      const experienceRows = updatedExperience.map((e) => {
        const row: any = { profile_id: userData.user.id };
        row.id = e.id;
        row.job_title = e.title;
        row.company = e.company;
        row.location = e.location;
        row.start_date = toDateYYYYMMDD(e.startDate);
        row.end_date = toDateYYYYMMDD(e.endDate);
        row.is_current = !!e.current;
        row.description = e.description;
        // Only include allowed columns
        return Object.fromEntries(
          Object.entries(row).filter(([k, v]) => EXPERIENCE_COLUMNS.includes(k) && v !== undefined)
        );
      });
      if (experienceRows.length > 0) {
        await supabase
          .from('experience')
          .upsert(experienceRows, { onConflict: 'id' });
      }
      setProfile({ ...profile, experience: updatedExperience });
      setEditingProfile({ ...profile, experience: updatedExperience });
      setShowEditNotification(true);
    }
  };

  const handleSaveSkills = async (updatedSkills: string[]) => {
    if (!profile) return;
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await supabase
        .from('profiles')
        .update({ skills: updatedSkills })
        .eq('id', userData.user.id);
      setProfile({ ...profile, skills: updatedSkills });
      setEditingProfile({ ...profile, skills: updatedSkills });
      setShowEditNotification(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; // Redirect to home or sign-in
  };

  // Resume upload handler
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    
    setUploadingResume(true);
    setResumeError(null);
    
    try {
      const result = await uploadResume(file, profile.id);
      
      if (result.success) {
        // Update local profile state
        setProfile({ 
          ...(profile as any), 
          resume_url: result.publicUrl,
          resume_filename: result.filename,
          resume_file_size: result.fileSize,
          resume_file_type: result.fileType,
          resume_uploaded_at: new Date().toISOString()
        });
        
        // Reload user resumes from storage
        const resumes = await getUserResumes(profile.id);
        setUserResumes(resumes);
        
        const latestResume = await getLatestUserResume(profile.id);
        setCurrentResume(latestResume);
        
        setResumeError('Resume uploaded successfully!');
      } else {
        setResumeError(result.error || 'Failed to upload resume.');
      }
    } catch (err: any) {
      setResumeError(err.message || 'Failed to upload resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  return (
    <>
    <div className="bg-gray-100 pt-40 pb-40 px-4 h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Top Nav */}
      <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] p-4 rounded-b-[2rem] z-10 flex items-center justify-center">
        <div className="mt-6 bg-white/100 rounded-3xl flex justify-center items-center px-8 py-2 gap-8 w-fit border-2 border-gray-400">
          <button onClick={goToNotifications} className="text-white text-[30px]">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="35" height="35">
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M4.51555 7C3.55827 8.4301 3 10.1499 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3V6M12 12L8 8" stroke="#878787" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
              </g>
            </svg>
          </button>
          <button onClick={goToHome} className="text-white text-[30px]">
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

      {/* Profile Content */}
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gappx-2">
        {/* Header */}
        <div className="w-full flex flex-col items-center justify-center mb-4">
          <h1 className="text-[25px] font-bold text-center">Welcome, {profile.name}</h1>
        </div>

        {/* Switch Toggle */}
        <div className="w-full flex justify-center mb-4">
          <div className="flex bg-gray-200 rounded-full p-1 gap-1 w-fit">
            <button
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${viewMode === 'stats' ? 'bg-[#6C2BD7] text-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}
              onClick={() => setViewMode('stats')}
              type="button"
            >
              Stats
            </button>
            <button
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${viewMode === 'profile' ? 'bg-[#6C2BD7] text-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}
              onClick={() => setViewMode('profile')}
              type="button"
            >
              Profile
            </button>
            <button
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${viewMode === 'roadmap' ? 'bg-[#6C2BD7] text-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}
              onClick={() => setViewMode('roadmap')}
              type="button"
            >
              Career
            </button>
          </div>
        </div>
        {/* Unified sections group */}
        <div className="w-full flex flex-col gap-2">
        {/* Stats Tab: Expanded stats card only */}
        {viewMode === 'stats' && (
          <>
            <div className="w-full max-w-sm mx-auto bg-[#F8F8F8] rounded-[2rem] border-4 border-gray-300 pt-5 pb-0 px-6 flex flex-col items-center shadow-lg mb-8">
              {/* Expanded stats card (dropdown always open) */}
              <div className="w-full flex justify-around">
                {[{ label: "Applied", value: statistics.right }, { label: "Total", value: totalSwipes }, { label: "Rejected", value: statistics.left }].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-px">
                    <div className="text-2xl font-bold text-[#222]">{item.value}</div>
                    <div className="text-lg font-normal text-[#444]">{item.label}</div>
                  </div>
                ))}
              </div>
              {/* Expanded content always visible (no dropdown arrow) */}
              <div className="w-full flex flex-col items-center gap-6">
                <div className="w-full flex flex-col items-center">
                  {/* Progress bar */}
                  <div className="w-full h-5 rounded-full overflow-hidden bg-gray-200">
                    <div className="flex h-full">
                      <div className="bg-[#6C2BD7] h-full rounded-l-full" style={{ width: `${appliedPct}%` }}></div>
                      <div className="bg-[#3B82F6] h-full rounded-r-full" style={{ width: `${rejectedPct}%` }}></div>
                    </div>
                  </div>
                  {/* Stats row: Application Rate | Rejection Rate */}
                  <div className="w-full flex justify-between items-center mt-4 mb-2 gap-2">
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-xs text-gray-500 font-semibold mb-1">Application Rate</span>
                      <span className="text-[#6C2BD7] text-lg font-bold">{applicationRate}%</span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-xs text-gray-500 font-semibold mb-1">Rejection Rate</span>
                      <span className="text-[#3B82F6] text-lg font-bold">{rejectionRate}%</span>
                    </div>
                  </div>
                </div>
                <div className="w-full flex flex-col items-center mt-2 mb-8">
                  <div className="text-center text-sm font-semibold text-gray-700 mb-2">Most common job title...</div>
                  <div className="flex w-full justify-center text-center gap-8">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">Applied to</div>
                      <div className="font-bold text-[#6C2BD7] truncate max-w-[140px] mx-auto">{mostCommonApplied}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">Rejected</div>
                      <div className="font-bold text-[#3B82F6] truncate max-w-[140px] mx-auto">{mostCommonRejected}</div>
                    </div>
                  </div>
                </div>
                {/* Last Jobs You've Rejected section */}
                <div className="w-full mt-2">
                  <div className="text-lg font-bold text-[#5C1EE2] mb-2 text-left">The Last Jobs You've Rejected</div>
                  {(!allJobSwipes || !Array.isArray(allJobSwipes) || allJobSwipes.filter(swipe => swipe.swipe_direction === 'left').length === 0) ? (
                    <div className="w-full flex flex-col items-center justify-center py-8">
                      <div className="text-gray-500 text-base font-semibold mb-2 text-center">
                        No Rejected Jobs Yet
                      </div>
                      <div className="text-gray-400 text-sm text-center">
                        Start swiping to see your rejected jobs here. Swipe left to reject jobs.
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto scrollbar-hide py-2 smartfeed-scroll" style={{ touchAction: 'pan-x', minHeight: '140px', overflowY: 'hidden' }}>
                      <div className="flex flex-row gap-x-4 whitespace-nowrap pl-2" style={{ minWidth: 'max-content', paddingBottom: '16px' }}>
                        {(allJobSwipes || []).filter(swipe => swipe.swipe_direction === 'left').slice(0, 8).map((swipe) => {
                          const jobDetail = jobDetails.find(job => job.id === swipe.job_id);
                          return (
                            <div
                              key={swipe.id}
                              className="w-full max-w-xs bg-white rounded-2xl shadow-lg border-4 border-gray-300 p-4 flex flex-col"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h1 className="text-lg font-bold text-gray-900">
                                    {jobDetail?.job_title || swipe.job_title || 'Unknown'}
                                  </h1>
                                  <p className="text-sm text-gray-500">
                                    {jobDetail?.company_name || swipe.company || 'Unknown'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex justify-between items-end">
                                <div>
                                  <p className="text-purple-400 font-semibold text-base">
                                    {jobDetail?.salary || 'Not available'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {jobDetail?.location || 'Not available'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {/* More stats coming soon message */}
                <div className="w-full text-center text-xs text-gray-400 mb-4 mt-2">More stats coming soon...</div>
              </div>
            </div>
          </>
        )}
        {/* Profile Tab: Simple stats row, then all profile sections except roadmap and stats card */}
        {viewMode === 'profile' && (
          <>
            {/* All profile sections except roadmap and stats card */}
            <div className="w-full max-w-sm mx-auto">
              <EducationSection 
                education={profile.education}
                editingEducation={editingProfile?.education || profile.education}
                onUpdate={updateEducation}
                onSave={handleSaveEducation}
              />
            </div>
            <div className="w-full mx-auto">
              <SkillsSection 
                skills={profile.skills}
                editingSkills={editingProfile?.skills || profile.skills}
                onSave={handleSaveSkills}
              />
            </div>
            <div className="w-full max-w-sm mx-auto">
              <ExperienceSection 
                experience={profile.experience}
                editingExperience={editingProfile?.experience || profile.experience}
                onUpdate={updateExperience}
                onSave={handleSaveExperience}
              />
            </div>
            <div className="w-full bg-[#F8F8F8] rounded-[2rem] border-4 border-gray-300 pt-5 pb-4 px-6 flex flex-col shadow-lg mb-6 max-w-sm mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" stroke="#984DE0" strokeWidth="2"/><path d="M8 7h8M8 11h8M8 15h4" stroke="#984DE0" strokeWidth="2" strokeLinecap="round"/></svg>
                <h2 className="text-[20px] font-bold text-black">Resume</h2>
              </div>
              
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleResumeUpload}
                disabled={uploadingResume}
              />
              
              {/* Resume Preview */}
              {loadingResumes ? (
                <div className="mb-4">
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <span className="ml-3 text-gray-600">Loading resumes...</span>
                    </div>
                  </div>
                </div>
              ) : currentResume ? (
                <div className="mb-4">
                  {/* Resume Preview Card */}
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-purple-100 rounded-lg p-2">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#984DE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="14,2 14,8 20,8" stroke="#984DE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="16" y1="13" x2="8" y2="13" stroke="#984DE0" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="16" y1="17" x2="8" y2="17" stroke="#984DE0" strokeWidth="2" strokeLinecap="round"/>
                          <polyline points="10,9 9,9 8,9" stroke="#984DE0" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {currentResume.name || 'Resume'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {currentResume.size ? `${(currentResume.size / 1024 / 1024).toFixed(1)} MB` : ''}
                          {currentResume.created_at && ` • Uploaded ${new Date(currentResume.created_at).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    
                    {/* Resume Preview */}
                    <div className="mt-3 mb-3">
                      <div 
                        className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center relative overflow-hidden"
                        onClick={() => setShowResumePreview(true)}
                      >
                        <iframe
                          src={`${currentResume.public_url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                          className="w-full h-full border-0 pointer-events-none"
                          title="Resume Preview"
                          onError={(e) => {
                            // If iframe fails, show fallback
                            const target = e.target as HTMLIFrameElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="flex flex-col items-center justify-center text-center p-4">
                                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32" class="text-gray-400 mb-2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <p class="text-sm text-gray-500 font-medium">Click to preview resume</p>
                                  <p class="text-xs text-gray-400 mt-1">${currentResume.name || 'Resume file'}</p>
                                </div>
                              `;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                          <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="text-purple-600">
                              <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preview Actions */}
                    <div className="flex gap-2">
                      <a
                        href={currentResume.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200 text-center"
                      >
                        View Resume
                      </a>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingResume}
                        className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        {uploadingResume ? 'Uploading...' : 'Change'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Upload Button when no resume exists */
                <button
                  className="w-full bg-purple-50 text-[#984DE0] px-4 py-3 rounded-xl font-semibold text-base shadow-sm hover:bg-purple-100 transition-colors border border-[#ecd7fa]"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingResume}
                >
                  {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                </button>
              )}
              
              {/* Error message */}
              {resumeError && <div className={resumeError === 'Upload successful!' ? 'text-green-600 mt-2' : 'text-red-500 mt-2'}>{resumeError}</div>}
            </div>
            <div className="w-full bg-[#F8F8F8] rounded-[2rem] border-4 border-gray-300 pt-5 pb-4 px-6 flex flex-col shadow-lg mb-6 max-w-sm mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="26" height="26">
                  <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" stroke="#984DE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.4 15c-.2.4-.1.9.1 1.3l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1c-.4-.2-.9-.3-1.3-.1-.4.2-.7.5-.8.9v.2a2 2 0 0 1-4 0v-.2c-.1-.4-.4-.7-.8-.9-.4-.2-.9-.1-1.3.1l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1c.2-.4.3-.9.1-1.3-.2-.4-.5-.7-.9-.8h-.2a2 2 0 0 1 0-4h.2c.4-.1.7-.4.9-.8.2-.4.1-.9-.1-1.3l-.1-.1a2 2 0 0 1 2.8 2.8l.1.1c.4.2.9.3 1.3.1.4-.2.7-.5.8-.9V3a2 2 0 0 1 4 0v.2c.1.4.4.7.8.9.4.2.9.1 1.3-.1l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1c-.2.4-.3.9-.1 1.3.2.4.5.7.9.8h.2a2 2 0 0 1 0 4h-.2c-.4.1-.7.4-.9.8Z" stroke="#984DE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2 className="text-[20px] font-bold text-black">Settings</h2>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={goToNotificationsPrivacy}
                  className="w-full bg-purple-50 text-[#984DE0] px-4 py-3 rounded-xl font-semibold text-base shadow-sm hover:bg-purple-100 transition-colors border border-[#ecd7fa]"
                >
                  Notifications & Privacy Preferences
                </button>
                <button
                  onClick={goToAccountSettings}
                  className="w-full bg-gray-50 text-gray-700 px-4 py-3 rounded-xl font-semibold text-base shadow-sm hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  Account Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-50 text-red-600 px-4 py-3 rounded-xl font-semibold text-base shadow-sm hover:bg-red-100 transition-colors border border-red-100"
                >
                  Log Out
                </button>
              </div>
            </div>
          </>
        )}
        {/* Roadmap Tab: Roadmap only */}
        {viewMode === 'roadmap' && (
          <div className="w-full max-w-sm mx-auto">
            <RoadmapSection profile={profile} />
          </div>
        )}

          {/* Resume Section */}
          {/* This section is now handled within the 'profile' viewMode */}

        {/* Settings Section */}
          {/* This section is now handled within the 'profile' viewMode */}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-t-[2rem] p-8 z-10 flex items-center justify-center">
        <div className="w-fit mx-auto bg-white rounded-3xl flex justify-center items-center gap-6 py-3 px-8 shadow-lg border-2 border-gray-400">
          <button onClick={goToSaved} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Saved</button>
          <button onClick={goToHome} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Discover</button>
          <button onClick={goToApplied} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Applied</button>
        </div>
      </div>

      {/* Edit Success Notification */}
      <Notification
        message="Profile updated successfully!"
        isVisible={showEditNotification}
        onClose={() => setShowEditNotification(false)}
        duration={2000}
      />

      {/* Resume Preview Modal */}
      {currentResume && (
        <ResumePreview
          resumeUrl={currentResume.public_url}
          filename={currentResume.name}
          onClose={() => setShowResumePreview(false)}
          isVisible={showResumePreview}
        />
      )}
    </div>
    {/* Add missing closing tag for main wrapper */}
    </div>
    </>
  );
};

export default ProfileScreen;
