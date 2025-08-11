import React, { useState, useMemo } from 'react';
import { Job } from '../types/Job';
import NetworkStatusModal from './NetworkStatusModal';
import { STANDARD_TAGS } from '../data/tags';

interface AppliedScreenProps {
  goToHome: () => void;
  goToProfile?: () => void;
  goToSaved?: () => void;
  goToNotifications?: () => void;
  goToFilters?: () => void;
  appliedJobs: Job[];
  onUpdateJobStatus: (jobId: string, newStatus: 'Applied' | 'Rejected' | 'Response' | 'Saved') => void;
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



// Inject animated-gradient CSS for the flowing progress bar
const AnimatedGradientStyle = () => (
  <style>{`
    .animated-gradient {
      background: linear-gradient(90deg, #984DE0, #7300FF, #984DE0 60%);
      background-size: 200% 100%;
      animation: gradient-flow 2s linear infinite;
    }
    @keyframes gradient-flow {
      0% { background-position: 0% 50%; }
      100% { background-position: 100% 50%; }
    }
    
    .pulse-animation {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: .5;
      }
    }
    
    .message-fade-in {
      animation: fadeIn 0.3s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `}</style>
);

const AppliedScreen: React.FC<AppliedScreenProps> = ({ 
  goToHome, 
  goToProfile, 
  goToSaved, 
  goToNotifications, 
  goToFilters,
  appliedJobs,
  onUpdateJobStatus,
  userSkills = [],
  userInterests = [],
}) => {
  const [showNetworkStatusModal, setShowNetworkStatusModal] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const safeToLower = (val: any) => typeof val === 'string' ? val.toLowerCase() : '';

  // Filter applied jobs based on selected filters
  const filteredJobs = useMemo(() => {
    return appliedJobs.filter(job => {
      const statusMatch = statusFilter === 'all' || job.status === statusFilter;
      
      // Date filtering
      let dateMatch = true;
      if (dateFilter !== 'all' && job.applicationProcessedAt) {
        const jobDate = new Date(job.applicationProcessedAt);
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
  }, [appliedJobs, statusFilter, dateFilter]);

  // Get unique statuses for filter options
  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(appliedJobs.map(job => job.status).filter(Boolean))];
    return ['all', ...statuses];
  }, [appliedJobs]);

  // Date filter options
  const dateFilterOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <AnimatedGradientStyle />
      
      {/* Header */}
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

      {/* Main Content with proper spacing */}
      <div className="pt-32 pb-32">
        <div className="max-w-md mx-auto overflow-y-auto px-4" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          <div className="mb-2 mt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
            <h1 className="text-2xl font-bold">Applied Jobs</h1>
                <p className="text-sm text-gray-600">Your application history</p>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date Applied</label>
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
              Showing {filteredJobs.length} of {appliedJobs.length} applied jobs
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold mb-2">
                {appliedJobs.length === 0 ? 'No applied jobs yet' : 'No jobs match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {appliedJobs.length === 0 
                  ? 'Start swiping to apply to jobs' 
                  : 'Try adjusting your filters to see more results'
                }
              </p>
              {appliedJobs.length === 0 && (
              <button 
                onClick={goToHome}
                className="bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors"
              >
                Start Applying
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
                  {/* Status and Source Tags - Top Right Corner */}
                  <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
                    {/* Status Badge */}
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      job.status === 'applied' ? 'bg-green-100 text-green-700' :
                      job.status === 'applying' ? 'bg-green-100 text-green-700' :
                      job.status === 'error' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {job.status === 'applied' ? 'Applied' :
                       job.status === 'applying' ? 'Applied' :
                       job.status === 'error' ? 'Error' :
                       'Unknown'}
                    </span>

                    {/* Source Tag */}
                    {job.source && (
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        job.source === 'Direct Employer' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {job.source}
                      </span>
                    )}
                  </div>

                  {/* Job Title and Company */}
                  <div className="pr-20">
                    <div className="text-xl font-bold text-black break-words leading-tight">{job.title}</div>
                    <div className="text-base text-gray-500">{job.company}</div>
                  </div>

                  {/* Salary and Location */}
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <div className="text-md font-bold text-[#6C00FF]">{job.salary ? job.salary.replace(/\s*\/(hour|year|month|week|day)/, '/$1') : 'Not available'}</div>
                      <div className="text-sm text-gray-500">{job.location}</div>
                    </div>
                  </div>

                  {/* Application Date - Bottom Right Corner */}
                  <div className="absolute bottom-3 right-3 z-10">
                    <div className="text-xs text-gray-500 text-right">
                      {job.appliedDate ? 
                        new Date(job.appliedDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        }) : 
                        job.applicationProcessedAt ? 
                          new Date(job.applicationProcessedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }) : 
                          'Date unknown'
                      }
                    </div>
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
                      <div className="text-gray-500 text-base mt-1 mb-1 line-clamp-3">
                        {job.description}
                      </div>
                      {/* Error Message if any */}
                      {job.applicationError && (
                        <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded">
                          Error: {job.applicationError}
                        </div>
                      )}
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
          <button onClick={goToSaved} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">
            Saved
          </button>
          <button onClick={goToHome} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">
            Discover
          </button>
          <span className="text-purple-600 font-bold text-xl underline decoration-2 underline-offset-4 transition-all duration-300 transform scale-110">
            Applied
          </span>
        </div>
      </div>

      {/* Network Status Modal */}
      <NetworkStatusModal
        isOpen={showNetworkStatusModal}
        onClose={() => setShowNetworkStatusModal(false)}
      />
    </div>
  );
};

export default AppliedScreen;
