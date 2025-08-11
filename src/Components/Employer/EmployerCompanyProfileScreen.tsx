import React, { useState, useEffect } from 'react';
import EmployerTopNav from './EmployerTopNav';
import { supabase } from '../../supabaseClient';
import LocationSection from '../SmartFeedSections/LocationSection';

const mockCompany = {
  name: 'Acme Corp',
  industry: 'Software & AI',
  tags: ['AI', 'SaaS', 'Remote'],
  location: 'Remote',
  company_description: 'This is a mock company description.',
  jobOffers: [
    {
      id: '1',
      title: 'Frontend Developer',
      salary: '$100,000 - $120,000',
      location: 'Remote',
      fitScore: 87,
    },
    {
      id: '2',
      title: 'Backend Developer',
      salary: '$110,000 - $130,000',
      location: 'Remote',
      fitScore: 90,
    },
    {
      id: '3',
      title: 'Product Manager',
      salary: '$120,000 - $140,000',
      location: 'Remote',
      fitScore: 85,
    },
  ],
};

interface EmployerCompanyProfileScreenProps {
  onHome?: () => void;
  onApplicants?: () => void;
  onEdit?: () => void;
  onCreate?: () => void;
  company: any;
  loading: boolean;
  onProfileSave: (company: any) => void;
  refetchProfile?: () => void;
  onQuestions?: () => void;
}

