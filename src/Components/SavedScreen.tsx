import React, { useState, useMemo } from 'react';
import { Job } from '../types/Job';
import { supabase } from '../supabaseClient';
import Notification from "./Notification";
import { STANDARD_TAGS } from '../data/tags';

interface SavedScreenProps {
  goToHome: () => void;
  goToApplied?: () => void;
  goToProfile?: () => void;
  goToNotifications?: () => void;
  goToFilters?: () => void;
  savedJobs: Job[];
  onApplyJob: (job: Job) => void;
  onSaveJob: (job: Job) => void;
  onUnsaveJob: (job: Job) => void;
  userSkills?: string[];
  userInterests?: string[];
}

function extractLocationTag(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('remote') || t.includes('work from home')) return 'Remote';
  if (t.includes('hybrid')) return 'Hybrid';
  if (t.includes('on-site') || t.includes('onsite') || t.includes('in-person')) return 'On-site';
  return 'On-site'; // Default
}

function extractTags(job: Job): string[] {
  const tags = new Set<string>();
  const text = [job.title, job.description, ...(job.requirements || [])]
    .filter(Boolean)
    .map(x => typeof x === 'string' ? x : String(x))
    .join(' ')
    .toLowerCase();
  // Location tag
  tags.add(extractLocationTag(text));
  // Standard tags
  for (const tag of STANDARD_TAGS) {
    if (text.includes(tag.toLowerCase())) {
      tags.add(tag);
    }
  }
  return Array.from(tags);
}

const truncateToOneSentence = (text: string): string => {
  if (!text) return '';
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.slice(0, 1).join('. ') + (sentences.length > 1 ? '...' : '');
};

