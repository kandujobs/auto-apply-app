import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import EmployerDetailsScreen from './EmployerDetailsScreen';
import EmployerOnboardingScreen from './EmployerOnboardingScreen';
import EmployerCompanyProfileScreen from './EmployerCompanyProfileScreen';
import ApplicantsScreen from './ApplicantsScreen';
import EmployerTopNav from './EmployerTopNav';
import CreateNewListingScreen from './CreateNewListingScreen';
import EmployerQuestionsScreen from './EmployerQuestionsScreen';
import EmployerUserProfileScreen from './EmployerUserProfileScreen';

// Mock job data for now
const mockCompany = {
  name: 'Acme Corp',
  industry: "Software & AI",
  tags: ['AI', 'SaaS', 'Remote'],
  location: 'Remote',
  company_description: 'This is a mock company description.',
};
// Remove mockJobs, use real jobs from Supabase

// New CreateNewListingScreen
interface CreateNewListingScreenProps {
  onHome: () => void;
  onProfile: () => void;
  onApplicants: () => void;
}
const jobTypes = [
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'Remote', value: 'remote' },
  { label: 'On Site', value: 'onsite' },
];

const EmployerHomeScreen: React.FC = () => {
  const [employer, setEmployer] = useState<any>(null);
  const [company, setCompany] = useState<any | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Checking authentication…');
  const [showDetails, setShowDetails] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{ open: boolean; job: any; showStatusPicker: boolean }>({ open: false, job: null, showStatusPicker: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; job: any }>({ open: false, job: null });
  const [editModal, setEditModal] = useState<{ open: boolean; job: any }>({ open: false, job: null });

  // Navigation state
  const [activeScreen, setActiveScreen] = useState<'home' | 'profile' | 'applicants' | 'create' | 'questions' | 'userprofile'>('home');

  // Fetch jobs for this employer
  const fetchJobs = useCallback(async (employerId: string) => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });
    if (!error && data) setJobs(data);
  }, []);

  // Refetch employer data in-place instead of reloading the page
  const refetchEmployer = async () => {
    setLoading(true);
    setLoadingMessage('Fetching employer details…');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setLoading(false);
      return;
    }
    const { data: employerData, error: employerError } = await supabase
      .from('employers')
      .select('company_name, location, radius, latitude, longitude, employer_name, role_at_company, company_description, tags, industry')
      .eq('id', userData.user.id)
      .single();
    if (employerError || !employerData) {
      setLoading(false);
      setShowOnboarding(true);
      return;
    }
    if (!employerData.company_name || !employerData.location || !employerData.radius || !employerData.latitude || !employerData.longitude) {
      setShowOnboarding(true);
      setLoading(false);
      return;
    }
    if (!employerData.employer_name || !employerData.role_at_company) {
      setShowDetails(true);
      setLoading(false);
      return;
    }
    setEmployer(employerData);
    setCompany(employerData); // Use same data for company profile
    setShowOnboarding(false);
    setShowDetails(false);
    // Fetch jobs for this employer
    await fetchJobs(userData.user.id);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    setLoadingMessage('Checking authentication…');
    refetchEmployer();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    console.log('[EmployerHomeScreen] Mounted and rendered');
  }, []);

  // Stats
  const listings = jobs.length;
  const views = jobs.reduce((sum, j) => sum + (j.views || 0), 0);
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicants || 0), 0);
  const companyData = company || {};

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-90">
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold text-purple-700 mb-4">Loading your dashboard…</span>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#A100FF]"></div>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <EmployerOnboardingScreen onNext={refetchEmployer} />;
  }

  if (showDetails) {
    return <EmployerDetailsScreen onComplete={refetchEmployer} />;
  }

  // Navigation handlers
  const goHome = (forceRefresh = false) => {
    setActiveScreen('home');
    if (forceRefresh) {
      // Refetch jobs when returning from create
      if (employer && employer.id) fetchJobs(employer.id);
    }
  };
  const goProfile = () => setActiveScreen('profile');
  const goApplicants = () => setActiveScreen('applicants');
  const goCreate = () => setActiveScreen('create');
  const goQuestions = () => setActiveScreen('questions');
  const goUserProfile = () => setActiveScreen('userprofile');

  const handleEditJob = (job: any) => {
    setEditModal({ open: true, job });
    setExpandedJobId(null);
  };

  const handleDeleteJob = async (job: any) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', job.id);
      
      if (error) {
        console.error('Error deleting job:', error);
        return;
      }
      
      // Remove from local state
      setJobs(prevJobs => prevJobs.filter(j => j.id !== job.id));
      setDeleteModal({ open: false, job: null });
      setExpandedJobId(null);
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const handleSaveJobEdit = async (updatedJob: any) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('jobs')
        .update({
          title: updatedJob.title,
          location: updatedJob.location,
          salary: updatedJob.salary,
          description: updatedJob.description,
          requirements: updatedJob.requirements,
          type: updatedJob.type,
          tags: updatedJob.tags
        })
        .eq('id', updatedJob.id);
      
      if (error) {
        console.error('Error updating job:', error);
        return;
      }
      
      // Update local state
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === updatedJob.id ? { ...job, ...updatedJob } : job
      ));
      
      setEditModal({ open: false, job: null });
    } catch (error) {
      console.error('Error updating job:', error);
    }
  };

  // Render screens based on navigation state
  if (activeScreen === 'profile') {
    return (
      <EmployerCompanyProfileScreen
        onHome={goHome}
        onApplicants={goApplicants}
        onCreate={goCreate}
        onEdit={() => {}}
        company={{ ...company, jobOffers: jobs }}
        loading={loading}
        onProfileSave={setCompany}
        refetchProfile={refetchEmployer}
        onQuestions={goQuestions}
      />
    );
  }
  if (activeScreen === 'applicants') {
    return (
      <ApplicantsScreen onHome={goHome} onProfile={goProfile} onCreate={goCreate} jobListings={jobs} onQuestions={goQuestions} />
    );
  }
  if (activeScreen === 'create') {
    return (
      <CreateNewListingScreen onHome={() => goHome(true)} onProfile={goProfile} onApplicants={goApplicants} onQuestions={goQuestions} />
    );
  }
  if (activeScreen === 'questions') {
    return (
      <EmployerQuestionsScreen goHome={goHome} goProfile={goProfile} goApplicants={goApplicants} />
    );
  }
  if (activeScreen === 'userprofile') {
    return (
      <EmployerUserProfileScreen 
        onHome={goHome}
        onCreate={goCreate}
        onQuestions={goQuestions}
        onUserSettings={goUserProfile}
        onApplicants={goApplicants}
        onCompanyProfile={goProfile}
      />
    );
  }

  // Main content: Job Listings UI (Home)
  return (
    <div className="min-h-screen bg-gray-100 pt-40 pb-40 px-4">
      {/* Top Nav Gradient */}
      <EmployerTopNav
        onCreate={goCreate}
        onQuestions={goQuestions}
        onEdit={() => {}}
        onUserSettings={goUserProfile}
      />
      <div className="max-w-md mx-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
        <div className="mb-2">
          <h1 className="text-2xl font-bold mb-1 text-center">Welcome{employer?.employer_name ? `, ${employer.employer_name}` : ''}</h1>
          <div className="text-base text-gray-500 text-center mb-4">Track your listings and their status</div>
          {/* Stats Bar */}
          <div className="flex justify-between items-center bg-white rounded-[2rem] shadow-lg p-4 mb-4 border-4 border-gray-300">
            <div className="flex flex-col items-center flex-1">
              <span className="text-lg font-bold text-black">{views}</span>
              <span className="text-base font-regular text-gray-600 mt-1">Views</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <span className="text-lg font-bold text-black">{listings}</span>
              <span className="text-base font-regular text-gray-600 mt-1">Listings</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <span className="text-lg font-bold text-black">{totalApplicants}</span>
              <span className="text-base font-regular text-gray-600 mt-1">Applicants</span>
            </div>
          </div>
          <p className="text-xl text-[#7300FF] text-center font-semibold mb-6">Manage and view your posted jobs</p>
        </div>
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-semibold mb-2">No job listings yet</h3>
            <p className="text-gray-600 mb-6">Start by creating your first job listing</p>
            <button 
              className="bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors"
              onClick={() => setActiveScreen('create')}
            >
              Create Job Listing
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-[#F8F8F8] rounded-[2rem] shadow-lg border-4 border-gray-300 px-4 py-3 flex flex-col gap-2 w-full max-w-sm relative cursor-pointer transition-all duration-200"
                onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
              >
                {/* Job Title and Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-black">{job.title}</div>
                    <div className="text-base text-gray-500">{job.location}</div>
                  </div>
                  <span
                    className={job.status === 'Open' ? 'bg-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-bold cursor-pointer' : 'bg-gray-300 text-gray-700 px-4 py-2 rounded-full text-sm font-bold cursor-pointer'}
                    onClick={e => { e.stopPropagation(); setStatusModal({ open: true, job, showStatusPicker: false }); }}
                  >
                    {job.status}
                  </span>
                </div>
                {/* Salary and Actions */}
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <div className="text-md font-bold text-[#6C00FF]">{job.salary}</div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="bg-purple-100 text-[#7300FF] font-bold px-4 py-1 rounded-full text-sm shadow-none hover:bg-[#7300FF] hover:text-white transition"
                      onClick={(e) => { e.stopPropagation(); goApplicants(); }}
                    >
                      View Applicants
                    </button>
                  </div>
                </div>
                {/* Expanded section: Description, Requirements, Stats Bar, Edit/Delete */}
                {expandedJobId === job.id && (
                  <div className="mt-3 mb-2">
                    {/* Stats Bar for this job */}
                    <div className="flex justify-between items-center bg-white rounded-xl shadow p-3 mb-2 border border-gray-200">
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-base font-bold text-[#7300FF]">{job.swipes ?? 42}</span>
                        <span className="text-xs text-gray-500 font-semibold mt-1">Swipes</span>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-base font-bold text-[#7300FF]">{job.applicants || 0}</span>
                        <span className="text-xs text-gray-500 font-semibold mt-1">Applicants</span>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-base font-bold text-[#7300FF]">{job.saves ?? 0}</span>
                        <span className="text-xs text-gray-500 font-semibold mt-1">Saves</span>
                      </div>
                    </div>
                    <div className="text-gray-700 mb-2"><span className="font-semibold">Description:</span> {job.description}</div>
                    <div className="text-gray-700 mb-2">
                      <span className="font-semibold">Requirements:</span> {
                        Array.isArray(job.requirements) 
                          ? job.requirements.join(', ')
                          : typeof job.requirements === 'string'
                            ? job.requirements.replace(/[\[\]"]/g, '') // Remove brackets and quotes
                            : 'No requirements specified'
                      }
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button 
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-bold hover:bg-gray-300 transition"
                        onClick={(e) => { e.stopPropagation(); handleEditJob(job); }}
                      >
                        Edit
                      </button>
                      <button 
                        className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold hover:bg-red-200 transition"
                        onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, job }); }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {/* Create New Listing Card */}
            <div
              className="bg-white rounded-[2rem] shadow-lg border-4 border-dashed border-[#984DE0] px-4 py-8 flex flex-col items-center justify-center w-full max-w-sm cursor-pointer hover:bg-purple-50 transition-all duration-200 mt-2"
              onClick={() => setActiveScreen('create')}
            >
              <div className="flex items-center justify-center mb-2">
                <span className="text-3xl text-[#7300FF] mr-2">+</span>
                <span className="text-xl font-bold text-[#7300FF]">Create New Listing</span>
              </div>
              <p className="text-gray-500 text-sm text-center">Post a new job to find your next great hire</p>
            </div>
          </div>
        )}
      </div>
      {/* Company Profile Section */}
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-[2rem] shadow-lg border-4 border-gray-300 p-6 flex flex-col items-center">
          {/* Title */}
          <h2 className="text-xl font-bold text-[#7300FF] m-0 mb-4">Company Profile</h2>
          {/* Company Profile Preview Card */}
          <div className="bg-white rounded-[2rem] shadow-lg border-4 border-gray-300 p-4 flex flex-col gap-2 w-full max-w-sm mb-4">
            {/* Company Title */}
            <div className="text-lg font-bold mb-1">{companyData.company_name || companyData.name}</div>
            {/* Location with pin emoji */}
            <div className="flex items-center text-gray-700 text-sm mb-1">
              <span role="img" aria-label="location" className="mr-1">📍</span>{companyData.location}
            </div>
            {/* Industry */}
            <div className="flex items-center text-gray-700 text-sm mb-1">
              <span role="img" aria-label="industry" className="mr-1">🏢</span>{companyData.industry || 'Industry not specified'}
            </div>
          </div>
          {/* Edit button moved below */}
          <button
            className="bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold px-6 py-2 rounded-full shadow hover:from-[#7300FF] hover:to-[#984DE0] transition"
            onClick={goProfile}
          >
            Edit Company Profile
          </button>
        </div>
      </div>
      {/* Bottom Nav Gradient */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-t-[2rem] p-8 z-10 flex items-center justify-center">
        <div className="w-fit mx-auto bg-white rounded-3xl flex justify-center items-center gap-6 py-3 px-8 shadow-lg border-2 border-gray-400">
          <button
            onClick={goProfile}
            className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Profile
          </button>
          <span className="text-purple-600 font-bold text-xl underline decoration-2 underline-offset-4 transition-all duration-300 transform scale-110">
            Home
          </span>
          <button
            onClick={goApplicants}
            className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Applicants
          </button>
        </div>
      </div>
      {/* Status Modal */}
      {statusModal.open && statusModal.job && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2 text-center">Job Status</h2>
            <div className="text-lg font-semibold mb-2">Current Status: <span className={statusModal.job.status === 'Open' ? 'text-green-600' : 'text-gray-600'}>{statusModal.job.status}</span></div>
            <div className="text-gray-600 text-center mb-4">
              {statusModal.job.status === 'Open'
                ? 'This job is currently open and visible to applicants.'
                : statusModal.job.status === 'Closed'
                  ? 'This job is closed and not visible to new applicants.'
                  : 'This job is currently paused.'}
            </div>
            {/* Status selection logic */}
            {statusModal.showStatusPicker ? (
              <div className="w-full flex flex-col gap-2 mb-4">
                {['Open', 'Closed', 'Paused'].map((status) => (
                  <button
                    key={status}
                    className={`w-full py-2 rounded-full font-bold border-2 transition text-lg ${statusModal.job.status === status ? 'bg-[#984DE0] text-white border-[#984DE0]' : 'bg-white text-[#7300FF] border-[#984DE0] hover:bg-[#F3E8FF]'}`}
                    onClick={async () => {
                      // Update status in Supabase
                      await supabase.from('jobs').update({ status }).eq('id', statusModal.job.id);
                      // Update local state
                      setStatusModal((prev) => ({ ...prev, job: { ...prev.job, status } }));
                      // Optionally, update jobs list in parent state if needed
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            ) : (
            <button
                className="bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold px-6 py-2 rounded-full shadow hover:from-[#7300FF] hover:to-[#984DE0] transition mb-4"
                onClick={() => setStatusModal((prev) => ({ ...prev, showStatusPicker: true }))}
            >
              Change Status
            </button>
            )}
            <button
              className="mt-2 text-gray-500 underline text-sm"
              onClick={() => setStatusModal({ open: false, job: null, showStatusPicker: false })}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.job && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-center">Delete Job Listing</h2>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete "{deleteModal.job.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-4 w-full">
              <button
                className="flex-1 bg-gray-300 text-gray-700 font-bold px-4 py-2 rounded-full hover:bg-gray-400 transition"
                onClick={() => setDeleteModal({ open: false, job: null })}
              >
                Cancel
              </button>
              <button
                className="flex-1 bg-red-500 text-white font-bold px-4 py-2 rounded-full hover:bg-red-600 transition"
                onClick={() => handleDeleteJob(deleteModal.job)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Job Modal */}
      {editModal.open && editModal.job && (
        <EditJobModal 
          job={editModal.job} 
          onSave={handleSaveJobEdit} 
          onCancel={() => setEditModal({ open: false, job: null })}
        />
      )}
    </div>
  );
};

// Edit Job Modal Component
const EditJobModal: React.FC<{ job: any; onSave: (job: any) => void; onCancel: () => void }> = ({ job, onSave, onCancel }) => {
  const [editedJob, setEditedJob] = useState({
    id: job.id,
    title: job.title || '',
    location: job.location || '',
    salary: job.salary || '',
    description: job.description || '',
    requirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements || '',
    type: job.type || 'full-time',
    tags: Array.isArray(job.tags) ? job.tags.join(', ') : job.tags || ''
  });

  const handleSave = () => {
    const updatedJob = {
      ...editedJob,
      requirements: editedJob.requirements.split(',').map((req: string) => req.trim()).filter(Boolean),
      tags: editedJob.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
    };
    onSave(updatedJob);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Edit Job Listing</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
            <input
              type="text"
              value={editedJob.title}
              onChange={(e) => setEditedJob({ ...editedJob, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={editedJob.location}
              onChange={(e) => setEditedJob({ ...editedJob, location: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Salary</label>
            <input
              type="text"
              value={editedJob.salary}
              onChange={(e) => setEditedJob({ ...editedJob, salary: e.target.value })}
              placeholder="e.g., $50,000 - $70,000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Job Type</label>
            <select
              value={editedJob.type}
              onChange={(e) => setEditedJob({ ...editedJob, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={editedJob.description}
              onChange={(e) => setEditedJob({ ...editedJob, description: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Requirements (comma-separated)</label>
            <textarea
              value={editedJob.requirements}
              onChange={(e) => setEditedJob({ ...editedJob, requirements: e.target.value })}
              rows={3}
              placeholder="e.g., 3+ years experience, JavaScript, React"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={editedJob.tags}
              onChange={(e) => setEditedJob({ ...editedJob, tags: e.target.value })}
              placeholder="e.g., Remote, AI, Startup"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 font-bold px-4 py-2 rounded-full hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold px-4 py-2 rounded-full hover:from-[#7300FF] hover:to-[#984DE0] transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployerHomeScreen; 