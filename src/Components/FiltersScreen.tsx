import React, { useState, useEffect } from "react";
import InterestsSection from "./SmartFeedSections/InterestsSection";
import GuideSearchSection from "./SmartFeedSections/GuideSearchSection";
import QuestionsSection from "./SmartFeedSections/QuestionsSection";
import RejectedJobsSection from "./SmartFeedSections/RejectedJobsSection";
import { BadgesSection } from "./SmartFeedSections/Badges";
import FeedbackSection from "./SmartFeedSections/FeedbackSection";
import LocationSection from "./SmartFeedSections/LocationSection";
import SalaryRangeSection from "./SmartFeedSections/SalaryRangeSection";
import { Job } from "../types/Job";
import { supabase } from '../supabaseClient';

interface UserAnswer {
  jobTitle: string;
  companyName: string;
  questions: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

interface BadgeLevel {
  level: number;
  name: string;
  description: string;
  requirement: number;
  icon: string;
  color: string;
  unlocked: boolean;
  currentProgress?: number;
}

interface Badge {
  id: string;
  name: string;
  levels: BadgeLevel[];
  currentLevel: number;
  totalProgress: number;
}

interface SmartFeedProps {
  goToHome?: () => void;
  goToProfile?: () => void;
  goToSaved?: () => void;
  goToApplied?: () => void;
  goToNotifications?: () => void;
  userAnswers?: UserAnswer[];
  rejectedJobs?: Job[];
  onApplyJob?: (job: Omit<Job, 'id' | 'status' | 'appliedDate'>) => void;
  onSaveJob?: (job: Omit<Job, 'id' | 'status' | 'appliedDate'>) => void;
  onRemoveRejectedJob?: (jobId: string) => void;
  onSendFeedback?: (feedback: string) => void;
  badges?: Badge[];
  profile: ProfileData | null;
  loading: boolean;
  refetchProfile?: () => void;
}

// Define a type for the profile data
interface ProfileData {
  interests: string[];
  location: string;
  radius: number;
  salary_min: number;
  salary_max: number;
  latitude: number;
  longitude: number;
  desired_job_title?: string;
}

const SmartFeed: React.FC<SmartFeedProps> = ({
  goToHome,
  goToProfile,
  goToSaved,
  goToApplied,
  goToNotifications,
  userAnswers = [],
  rejectedJobs = [],
  onApplyJob,
  onSaveJob,
  onRemoveRejectedJob,
  onSendFeedback,
  badges,
  profile,
  loading,
  refetchProfile,
}) => {
  // Handler to update local interests after edit (no-op for now, or can call parent callback if needed)
  const handleInterestsUpdated = (_newInterests: string[]) => {};
  const handleLocationUpdated = (_newLocation: string, _newRadius: number, _newLat: number, _newLng: number) => {
    // LocationSection already saves to Supabase directly, no need to refetch
  };
  const [localProfile, setLocalProfile] = useState(profile);
  useEffect(() => { setLocalProfile(profile); }, [profile]);
  const handleSalaryUpdated = (salaryMin: number, salaryMax: number) => {
    setLocalProfile(prev => prev ? { ...prev, salary_min: salaryMin, salary_max: salaryMax } : prev);
    // SalaryRangeSection should save to Supabase directly, no need to refetch
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  }
  const dataToUse = localProfile;
  if (!dataToUse) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-between pt-40 pb-40 px-6">
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
          <button onClick={goToHome} className="text-white text-[30px]">
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
      {/* Main Content */}
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6 mt-0 mb-4 px-2 pb-32 main-content" style={{ minHeight: 'calc(100vh - 260px)' }}>
        <div className="mb-0 mt-0 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-0 text-center">Smart Feed</h1>
          <p className="text-base text-gray-600 text-center mt-0 mb-0">Help us refine your search</p>
        </div>
        {/* Interests Section */}
        <div className="w-full m-0 p-0 mt-0 mb-[-12px]" style={{ marginLeft: '-24px', marginRight: '-24px', width: 'calc(100% + 48px)' }}>
          <InterestsSection interests={dataToUse.interests} onInterestsUpdated={handleInterestsUpdated} />
        </div>
        {/* Location Section */}
        <div className="mt-[-8px] mb-6">
          <LocationSection location={dataToUse.location} radius={dataToUse.radius} latitude={dataToUse.latitude} longitude={dataToUse.longitude} onLocationUpdated={handleLocationUpdated} />
        </div>
        {/* Guide Search Section */}
        <GuideSearchSection 
          desiredJobTitle={dataToUse.desired_job_title} 
          onJobTitleUpdated={(jobTitle) => {
            setLocalProfile(prev => prev ? { ...prev, desired_job_title: jobTitle } : prev);
          }}
        />
        {/* Questions Section */}
        <QuestionsSection />
        {/* Salary Range Section */}
        <div className="mt-6">
          <SalaryRangeSection salaryMin={dataToUse.salary_min} salaryMax={dataToUse.salary_max} onSalaryUpdated={handleSalaryUpdated} />
        </div>
        {/* Badges Section */}
        <BadgesSection badges={badges || []} />
        {/* Feedback Section */}
        <FeedbackSection onSendFeedback={onSendFeedback} />
        {/* Optional: subtle loading indicator if loading and using cached data */}
        {loading && profile == null && (
          <div className="absolute left-0 right-0 top-0 flex justify-center items-center pointer-events-none">
            <div className="mt-4 text-xs text-gray-400 animate-pulse bg-white/80 rounded-full px-4 py-1 shadow">Refreshing...</div>
          </div>
        )}
      </div>
      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-t-[2rem] p-8 z-10 flex items-center justify-center">
        <div className="w-fit mx-auto bg-white rounded-3xl flex justify-center items-center gap-6 py-3 px-8 shadow-lg border-2 border-gray-400">
          <button onClick={goToSaved} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Saved</button>
          <button onClick={goToHome} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Discover</button>
          <button onClick={goToApplied} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Applied</button>
        </div>
      </div>
    </div>
  );
};

export default SmartFeed;