const SavedScreen: React.FC<SavedScreenProps> = ({ 
  goToHome, 
  goToApplied, 
  goToProfile, 
  goToNotifications, 
  goToFilters,
  savedJobs,
  onApplyJob,
  onSaveJob,
  onUnsaveJob,
  userSkills = [],
  userInterests = [],
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'apply' | 'unsave' | null>(null);
  const [jobToActOn, setJobToActOn] = useState<Job | null>(null);
  const [showUnsaveNotification, setShowUnsaveNotification] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Filter saved jobs based on selected filters
  const filteredJobs = useMemo(() => {
    return savedJobs.filter(job => {
      const statusMatch = statusFilter === 'all' || job.status === statusFilter;
      
      // Date filtering
      let dateMatch = true;
      if (dateFilter !== 'all' && job.appliedDate) {
        const jobDate = new Date(job.appliedDate);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);
        
        switch (dateFilter) {
          case 'today':
            dateMatch = jobDate.toDateString() === today.toDateString();
            break;
          case 'yesterday':
            dateMatch = jobDate.toDateString() === yesterday.toDateString();
            break;
          case 'thisWeek':
            dateMatch = jobDate >= thisWeek;
            break;
          case 'thisMonth':
            dateMatch = jobDate.getMonth() === today.getMonth() && jobDate.getFullYear() === today.getFullYear();
            break;
        }
      }
      
      return statusMatch && dateMatch;
    });
  }, [savedJobs, statusFilter, dateFilter]);

  // Get unique statuses for filter options
  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(savedJobs.map(job => job.status).filter(Boolean))];
    return ['all', ...statuses];
  }, [savedJobs]);

  // Date filter options
  const dateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' }
  ];

  const handleApplyClick = (job: Job) => {
    setJobToActOn(job);
    setConfirmAction('apply');
    setShowConfirmModal(true);
  };

  const handleBookmarkClick = async (job: Job) => {
    await onUnsaveJob(job);
    setShowUnsaveNotification(true);
    setTimeout(() => {
      setShowUnsaveNotification(false);
    }, 2000);
  };

  const handleConfirm = async () => {
    if (!jobToActOn) return;
    if (confirmAction === 'apply') {
      // Mark as applied in Supabase
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        // Update in job_swipes table
        await supabase.from('job_swipes').upsert([
          {
            user_id: userData.user.id,
            job_id: jobToActOn.id,
            swipe_direction: 'right',
            swiped_at: new Date().toISOString(),
          },
        ], { onConflict: 'user_id,job_id' });
      }
      onApplyJob(jobToActOn);
    } else if (confirmAction === 'unsave') {
      // Remove from saved in Supabase
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        // Delete from job_swipes table
        await supabase.from('job_swipes')
          .delete()
          .eq('user_id', userData.user.id)
          .eq('job_id', jobToActOn.id);
      }
      onSaveJob(jobToActOn); // Remove from local saved jobs
    }
    setShowConfirmModal(false);
    setJobToActOn(null);
    setConfirmAction(null);
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setJobToActOn(null);
    setConfirmAction(null);
  };

  // Defensive toLowerCase utility
  const safeToLower = (val: any) => typeof val === 'string' ? val.toLowerCase() : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      
      {/* Header */}
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

      {/* Main Content with proper spacing */}
      <div className="pt-32 pb-32">
        <div className="max-w-md mx-auto overflow-y-auto px-4" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          <div className="mb-2 mt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
          <h1 className="text-2xl font-bold">Saved Jobs</h1>
                <p className="text-sm text-gray-600">Your favorite opportunities</p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                  <path d="M10.5026 5.01692L9.96661 3.65785C9.62068 2.78072 8.37933 2.78072 8.03339 3.65784L6.96137 6.37599C6.85576 6.64378 6.64378 6.85575 6.37599 6.96137L3.65785 8.03339C2.78072 8.37932 2.78072 9.62067 3.65784 9.96661L6.37599 11.0386C6.64378 11.1442 6.85575 11.3562 6.96137 11.624L8.03339 14.3422C8.37932 15.2193 9.62067 15.2193 9.96661 14.3422L11.0386 11.624C11.1442 11.3562 11.3562 11.1442 11.624 11.0386L14.3422 9.96661C15.2193 9.62068 15.2193 8.37933 14.3422 8.03339L12.9831 7.49738" stroke="currentColor" strokeWidth="1.92" strokeLinecap="round"></path>
                  <path d="M16.4885 13.3481C16.6715 12.884 17.3285 12.884 17.5115 13.3481L18.3121 15.3781C18.368 15.5198 18.4802 15.632 18.6219 15.6879L20.6519 16.4885C21.116 16.6715 21.116 17.3285 20.6519 17.5115L18.6219 18.3121C18.4802 18.368 18.368 18.4802 18.3121 18.6219L17.5115 20.6519C17.3285 21.116 16.6715 21.116 16.4885 20.6519L15.6879 18.6219C15.632 18.4802 15.5198 18.368 15.3781 18.3121L13.3481 17.5115C12.884 17.3285 12.884 16.6715 13.3481 16.4885L15.3781 15.6879C15.5198 15.632 15.632 15.5198 15.6879 15.3781L16.4885 13.3481Z" stroke="currentColor" strokeWidth="1.92"></path>
                </svg>
                Filter
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg border-2 border-gray-200">
                <div className="space-y-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueStatuses.map(status => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status || 'all')}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            statusFilter === status
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {status === 'all' ? 'All' : (status || 'Unknown').charAt(0).toUpperCase() + (status || 'Unknown').slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date Saved</label>
                    <div className="flex flex-wrap gap-2">
                      {dateFilterOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setDateFilter(option.value)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            dateFilter === option.value
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setDateFilter('all');
                      }}
                      className="text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="text-sm text-gray-500 mb-4">
              Showing {filteredJobs.length} of {savedJobs.length} saved jobs
            </div>
        </div>

          {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💼</div>
              <h3 className="text-lg font-semibold mb-2">
                {savedJobs.length === 0 ? 'No saved jobs yet' : 'No jobs match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {savedJobs.length === 0 
                  ? 'Start swiping to save jobs you\'re interested in' 
                  : 'Try adjusting your filters to see more results'
                }
              </p>
              {savedJobs.length === 0 && (
            <button 
              onClick={goToHome}
              className="bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors"
            >
              Start Saving
            </button>
              )}
          </div>
        ) : (
            <div className="flex flex-col gap-4">
              {filteredJobs.map((job) => (
                <div
                key={job.id}
                  className="bg-[#F8F8F8] rounded-[2rem] shadow-lg border-4 border-gray-300 px-4 py-3 flex flex-col gap-2 w-full max-w-sm relative cursor-pointer transition-all duration-200"
                  onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                >
                  {/* Bookmark Icon */}
                  <div className="absolute top-3 right-3 cursor-pointer z-10" onClick={e => { e.stopPropagation(); handleBookmarkClick(job); }}>
                    <div className="bg-[rgba(84,8,247,0.2)] rounded-full p-2.5 flex items-center justify-center">
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                        <path d="M7 4a2 2 0 0 0-2 2v14l7-5 7 5V6a2 2 0 0 0-2-2H7z" fill="#7300FF"/>
                      </svg>
                    </div>
                  </div>

                  {/* Source Tag */}
                  {job.source && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        job.source === 'Direct Employer' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {job.source}
                      </span>
                    </div>
                  )}

                  {/* Job Title and Company */}
                  <div>
                    <div className="text-xl font-bold text-black">{job.title}</div>
                    <div className="text-base text-gray-500">{job.company}</div>
                  </div>

                  {/* Salary, Location, and Apply Button Row */}
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <div className="text-md font-bold text-[#6C00FF]">{job.salary ? job.salary.replace(/\s*\/(hour|year|month|week|day)/, '/$1') : 'Not available'}</div>
                      <div className="text-sm text-gray-500">{job.location}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleApplyClick(job); }}
                      className="bg-[rgba(84,8,247,0.2)] text-[#7300FF] font-bold px-6 py-1.5 rounded-full text-md shadow-none hover:bg-[#7300FF] hover:text-white transition ml-4"
                    >
                      Apply
                    </button>
                  </div>

                  {/* Expanded section: Tags and Description */}
                  {expandedJobId === job.id && (
                    <>
                      {/* Tags */}
                      <div 
                        className="flex gap-2 mt-3 mb-2 overflow-x-auto pb-1"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none'
                        }}
                      >
                        {extractTags(job).map((tag, idx) => {
                          const isHighlight = userSkills.some(s => safeToLower(s) === safeToLower(tag)) || userInterests.some(i => safeToLower(i) === safeToLower(tag));
                          return (
                            <span key={idx} className={isHighlight ? "bg-gradient-to-r from-[#6C00FF] to-[#D100FF] text-white font-bold px-4 py-1 rounded-full text-sm whitespace-nowrap" : "bg-purple-100 text-[#7300FF] font-bold px-4 py-1 rounded-full text-sm whitespace-nowrap"}>
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                      {/* Description */}
                      <div className="text-gray-500 text-base mt-1 mb-1">
                        {truncateToOneSentence(job.description)}
                      </div>
                    </>
                  )}
                </div>
            ))}
            </div>
        )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-t-[2rem] p-8 z-10 flex items-center justify-center">
        <div className="w-fit mx-auto bg-white rounded-3xl flex justify-center items-center gap-6 py-3 px-8 shadow-lg border-2 border-gray-400">
          <span className="text-purple-600 font-bold text-xl underline decoration-2 underline-offset-4 transition-all duration-300 transform scale-110">Saved</span>
          <button onClick={goToHome} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Discover</button>
          <button onClick={goToApplied} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Applied</button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && jobToActOn && confirmAction === 'apply' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl border-2 border-gray-300 p-7 shadow-xl max-w-xs w-full flex flex-col items-center relative" style={{minWidth: 340}}>
            {/* Title */}
            <h2 className="text-2xl font-bold mb-4 w-full text-left">Confirm Application</h2>
            {/* Job Title and Company */}
            <div className="w-full mb-3">
              <div className="text-lg font-bold text-black">{jobToActOn.title}</div>
              <div className="text-base text-gray-500">{jobToActOn.company}</div>
            </div>
            {/* Application Includes */}
            <div className="w-full bg-gray-100 rounded-xl p-4 mb-4">
              <div className="font-semibold mb-2">Your Application includes:</div>
              <ul className="space-y-1">
                <li className="flex items-center text-black"><span className="text-green-600 mr-2">✔</span>Resume: Users_Resume.pdf</li>
                <li className="flex items-center text-black"><span className="text-green-600 mr-2">✔</span>Cover letter: Generated by AI</li>
                <li className="flex items-center text-black"><span className="text-green-600 mr-2">✔</span>Profile Information</li>
              </ul>
            </div>
            {/* Info Row */}
            <div className="flex items-start w-full mb-6">
              <span className="text-blue-500 mr-2 mt-0.5 text-xl">i</span>
              <p className="text-sm text-gray-600">Your application will be sent directly to the hiring team</p>
            </div>
            {/* Buttons */}
            <div className="flex w-full mt-2 justify-between items-center">
              <button
                onClick={handleCancelConfirm}
                className="border-2 border-gray-400 text-gray-800 font-semibold px-3 py-1 rounded-lg text-base bg-white hover:bg-gray-100 transition h-10"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="bg-[#7300FF] text-white font-bold px-5 py-1 rounded-lg text-base shadow-none hover:bg-[#5408F7] transition h-10 whitespace-nowrap"
                style={{lineHeight: '1.2'}}
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsave Notification */}
      <Notification
        message="Job unsaved successfully!"
        isVisible={showUnsaveNotification}
        onClose={() => setShowUnsaveNotification(false)}
        duration={2000}
      />
    </div>
  );
};

export default SavedScreen;

