import React, { useState, useEffect } from 'react';
import EmployerTopNav from './EmployerTopNav';
import { useRef } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { UserProfile } from '../../types/Profile';
import ResumePreview from '../ResumePreview';
import { getLatestUserResume } from '../../utils/resumeUpload';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
}

interface Application {
  id: string;
  user_id: string;
  job_id: string;
  title: string;
  company: string;
  applied_at: string;
  status: string;
  raw_job: any;
  user_profile?: UserProfile;
}

interface ApplicantsScreenProps {
  onHome?: () => void;
  onProfile?: () => void;
  onCreate?: () => void;
  onEditListings?: () => void;
  onUserSettings?: () => void;
  jobListings?: any[];
  onQuestions?: () => void;
}

const ApplicantsScreen: React.FC<ApplicantsScreenProps> = ({ onHome, onProfile, onCreate, onEditListings, onUserSettings, jobListings = [], onQuestions }) => {
  const [jobListingsData, setJobListingsData] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [jobDropdownOpen, setJobDropdownOpen] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Swipe state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Resume preview state
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [currentApplicantResume, setCurrentApplicantResume] = useState<any>(null);

  // Filter applications for selected job
  const filteredApplications = applications.filter(app => app.job_id === selectedJobId);
  const currentApplicant = filteredApplications[currentIdx] || null;

  // Load current applicant's resume from storage
  useEffect(() => {
    const loadApplicantResume = async () => {
      if (!currentApplicant?.user_id) {
        setCurrentApplicantResume(null);
        return;
      }

      try {
        const resume = await getLatestUserResume(currentApplicant.user_id);
        setCurrentApplicantResume(resume);
      } catch (error) {
        console.error('Error loading applicant resume:', error);
        setCurrentApplicantResume(null);
      }
    };

    loadApplicantResume();
  }, [currentApplicant?.user_id]);

  // Fetch job listings and applications
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        // Fetch job listings for this employer
        const { data: jobsData, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('employer_id', userData.user.id);

        if (jobsError) {
          console.error('Error fetching jobs:', jobsError);
          return;
        }

        setJobListingsData(jobsData || []);
        
        if (jobsData && jobsData.length > 0) {
          setSelectedJobId(jobsData[0].id);
        }

        // Fetch applications for all jobs
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('job_applications')
          .select('*')
          .in('job_id', jobsData?.map(job => job.id) || []);

        if (applicationsError) {
          console.error('Error fetching applications:', applicationsError);
          return;
        }

        if (!applicationsData || applicationsData.length === 0) {
          setApplications([]);
          setLoading(false);
          return;
        }

        // Get all unique user IDs from applications
        const userIds = [...new Set(applicationsData.map(app => app.user_id))];

        // Batch fetch all profiles, education, and experience data
        const [profilesResponse, educationResponse, experienceResponse] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .in('id', userIds),
          supabase
            .from('education')
            .select('*')
            .in('profile_id', userIds),
          supabase
            .from('experience')
            .select('*')
            .in('profile_id', userIds)
        ]);

        // Create lookup maps for faster data access
        const profilesMap = new Map(
          (profilesResponse.data || []).map(profile => [profile.id, profile])
        );
        
        const educationMap = new Map();
        (educationResponse.data || []).forEach(edu => {
          if (!educationMap.has(edu.profile_id)) {
            educationMap.set(edu.profile_id, []);
          }
          educationMap.get(edu.profile_id).push(edu);
        });

        const experienceMap = new Map();
        (experienceResponse.data || []).forEach(exp => {
          if (!experienceMap.has(exp.profile_id)) {
            experienceMap.set(exp.profile_id, []);
          }
          experienceMap.get(exp.profile_id).push(exp);
        });

        // Combine all data efficiently
        const applicationsWithProfiles = applicationsData.map(app => {
          const profileData = profilesMap.get(app.user_id);
          const educationData = educationMap.get(app.user_id) || [];
          const experienceData = experienceMap.get(app.user_id) || [];

          // Map education and experience to match the expected format
          const mappedEducation = educationData.map((e: any) => ({
            id: e.id,
            institution: e.institution,
            degree: e.degree,
            field: e.field,
            startDate: e.start_date,
            endDate: e.end_date,
            gpa: e.gpa,
          }));

          const mappedExperience = experienceData.map((e: any) => ({
            id: e.id,
            title: e.job_title,
            company: e.company,
            location: e.location,
            startDate: e.start_date,
            endDate: e.end_date,
            current: !!e.is_current,
            description: e.description,
          }));
          
          return {
            ...app,
            user_profile: {
              ...profileData,
              education: mappedEducation,
              experience: mappedExperience,
            }
          };
        });

        setApplications(applicationsWithProfiles);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePrev = () => setCurrentIdx(idx => Math.max(0, idx - 1));
  const handleNext = () => setCurrentIdx(idx => Math.min(filteredApplications.length - 1, idx + 1));
  
  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;
    
    if (dragOffset > threshold && currentApplicant) {
      // Swipe right - Interview
      handleUpdateStatus(currentApplicant.id, 'interview');
      handleNext();
    } else if (dragOffset < -threshold && currentApplicant) {
      // Swipe left - Decline
      handleUpdateStatus(currentApplicant.id, 'rejected');
      handleNext();
    }
    
    setDragOffset(0);
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    setDragOffset(deltaX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;
    
    if (dragOffset > threshold && currentApplicant) {
      // Swipe right - Interview
      handleUpdateStatus(currentApplicant.id, 'interview');
      handleNext();
    } else if (dragOffset < -threshold && currentApplicant) {
      // Swipe left - Decline
      handleUpdateStatus(currentApplicant.id, 'rejected');
      handleNext();
    }
    
    setDragOffset(0);
  };
  
  const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedJobId(e.target.value);
    setCurrentIdx(0);
  };

  const handleUpdateStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating application status:', error);
        return;
      }

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status } 
            : app
        )
      );

      console.log(`Application status updated to: ${status}`);
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  // Global mouse up handler
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragOffset(0);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

  // Keyboard fallback for desktop
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentApplicant) {
        handleUpdateStatus(currentApplicant.id, 'rejected');
        handleNext();
      }
      if (e.key === 'ArrowRight' && currentApplicant) {
        handleUpdateStatus(currentApplicant.id, 'interview');
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [filteredApplications.length, currentApplicant]);

  // Card style for swipe animation
  const cardStyle = {
    transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.1}deg)`,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#A100FF] mb-4"></div>
        <span className="text-xl font-bold text-[#A100FF]">Loading applicants...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-between">
      {/* Top Nav Gradient */}
      <EmployerTopNav
        onCreate={onCreate}
        onEdit={onEditListings}
        onUserSettings={onUserSettings}
        onQuestions={onQuestions}
      />
      {/* Job Listing Selector Bar - Collapsible Dropdown */}
      <div style={{ position: 'relative', zIndex: 20, width: '100%' }}>
        <div
          ref={dropdownRef}
          className={`transition-all duration-300 ease-in-out mx-auto ${jobDropdownOpen ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'} flex items-center gap-1 bg-white rounded-b-2xl rounded-t-none border-4 border-gray-300 shadow-lg px-3 py-2`}
          style={{
            position: 'absolute',
            top: '128px', // h-32 = 128px
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 2rem)',
            maxWidth: '384px', // max-w-md
          }}
        >
          <span className="font-semibold text-gray-700 text-sm whitespace-nowrap">Applicants for:</span>
          <select
            value={selectedJobId || ''}
            onChange={handleJobChange}
            className="border rounded-lg px-2 py-1 text-sm bg-white shadow min-w-[120px] max-w-[170px]"
          >
            {jobListingsData.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <button
            className="ml-2 text-gray-400 hover:text-[#7300FF] text-lg flex items-center"
            onClick={() => setJobDropdownOpen(false)}
            aria-label="Collapse job selector"
            style={{ marginLeft: 'auto' }}
          >
            <FaChevronUp />
          </button>
        </div>
        {/* Collapsed bar with down arrow */}
        {!jobDropdownOpen && (
          <div
            className="absolute left-1/2 -translate-x-1/2 top-[128px] w-24 h-6 flex items-center justify-center bg-white rounded-b-xl shadow border-2 border-gray-300 cursor-pointer z-30"
            onClick={() => setJobDropdownOpen(true)}
            style={{ minWidth: '96px' }}
          >
            <FaChevronDown className="text-[#7300FF]" />
          </div>
        )}
      </div>
      {/* Main Content: Single Applicant Card with Swipe */}
      <div className="flex-1 w-full flex flex-col items-center justify-center pb-40 px-2 min-h-[calc(100vh-300px)] mt-40">
        {currentApplicant ? (
          <div className="flex flex-col items-center gap-4 justify-center h-full">
            {/* Swipe indicators */}
            {dragOffset > 50 && (
              <div 
                className="fixed right-8 top-1/2 transform -translate-y-1/2 bg-green-500 text-white px-6 py-3 rounded-full font-semibold text-lg z-20 pointer-events-none transition-opacity duration-200"
                style={{ opacity: Math.min(dragOffset / 200, 1) }}
              >
                Interview
              </div>
            )}
            {dragOffset < -50 && (
              <div 
                className="fixed left-8 top-1/2 transform -translate-y-1/2 bg-red-500 text-white px-6 py-3 rounded-full font-semibold text-lg z-20 pointer-events-none transition-opacity duration-200"
                style={{ opacity: Math.min(Math.abs(dragOffset) / 200, 1) }}
              >
                Decline
              </div>
            )}
            
            <div 
              ref={cardRef}
              className="bg-white rounded-[2rem] shadow-lg border-4 border-gray-300 p-4 min-w-[320px] max-w-sm h-[600px] flex-shrink-0 flex flex-col relative touch-pan-x select-none"
              style={cardStyle}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                {/* Name and Location */}
                <div className="flex items-center justify-between mt-0 mb-3">
                  <div className="text-2xl font-bold text-black">{currentApplicant.user_profile?.name || 'Unknown User'}</div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <span role="img" aria-label="location">📍</span>
                    {currentApplicant.user_profile?.location || 'Location not specified'}
                  </div>
                </div>

                {/* Education Section */}
                <div className="mb-3">
                  <div className="font-bold text-xl text-[#7300FF] mb-2">Education</div>
                  {currentApplicant.user_profile?.education?.map((edu: any, idx: number) => (
                    <div key={idx} className="text-sm text-gray-600 mb-2 p-2 bg-gray-50 rounded-lg">
                      <div className="font-bold text-[#7300FF]">{edu.institution}</div>
                      <div>{edu.degree} {edu.field && `in ${edu.field}`}</div>
                      <div className="text-gray-500 italic">{edu.startDate} - {edu.endDate}</div>
                      {edu.gpa && <div className="text-gray-500">GPA: {edu.gpa}</div>}
                    </div>
                  )) || <span className="text-gray-400 text-sm">No education listed</span>}
                </div>

                {/* Skills Section */}
                <div className="mb-3">
                  <div className="font-bold text-xl text-[#7300FF] mb-2">Skills</div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {currentApplicant.user_profile?.skills?.map((skill: string, idx: number) => (
                      <span key={idx} className="bg-purple-100 text-[#7300FF] font-bold px-4 py-2 rounded-[2rem] text-sm whitespace-nowrap flex-shrink-0">{skill}</span>
                    )) || <span className="text-gray-400 text-sm">No skills listed</span>}
                  </div>
                </div>

                {/* Experience Section */}
                <div className="mb-3">
                  <div className="font-bold text-xl text-[#7300FF] mb-2">Experience</div>
                  {currentApplicant.user_profile?.experience?.map((exp: any, idx: number) => (
                    <div key={idx} className="text-sm text-gray-600 mb-2 p-2 bg-gray-50 rounded-lg">
                      <div className="font-bold text-[#7300FF]">{exp.title}</div>
                      <div className="text-gray-700">{exp.company} • {exp.location}</div>
                      <div className="text-gray-500 italic">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</div>
                      <div className="mt-1">{exp.description}</div>
                    </div>
                  )) || <span className="text-gray-400 text-sm">No experience listed</span>}
                </div>

                {/* Interests Section */}
                <div className="mb-3">
                  <div className="font-bold text-xl text-[#7300FF] mb-2">Interests</div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {currentApplicant.user_profile?.interests?.map((interest: string, idx: number) => (
                      <span key={idx} className="bg-purple-100 text-[#7300FF] font-semibold px-4 py-2 rounded-[2rem] text-sm whitespace-nowrap flex-shrink-0">{interest}</span>
                    )) || <span className="text-gray-400 text-sm">No interests listed</span>}
                  </div>
                </div>

                {/* Application Info */}
                <div className="mt-2 p-3 bg-gray-50 rounded-lg mb-4">
                  <div className="text-sm text-gray-600">
                    <div><strong>Applied for:</strong> {currentApplicant.title}</div>
                    <div><strong>Applied on:</strong> {new Date(currentApplicant.applied_at).toLocaleDateString()}</div>
                    <div><strong>Status:</strong> <span className={`font-semibold ${
                      currentApplicant.status === 'applied' ? 'text-blue-600' : 
                      currentApplicant.status === 'interview' ? 'text-green-600' : 
                      currentApplicant.status === 'rejected' ? 'text-red-600' : 
                      'text-purple-600'
                    }`}>{currentApplicant.status}</span></div>
                  </div>
                  
                  {/* Resume Preview */}
                  {currentApplicantResume ? (
                    <div className="mt-3">
                      <div 
                        className="w-full h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center relative overflow-hidden"
                        onClick={() => setShowResumePreview(true)}
                      >
                        <iframe
                          src={`${currentApplicantResume.public_url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                          className="w-full h-full border-0 pointer-events-none"
                          title="Resume Preview"
                          onError={(e) => {
                            // If iframe fails, show fallback
                            const target = e.target as HTMLIFrameElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="flex flex-col items-center justify-center text-center p-2">
                                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24" class="text-gray-400 mb-1">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <p class="text-xs text-gray-500 font-medium">Click to preview resume</p>
                                </div>
                              `;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                          <div className="bg-white bg-opacity-90 rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity duration-200">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="text-purple-600">
                              <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="w-full h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24" className="text-gray-400 mx-auto mb-1">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <p className="text-xs text-gray-500">No resume available</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Action Button at Bottom */}
              <div className="flex flex-col gap-2 w-full mt-4">
                <button 
                  className="w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold py-2.5 rounded-full shadow hover:from-[#7300FF] hover:to-[#984DE0] transition text-base text-center"
                  onClick={() => {
                    handleUpdateStatus(currentApplicant.id, 'saved');
                    handleNext();
                  }}
                >
                  Review this application later
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-center mt-20">No applicants for this listing.</div>
        )}
      </div>
      {/* Bottom Nav Gradient */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-t-[2rem] p-8 z-10 flex items-center justify-center">
        <div className="w-fit mx-auto bg-white rounded-3xl flex justify-center items-center gap-6 py-3 px-8 shadow-lg border-2 border-gray-400">
          <button
            onClick={onProfile}
            className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Profile
          </button>
          <button
            onClick={onHome}
            className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Home
          </button>
          <span className="text-purple-600 font-bold text-xl underline decoration-2 underline-offset-4 transition-all duration-300 transform scale-110">
            Applicants
          </span>
        </div>
      </div>

      {/* Resume Preview Modal */}
      {currentApplicantResume && (
        <ResumePreview
          resumeUrl={currentApplicantResume.public_url}
          filename={currentApplicantResume.name}
          onClose={() => setShowResumePreview(false)}
          isVisible={showResumePreview}
        />
      )}
    </div>
  );
};

export default ApplicantsScreen; 