const EmployerCompanyProfileScreen: React.FC<EmployerCompanyProfileScreenProps> = ({ onHome, onApplicants, onEdit, onCreate, company, loading, onProfileSave, refetchProfile }) => {
  const [editFields, setEditFields] = useState<any>({
    name: '',
    industry: '',
    tags: '',
    location: '',
    company_description: '',
    latitude: 40.7128,
    longitude: -74.006,
    radius: 5,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  // Sync editFields and selectedTags with company prop when it changes
  useEffect(() => {
    if (company) {
      setEditFields({
        name: company.company_name || '',
        industry: company.industry || '',
        tags: (company.tags || []).join(', '),
        location: company.location || '',
        company_description: company.company_description || '',
        latitude: company.latitude || 40.7128,
        longitude: company.longitude || -74.006,
        radius: company.radius || 5,
  });
      setSelectedTags(company.tags || []);
    }
  }, [company]);

  // Industry options and tag suggestions
  const industryOptions = [
    { value: 'Software', label: 'Software', tags: ['AI', 'Remote', 'Startup', 'SaaS', 'Cloud', 'Web', 'Mobile', 'Open Source', 'DevOps', 'ML'] },
    { value: 'Healthcare', label: 'Healthcare', tags: ['Telemedicine', 'Biotech', 'Pharma', 'Wellness', 'Devices', 'Diagnostics', 'Remote', 'AI', 'Research'] },
    { value: 'Finance', label: 'Finance', tags: ['Fintech', 'Banking', 'Crypto', 'Investing', 'Payments', 'Insurance', 'Trading', 'Analytics'] },
    { value: 'Education', label: 'Education', tags: ['EdTech', 'Online', 'K-12', 'Higher Ed', 'Tutoring', 'Remote', 'AI', 'LMS'] },
    { value: 'Retail', label: 'Retail', tags: ['E-commerce', 'Logistics', 'Supply Chain', 'Marketplace', 'Fashion', 'DTC', 'Analytics'] },
    // Add more as needed
  ];
  const selectedIndustry = industryOptions.find(opt => opt.value === editFields.industry) || industryOptions[0];

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditFields({ ...editFields, [e.target.name]: e.target.value });
  };

  // LocationSection handler
  const handleLocationUpdated = (location: string, radius: number, latitude: number, longitude: number) => {
    setEditFields({ ...editFields, location, radius, latitude, longitude });
  };

  // Save changes to Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError('Could not get user.');
        return;
      }
      const { error: updateError } = await supabase
        .from('employers')
        .update({
          company_name: editFields.name,
          industry: editFields.industry,
          tags: selectedTags,
          location: editFields.location,
          company_description: editFields.company_description,
          latitude: editFields.latitude,
          longitude: editFields.longitude,
          radius: editFields.radius,
        })
        .eq('id', userData.user.id);
      if (updateError) {
        setError('Failed to save changes: ' + updateError.message);
        return;
      }
      const updatedCompany = {
        company_name: editFields.name,
      industry: editFields.industry,
      tags: selectedTags,
      location: editFields.location,
      company_description: editFields.company_description,
        latitude: editFields.latitude,
        longitude: editFields.longitude,
        radius: editFields.radius,
      };
      onProfileSave(updatedCompany);
      setEditing(false);
      if (refetchProfile) refetchProfile();
    } catch (err: any) {
      setError('Failed to save changes: ' + (err.message || err));
    }
  };

  if (!company) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-xl">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Nav Gradient */}
      <EmployerTopNav
        onCreate={onCreate}
        onEdit={onEdit}
        onUserSettings={() => {}}
        onQuestions={() => {}}
      />
      {/* Main Content Scrollable */}
      <div className="flex-1 w-full flex flex-col items-center pt-40 pb-40 px-2 overflow-y-auto" style={{ minHeight: '0' }}>
        {/* Company Title Section - above the card, centered */}
        {company && (
          <div className="mb-4 flex flex-col items-center">
            <div className="text-3xl font-extrabold text-[#7300FF] text-center">Company Profile</div>
            <div className="text-gray-500 text-sm text-center">This is displayed to candidates when they apply</div>
          </div>
        )}
        {/* Card Container - profile card or edit form */}
        <div className="bg-white rounded-[2rem] shadow-lg border-4 border-gray-300 p-6 w-full max-w-sm flex flex-col gap-3 mx-auto text-sm" style={{marginTop: 'auto', marginBottom: 'auto'}}>
          {editing ? (
            <form className="flex flex-col gap-3" onSubmit={handleSave}>
              <label className="font-semibold text-gray-700 text-lg font-bold">Company Name
                <input name="name" value={editFields.name} onChange={handleFieldChange} className="border rounded-lg px-3 py-1 w-full mt-1 text-sm" />
              </label>
              <label className="font-semibold text-gray-700 text-lg font-bold">Industry
                <select
                  name="industry"
                  value={editFields.industry}
                  onChange={e => {
                    setEditFields({ ...editFields, industry: e.target.value });
                    setSelectedTags([]); // Reset tags when industry changes
                  }}
                  className="border rounded-lg px-3 py-1 w-full mt-1 text-sm"
                >
                  {industryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              {/* Tag Bubbles for selected industry */}
              <div className="mt-2 mb-2">
                <div className="font-semibold text-gray-700 text-lg font-bold mb-1">Tags <span className={selectedTags.length < 3 ? 'text-red-500 text-base font-normal' : 'text-gray-400 text-base font-normal'}>(Pick at least 3, recommended 5+)</span></div>
                <div className="flex flex-wrap gap-2">
                  {selectedIndustry.tags.map(tag => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-4 py-1 rounded-full font-bold text-xs border-2 transition ${selectedTags.includes(tag) ? 'bg-[#984DE0] text-white border-[#984DE0] scale-105' : 'bg-gray-100 text-[#7300FF] border-[#984DE0] hover:bg-[#E9D7FF]'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedTags.length < 3 && <div className="text-xs text-red-500 mt-1">Please select at least 3 tags.</div>}
              </div>
              {/* Map Picker for Location */}
              <label className="font-semibold text-gray-700 text-lg font-bold">Location</label>
              <div className="mb-6">
                <LocationSection
                  location={editFields.location}
                  radius={editFields.radius}
                  latitude={editFields.latitude}
                  longitude={editFields.longitude}
                  onLocationUpdated={handleLocationUpdated}
                />
              </div>
              <label className="font-semibold text-gray-700 text-lg font-bold">Description
                <textarea name="company_description" value={editFields.company_description} onChange={handleFieldChange} className="border rounded-lg px-3 py-1 w-full mt-1 text-lg" rows={2} />
              </label>
              {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
              <button type="submit" className="mt-6 bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold px-4 py-2 rounded-full shadow hover:from-[#7300FF] hover:to-[#984DE0] transition text-sm w-full">Save Changes</button>
            </form>
          ) : company && (
            <>
              {/* Company Name and Industry */}
              <div className="flex items-start justify-between mb-1">
                <div className="text-3xl font-extrabold">{company.company_name}</div>
                <button
                  className="ml-2 px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition text-sm font-semibold"
                  onClick={() => {
                    setEditFields({
                      name: company.company_name,
                      industry: company.industry,
                      tags: (company.tags || []).join(', '),
                      location: company.location,
                      company_description: company.company_description,
                      latitude: company.latitude,
                      longitude: company.longitude,
                      radius: company.radius,
                    });
                    setSelectedTags(company.tags || []);
                    setEditing(true);
                  }}
                  aria-label="Edit"
                >
                  Edit
                </button>
              </div>
              <div className="flex items-center gap-3 text-base mb-2 mt-0">
                <span className="text-gray-500 underline">{company.industry}</span>
                <span className="flex items-center text-gray-700 text-sm">
                  <span role="img" aria-label="location" className="mr-1">📍</span>{company.location}
                </span>
          </div>
              <div className="flex gap-2 flex-wrap mb-2">
                {(company.tags || []).map((tag: string, idx: number) => (
                  <span key={idx} className="bg-[#C7AFFF] text-[#7300FF] font-bold px-4 py-1 rounded-[2rem] text-xs" style={{minWidth: '50px', textAlign: 'center'}}>{tag}</span>
            ))}
          </div>
              {/* Job Offers Section */}
              <div className="mt-4">
                <div className="font-bold text-xl mb-2 text-[#7300FF]">Job Offers</div>
                {Array.isArray(company.jobOffers) && company.jobOffers.length > 0 ? (
                  <JobOffersCollapse jobs={company.jobOffers} />
                ) : (
                  <div className="text-gray-400 text-sm italic">This is where your listings will display.</div>
                )}
            </div>
              <div className="font-bold text-base mt-4 mb-1">Description</div>
              <div className="text-gray-700 text-sm mb-2">{company.company_description}</div>
            </>
          )}
        </div>
      </div>
      {/* Bottom Nav Gradient */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-t-[2rem] p-8 z-10 flex items-center justify-center">
        <div className="w-fit mx-auto bg-white rounded-3xl flex justify-center items-center gap-6 py-3 px-8 shadow-lg border-2 border-gray-400">
          <span className="text-purple-600 font-bold text-xl underline decoration-2 underline-offset-4 transition-all duration-300 transform scale-110">
            Profile
          </span>
          <button
            onClick={onHome}
            className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Home
          </button>
          <button
            onClick={onApplicants}
            className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Applicants
          </button>
        </div>
      </div>
      {/* Subtle refreshing indicator if loading but company is present */}
      {loading && company && (
        <div className="absolute left-0 right-0 top-0 flex justify-center items-center pointer-events-none z-50">
          <div className="mt-4 text-xs text-gray-400 animate-pulse bg-white/80 rounded-full px-4 py-1 shadow">Refreshing...</div>
        </div>
      )}
    </div>
  );
};

// Collapsed Job Offers component
interface JobOffersCollapseProps {
  jobs: any[];
}
const JobOffersCollapse: React.FC<JobOffersCollapseProps> = ({ jobs }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="bg-[#F8F8F8] border-2 border-gray-300 rounded-[1.5rem] shadow flex flex-col px-3 py-2 cursor-pointer transition-all duration-200"
          onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-bold text-black mb-0.5">{job.title}</div>
              <div className="text-gray-500 text-xs">{job.location}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${job.status === 'Open' ? 'bg-green-200 text-green-700' : 'bg-gray-300 text-gray-700'}`}>{job.status}</span>
          </div>
          {expandedId === job.id && (
            <div className="mt-2">
              <div className="text-[#7300FF] font-bold text-xs mb-1">{job.salary}</div>
              {job.fitScore !== undefined && (
                <div className="text-gray-500 text-xs mb-1">Fit Score: <span className="font-bold">{job.fitScore}%</span></div>
              )}
              {job.description && <div className="text-gray-700 text-xs mb-1">{job.description}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EmployerCompanyProfileScreen; 