import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import LocationSection from '../SmartFeedSections/LocationSection';
import 'rc-slider/assets/index.css';
import Slider from 'rc-slider';
import { Range } from 'react-range';
import { FaChevronDown, FaChevronUp, FaBookmark } from 'react-icons/fa';
import { STANDARD_TAGS } from '../../data/tags';
import EmployerTopNav from './EmployerTopNav';
import CreateNewListingAddressSection from './CreateNewListingAddressSection';
import JOB_TITLE_SUGGESTIONS from '../../data/jobTitles';
const JOB_TITLE_SUGGESTIONS_TYPED: string[] = JOB_TITLE_SUGGESTIONS;
import ReactDOM from 'react-dom';
const minSalary = 15;
const maxSalary = 24;
const units = ["hour", "month", "year"];
// Salary distribution bins for each unit
const salaryDistributions = {
  hour: [
    { label: '10-11', min: 10, max: 11, percent: 7.57 },
    { label: '11-12', min: 11, max: 12, percent: 5.13 },
    { label: '12-13', min: 12, max: 13, percent: 3.00 },
    { label: '13-14', min: 13, max: 14, percent: 6.41 },
    { label: '14-15', min: 14, max: 15, percent: 10.96 },
    { label: '15-16', min: 15, max: 16, percent: 16.46 },
    { label: '16-17', min: 16, max: 17, percent: 19.85 },
    { label: '17-18', min: 17, max: 18, percent: 12.84 },
    { label: '18-19', min: 18, max: 19, percent: 8.71 },
    { label: '19-20', min: 19, max: 20, percent: 6.08 },
    { label: '20-21', min: 20, max: 21, percent: 4.29 },
    { label: '21-22', min: 21, max: 22, percent: 3.76 },
    { label: '22-23', min: 22, max: 23, percent: 3.02 },
    { label: '23-24', min: 23, max: 24, percent: 4.28 },
  ],
  month: [
    { label: '1600–1863', min: 1600, max: 1863, percent: 7.04 },
    { label: '1864–2127', min: 1864, max: 2127, percent: 5.29 },
    { label: '2128–2390', min: 2128, max: 2390, percent: 3.98 },
    { label: '2391–2654', min: 2391, max: 2654, percent: 5.28 },
    { label: '2655–2918', min: 2655, max: 2918, percent: 5.62 },
    { label: '2919–3181', min: 2919, max: 3181, percent: 6.31 },
    { label: '3182–3445', min: 3182, max: 3445, percent: 4.49 },
    { label: '3446–3708', min: 3446, max: 3708, percent: 3.61 },
    { label: '3709–3972', min: 3709, max: 3972, percent: 7.03 },
    { label: '3973–4236', min: 3973, max: 4236, percent: 9.99 },
    { label: '4237–4499', min: 4237, max: 4499, percent: 10.46 },
    { label: '4500–4763', min: 4500, max: 4763, percent: 7.07 },
    { label: '4764–5026', min: 4764, max: 5026, percent: 5.21 },
    { label: '5027–5290', min: 5027, max: 5290, percent: 4.51 },
    { label: '5291–5554', min: 5291, max: 5554, percent: 3.96 },
    { label: '5555–5817', min: 5555, max: 5817, percent: 2.66 },
    { label: '5818–6081', min: 5818, max: 6081, percent: 1.55 },
    { label: '6082–6344', min: 6082, max: 6344, percent: 2.12 },
    { label: '6345–6608', min: 6345, max: 6608, percent: 1.17 },
    { label: '6609–6872', min: 6609, max: 6872, percent: 1.73 },
    { label: '6873–7135', min: 6873, max: 7135, percent: 1.29 },
    { label: '7136–7399', min: 7136, max: 7399, percent: 1.04 },
  ],
  year: [
    { label: '19200–22365', min: 19200, max: 22365, percent: 1.04 },
    { label: '22366–25530', min: 22366, max: 25530, percent: 1.29 },
    { label: '25531–28696', min: 25531, max: 28696, percent: 1.98 },
    { label: '28697–31861', min: 28697, max: 31861, percent: 3.28 },
    { label: '31862–35027', min: 31862, max: 35027, percent: 3.62 },
    { label: '35028–38192', min: 35028, max: 38192, percent: 4.31 },
    { label: '38193–41358', min: 38193, max: 41358, percent: 4.49 },
    { label: '41359–44523', min: 41359, max: 44523, percent: 5.61 },
    { label: '44524–47688', min: 44524, max: 47688, percent: 6.03 },
    { label: '47689–50854', min: 47689, max: 50854, percent: 6.99 },
    { label: '50855–54019', min: 50855, max: 54019, percent: 8.46 },
    { label: '54020–57184', min: 54020, max: 57184, percent: 9.07 },
    { label: '57185–60350', min: 57185, max: 60350, percent: 8.21 },
    { label: '60351–63515', min: 60351, max: 63515, percent: 7.51 },
    { label: '63516–66680', min: 63516, max: 66680, percent: 5.96 },
    { label: '66681–69846', min: 66681, max: 69846, percent: 4.66 },
    { label: '69847–73011', min: 69847, max: 73011, percent: 3.55 },
    { label: '73012–76176', min: 73012, max: 76176, percent: 3.12 },
    { label: '76177–79342', min: 76177, max: 79342, percent: 2.17 },
    { label: '79343–82507', min: 79343, max: 82507, percent: 1.73 },
    { label: '82508–85673', min: 82508, max: 85673, percent: 1.29 },
    { label: '85674–88838', min: 85674, max: 88838, percent: 1.04 },
  ],
};
const unitConfig = {
  hour: { min: 10, max: 24, step: 1, format: (v: number) => `$${v}`, label: 'per hour' },
  month: { min: 1600, max: 7399, step: 1, format: (v: number) => `$${Math.round(v)}`, label: 'per month' },
  year: { min: 19200, max: 88838, step: 1, format: (v: number) => `$${Math.round(v)}`, label: 'per year' },
};
// Helper to interpolate the distribution into 15 bins
function getHistogramBins(unit: 'hour'|'month'|'year', numBins = 15) {
  const bins = [];
  const dist = salaryDistributions[unit];
  const { min, max } = unitConfig[unit];
  const binWidth = (max - min) / numBins;
  let distIdx = 0;
  let distStart = dist[0].min;
  let distEnd = dist[0].max;
  let distPercent = dist[0].percent;
  let distRange = distEnd - distStart;
  let usedPercent = 0;
  for (let i = 0; i < numBins; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    // Find which dist bin this falls into
    while (binStart >= distEnd && distIdx < dist.length - 1) {
      usedPercent += distPercent;
      distIdx++;
      distStart = dist[distIdx].min;
      distEnd = dist[distIdx].max;
      distPercent = dist[distIdx].percent;
      distRange = distEnd - distStart;
    }
    // Proportion of this bin in the current dist bin
    const overlap = Math.max(0, Math.min(binEnd, distEnd) - Math.max(binStart, distStart));
    const percent = overlap > 0 && distRange > 0 ? (overlap / distRange) * distPercent : 0;
    bins.push(percent);
  }
  // Normalize so max is 100 for visual
  const maxVal = Math.max(...bins, 1);
  return bins.map(v => (v / maxVal) * 100);
}

interface CreateNewListingScreenProps {
  onHome: () => void;
  onProfile: () => void;
  onApplicants: () => void;
  onQuestions?: () => void;
}

const jobTypes = [
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'Remote', value: 'remote' },
  { label: 'On Site', value: 'onsite' },
];

const LOCAL_STORAGE_KEY = 'inProgressJobListing';

const CreateNewListingScreen: React.FC<CreateNewListingScreenProps> = ({ onHome, onProfile, onApplicants, onQuestions }) => {
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [jobType, setJobType] = useState('onsite'); // Changed default to 'onsite'
  const [salaryUnit, setSalaryUnit] = useState<'hour'|'month'|'year'>('hour'); // Changed default to 'hour'
  const [salary, setSalary] = useState<[number, number]>([unitConfig['hour'].min, unitConfig['hour'].max]); // Updated to match hour default
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [fields, setFields] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.fields || {
          title: '',
          location: '',
          latitude: 40.7128,
          longitude: -74.006,
          description: '',
          requirements: '',
        };
      } catch {
        return {
          title: '',
          location: '',
          latitude: 40.7128,
          longitude: -74.006,
          description: '',
          requirements: '',
        };
      }
    }
    return {
    title: '',
    location: '',
    latitude: 40.7128,
    longitude: -74.006,
    description: '',
    requirements: '',
    };
  });
  const [companyName, setCompanyName] = useState<string>('');
  const [tags, setTags] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.tags || [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [showAddTagInput, setShowAddTagInput] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [requirements, setRequirements] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.requirements || [{ type: 'Minimum', value: '' }];
      } catch {
        return [{ type: 'Minimum', value: '' }];
      }
    }
    return [{ type: 'Minimum', value: '' }];
  });
  // Restore jobType, salaryUnit, salary
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.jobType) setJobType(parsed.jobType);
        if (parsed.salaryUnit) setSalaryUnit(parsed.salaryUnit);
        if (parsed.salary) setSalary(parsed.salary);
      } catch {}
    }
  }, []);

  // Save to localStorage on every change
  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ fields, tags, requirements, jobType, salaryUnit, salary })
    );
  }, [fields, tags, requirements, jobType, salaryUnit, salary]);

  useEffect(() => {
    // Fetch company name from Supabase on mount
    const fetchCompanyName = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) return;
      const { data: employerData, error: employerError } = await supabase
        .from('employers')
        .select('company_name, location')
        .eq('id', userData.user.id)
        .single();
      if (!employerError && employerData && employerData.company_name) {
        setCompanyName(employerData.company_name);
      }
    };
    fetchCompanyName();
  }, []);
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };
  useEffect(() => {
    if (!fields.title) {
      setAutoTags([]);
      return;
    }
    const titleWords = fields.title.toLowerCase().split(/\s+/);
    const matchingTags = STANDARD_TAGS.filter((tag: string) => 
      titleWords.some((word: string) => tag.toLowerCase().includes(word) || word.includes(tag.toLowerCase()))
    );
    setAutoTags(matchingTags.slice(0, 3));
  }, [fields.title]);

  const handleTagToggle = (tag: string) => {
    setTags((prev: string[]) => prev.includes(tag) ? prev.filter((t: string) => t !== tag) : [...prev, tag]);
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags((prev: string[]) => [...prev, newTagInput.trim()]);
      setNewTagInput('');
      setShowAddTagInput(false);
    }
  };

  const handleAddTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setShowAddTagInput(false);
      setNewTagInput('');
    }
  };

  const renderSalaryBars = () => {
    const bins = getHistogramBins(salaryUnit);
    return (
      <div className="relative w-full h-24 flex flex-row items-end z-0 min-w-0 mb-2">
        {bins.map((percent, i) => {
          const binMin = unitConfig[salaryUnit].min + i * ((unitConfig[salaryUnit].max - unitConfig[salaryUnit].min) / 15);
          const binMax = binMin + ((unitConfig[salaryUnit].max - unitConfig[salaryUnit].min) / 15);
          const inRange = binMax > salary[0] && binMin < salary[1];
          return (
            <div
              key={i}
              style={{
                height: `${Math.max(percent, 4)}%`,
                width: `calc((100% - 14 * 2px) / 15)`,
                minWidth: '2px',
                marginLeft: i === 0 ? 0 : '2px',
                marginRight: 0,
                background: inRange ? 'linear-gradient(180deg, rgba(162,89,255,0.7) 0%, rgba(108,43,215,0.7) 100%)' : 'rgba(209,213,219,0.5)',
                borderTopLeftRadius: '6px',
                borderTopRightRadius: '6px',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                alignSelf: 'flex-end',
                transition: 'height 0.2s, background 0.2s',
              }}
            />
          );
        })}
      </div>
    );
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate minimum tags requirement
    if (tags.length < 3) {
      setCreateError('Please add at least 3 tags before creating the listing');
      return;
    }
    
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('User not authenticated');
      }

      const { data: employerData, error: employerError } = await supabase
        .from('employers')
        .select('company_name, location')
        .eq('id', userData.user.id)
        .single();

      if (employerError || !employerData) {
        throw new Error('Could not fetch employer data');
      }

      // Format requirements for storage
      const formattedRequirements = requirements
        .filter((req: { type: string; value: string; extra?: string; extra2?: string }) => req.value && req.value.trim() !== '')
        .map((req: { type: string; value: string; extra?: string; extra2?: string }) => {
          let formatted = `${req.type}: ${req.value}`;
          if (req.extra) {
            if (req.value === 'Language Proficiency') {
              formatted += ` (${req.extra})`;
              if (req.extra2) formatted += ` - ${req.extra2}`;
            } else if (req.value === 'Certification') {
              formatted += ` (${req.extra})`;
            } else if (req.value === 'Years of Experience') {
              formatted += ` (${req.extra} years${req.extra2 ? ` in ${req.extra2}` : ''})`;
            } else {
              formatted += ` (${req.extra})`;
            }
          }
          return formatted;
        });

      const jobData = {
        employer_id: userData.user.id,
        title: fields.title,
        description: fields.description,
        location: fields.location,
        latitude: fields.latitude,
        longitude: fields.longitude,
        salary_min: salary[0],
        salary_max: salary[1],
        salary_unit: salaryUnit,
        job_type: jobType,
        requirements: formattedRequirements.join(', '),
        tags: tags.join(', '),
        status: 'Open',
        company_name: employerData.company_name,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('jobs')
        .insert([jobData]);

      if (insertError) {
        throw new Error(`Failed to create job: ${insertError.message}`);
      }

      setCreateSuccess('Job listing created successfully!');
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      
      // Reset form
      setFields({
        title: '',
        location: '',
        latitude: 40.7128,
        longitude: -74.006,
        description: '',
        requirements: '',
      });
      setTags([]);
      setRequirements([{ type: 'Minimum', value: '' }]);
      setJobType('onsite');
      setSalaryUnit('hour');
      setSalary([unitConfig['hour'].min, unitConfig['hour'].max]);

      setTimeout(() => {
        onHome();
      }, 1500);

    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setCreating(false);
    }
  };

  const [jobTitleFocused, setJobTitleFocused] = useState(false);
  const [filteredJobTitles, setFilteredJobTitles] = useState<string[]>([]);
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const jobTitleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!jobTitleFocused || !fields.title) {
      setFilteredJobTitles([]);
      return;
    }
    const filtered = JOB_TITLE_SUGGESTIONS_TYPED.filter(title =>
      title.toLowerCase().includes(fields.title.toLowerCase())
    ).slice(0, 10);
    setFilteredJobTitles(filtered);
  }, [fields.title, jobTitleFocused]);

  useEffect(() => {
    const handleScroll = () => setJobTitleFocused(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Requirements section as fill-in-the-blanks dropdowns
  const REQUIREMENT_TYPES = ['Minimum', 'Preferred'];
  const REQUIREMENT_OPTIONS = [
    'High School Diploma',
    "Associate's Degree",
    "Bachelor's Degree",
    "Master's Degree",
    "PhD or Doctorate",
    'Years of Experience',
    'Certification',
    'Language Proficiency',
    'Portfolio',
    'Other',
  ];
  const handleRequirementChange = (idx: number, field: 'type' | 'value' | 'extra' | 'extra2', val: string) => {
    setRequirements((reqs: Array<{ type: string; value: string; extra?: string; extra2?: string }>) => reqs.map((r: { type: string; value: string; extra?: string; extra2?: string }, i: number) => i === idx ? { ...r, [field]: val } : r));
  };
  const handleAddRequirement = () => {
    setRequirements((reqs: Array<{ type: string; value: string; extra?: string; extra2?: string }>) => [...reqs, { type: 'Minimum', value: '' }]);
  };
  const handleRemoveRequirement = (idx: number) => {
    setRequirements((reqs: Array<{ type: string; value: string; extra?: string; extra2?: string }>) => reqs.filter((_: { type: string; value: string; extra?: string; extra2?: string }, i: number) => i !== idx));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-between">
      {/* Top Navigation Bar */}
      <EmployerTopNav
        onCreate={onHome}
        onUserSettings={onProfile}
        onQuestions={onQuestions}
      />
      {/* Prominent, centered title above the card */}
      <h1 className="text-2xl font-extrabold text-center text-[#7300FF] mt-40 mb-8 w-full">
        {tab === 'edit' ? 'Create New Job Listing' : 'Job Listing Preview'}
      </h1>
      {/* Main content: show form or preview based on state */}
      {tab === 'edit' ? (
        <div className="pt-0 pb-40 px-2 w-full max-w-sm mx-auto">
          <div className="bg-white rounded-[2rem] shadow-lg border-4 border-gray-300 p-6 w-full flex flex-col gap-6">
            <form className="flex flex-col gap-4" onSubmit={handleCreateJob}>
              {/* Job Title */}
              <label className="font-semibold text-gray-700">Job Title <span className="text-red-500">*</span>
                <input
                  name="title"
                  value={fields.title}
                  onChange={handleFieldChange}
                  className="border rounded-lg px-4 py-2 w-full mt-1"
                  placeholder="e.g. Frontend Developer"
                  autoComplete="off"
                  onFocus={() => {
                    setJobTitleFocused(true);
                    if (jobTitleInputRef.current) {
                      const rect = jobTitleInputRef.current.getBoundingClientRect();
                      setDropdownPos({ left: rect.left, top: rect.bottom, width: rect.width });
                    }
                  }}
                  onBlur={() => setTimeout(() => setJobTitleFocused(false), 150)}
                  ref={jobTitleInputRef}
                />
                {jobTitleFocused && filteredJobTitles.length > 0 && dropdownPos && ReactDOM.createPortal(
                  <ul
                    className="z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    style={{
                      position: 'fixed',
                      left: dropdownPos.left,
                      top: dropdownPos.top,
                      width: dropdownPos.width,
                    }}
                  >
                    {filteredJobTitles.map((title) => (
                      <li
                        key={title}
                        className="px-4 py-2 cursor-pointer hover:bg-purple-50 text-gray-900"
                        onMouseDown={() => {
                          setFields({ ...fields, title });
                          setJobTitleFocused(false);
                          jobTitleInputRef.current?.blur();
                        }}
                      >
                        {title}
                      </li>
                    ))}
                  </ul>,
                  document.body
                )}
              </label>
              {/* Location (Address Picker) */}
              <label className="font-semibold text-gray-700">Location <span className="text-red-500">*</span></label>
              <div className="mb-4">
                <CreateNewListingAddressSection
                  address={fields.location}
                  latitude={fields.latitude}
                  longitude={fields.longitude}
                  onAddressUpdated={(address, lat, lng) => setFields({ ...fields, location: address, latitude: lat, longitude: lng })}
                />
              </div>
              {/* Type of Job - Centered */}
              <div className="flex justify-center gap-2 mt-2 mb-4">
                  {jobTypes.map(type => (
                    <button
                      type="button"
                      key={type.value}
                      onClick={() => setJobType(type.value)}
                      className={`px-3 py-1 rounded-full font-bold border-2 transition text-sm ${jobType === type.value ? 'bg-[#984DE0] text-white border-[#984DE0] scale-105' : 'bg-gray-100 text-[#7300FF] border-[#984DE0] hover:bg-[#E9D7FF]'}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              {/* Short Description section with AI button inside the textarea box */}
              <div className="relative w-full mb-4">
                <label className="font-semibold text-gray-700">Short Description <span className="text-red-500">*</span></label>
                <textarea
                  name="description"
                  value={fields.description}
                  onChange={handleFieldChange}
                  className="border rounded-lg px-4 py-2 w-full mt-1 pr-24"
                  placeholder="Brief summary of the job..."
                  rows={5}
                  style={{ resize: 'none', minHeight: '120px' }}
                />
                <button
                  type="button"
                  className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full border-2 border-[#984DE0] bg-white text-[#7300FF] font-bold shadow transition text-xs flex items-center gap-1 hover:bg-[#F3E8FF] hover:border-[#7300FF] hover:text-[#7300FF]"
                  onClick={() => setFields((f: typeof fields) => ({ ...f, description: 'This is a sample AI-generated job description. Replace this with your own or use our AI to generate a unique summary!' }))}
                  style={{ zIndex: 2 }}
                >
                  <span role="img" aria-label="AI" className="text-base">🤖</span>
                  Write one for me
                </button>
              </div>
              {/* Salary Range Section (copied design) */}
              <label className="font-semibold text-gray-700">Salary Range <span className="text-red-500">*</span></label>
                <div className="flex gap-2 items-center mb-2 mt-2">
                  {units.map(u => (
                    <button
                      key={u}
                      type="button"
                      className={`px-3 py-1 rounded-full font-bold border-2 transition text-xs ${salaryUnit === u ? 'bg-[#984DE0] text-white border-[#984DE0]' : 'bg-gray-100 text-[#7300FF] border-[#984DE0] hover:bg-[#E9D7FF]'}`}
                      onClick={() => {
                        setSalaryUnit(u as 'hour'|'month'|'year');
                        setSalary([unitConfig[u as 'hour'|'month'|'year'].min, unitConfig[u as 'hour'|'month'|'year'].max]);
                      }}
                    >
                      /{u === 'hour' ? 'hr' : u === 'month' ? 'mo' : 'yr'}
                    </button>
                  ))}
                </div>
                <div className="relative w-full max-w-[420px] flex flex-col items-center mx-auto pt-4 px-2 min-w-0">
                  {/* Histogram bars positioned to end at slider line */}
                  {renderSalaryBars()}
                  {/* Range slider */}
                  <div className="relative w-full h-8 flex items-end z-10">
                    <Range
                      step={unitConfig[salaryUnit].step}
                      min={unitConfig[salaryUnit].min}
                      max={unitConfig[salaryUnit].max}
                      values={salary}
                      onChange={values => setSalary([values[0], values[1]])}
                      renderTrack={({ props, children }) => (
                        <div
                          {...props}
                          className="absolute left-0 bottom-0 w-full h-1 bg-gray-200/60 rounded-full"
                          style={{ ...props.style }}
                        >
                          <div
                            className="absolute bg-gradient-to-r from-[#A259FF] to-[#6C2BD7] h-1 rounded-full"
                            style={{
                              left: `${((salary[0] - unitConfig[salaryUnit].min) / (unitConfig[salaryUnit].max - unitConfig[salaryUnit].min)) * 100}%`,
                              width: `${((salary[1] - salary[0]) / (unitConfig[salaryUnit].max - unitConfig[salaryUnit].min)) * 100}%`,
                              top: 0,
                              height: '100%',
                            }}
                          />
                          {children}
                        </div>
                      )}
                      renderThumb={({ props }) => (
                        <div 
                          {...props} 
                          className="w-5 h-5 bg-white border-2 border-[#984DE0] rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" 
                        />
                      )}
                    />
                  </div>
                  {/* Salary display */}
                  <div className="text-center mt-2">
                    <span className="text-lg font-bold text-[#7300FF]">
                      {unitConfig[salaryUnit].format(salary[0])} - {unitConfig[salaryUnit].format(salary[1])} {unitConfig[salaryUnit].label}
                    </span>
                  </div>
                </div>
              {/* Tags */}
              <div className="mb-4">
                <label className="font-semibold text-gray-700">Tags <span className="text-red-500">*</span> <span className="text-sm text-gray-500">(Minimum 3 required)</span></label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag: string, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className="bg-purple-100 text-[#7300FF] font-bold px-3 py-1 rounded-full text-sm hover:bg-purple-200 transition"
                    >
                      {tag} ×
                    </button>
                  ))}
                  {autoTags.filter(tag => !tags.includes(tag)).map((tag: string, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className="bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded-full text-sm hover:bg-purple-100 hover:text-[#7300FF] transition"
                    >
                      + {tag}
                    </button>
                  ))}
                  {showAddTagInput ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={handleAddTagKeyPress}
                        className="border rounded-lg px-2 py-1 text-sm w-24"
                        placeholder="New tag"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="bg-[#7300FF] text-white font-bold px-2 py-1 rounded-full text-sm hover:bg-[#984DE0] transition"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddTagInput(false);
                          setNewTagInput('');
                        }}
                        className="bg-gray-300 text-gray-600 font-bold px-2 py-1 rounded-full text-sm hover:bg-gray-400 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddTagInput(true)}
                      className="bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded-full text-sm hover:bg-purple-100 hover:text-[#7300FF] transition"
                    >
                      + Add Tag
                    </button>
                  )}
                </div>
                {tags.length < 3 && (
                  <p className="text-red-500 text-sm mt-1">Please add at least 3 tags</p>
                )}
              </div>
              {/* Requirements */}
              <label className="font-semibold text-gray-700">Requirements <span className="text-red-500">*</span></label>
              <div className="flex flex-col gap-2 mb-4">
                {requirements.map((req: { type: string; value: string; extra?: string; extra2?: string }, idx: number) => {
                  const showFieldOfStudy = [
                    "Bachelor's Degree",
                    "Master's Degree",
                    "PhD or Doctorate",
                    "Associate's Degree"
                  ].includes(req.value);
                  const showYears = req.value === 'Years of Experience';
                  const showLanguage = req.value === 'Language Proficiency';
                  const showCertification = req.value === 'Certification';
                  return (
                    <div key={idx} className="flex gap-2 items-center flex-wrap">
                      <select
                        className="border rounded-lg px-2 py-1 text-sm"
                        value={req.type}
                        onChange={e => handleRequirementChange(idx, 'type', e.target.value)}
                      >
                        {REQUIREMENT_TYPES.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <select
                        className="border rounded-lg px-2 py-1 text-sm"
                        value={req.value}
                        onChange={e => handleRequirementChange(idx, 'value', e.target.value)}
                      >
                        <option value="" disabled>Select requirement</option>
                        {REQUIREMENT_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      {showFieldOfStudy && (
                        <input
                          type="text"
                          className="border rounded-lg px-2 py-1 text-sm"
                          placeholder="Field of Study"
                          value={req.extra || ''}
                          onChange={e => handleRequirementChange(idx, 'extra', e.target.value)}
                          style={{ minWidth: 120 }}
                        />
                      )}
                      {showYears && (
                        <>
                          <input
                            type="number"
                            min={0}
                            className="border rounded-lg px-2 py-1 text-sm"
                            placeholder="Years"
                            value={req.extra || ''}
                            onChange={e => handleRequirementChange(idx, 'extra', e.target.value)}
                            style={{ width: 80 }}
                          />
                          {req.extra && (
                            <input
                              type="text"
                              className="border rounded-lg px-2 py-1 text-sm"
                              placeholder="Type of Experience"
                              value={req.extra2 || ''}
                              onChange={e => handleRequirementChange(idx, 'extra2', e.target.value)}
                              style={{ minWidth: 120 }}
                            />
                          )}
                        </>
                      )}
                      {showLanguage && (
                        <>
                          <input
                            type="text"
                            className="border rounded-lg px-2 py-1 text-sm"
                            placeholder="What Language"
                            value={req.extra || ''}
                            onChange={e => handleRequirementChange(idx, 'extra', e.target.value)}
                            style={{ minWidth: 120 }}
                          />
                          {req.extra && (
                            <select
                              className="border rounded-lg px-2 py-1 text-sm"
                              value={req.extra2 || ''}
                              onChange={e => handleRequirementChange(idx, 'extra2', e.target.value)}
                            >
                              <option value="" disabled>How Proficient</option>
                              <option value="Basic">Basic</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                              <option value="Native">Native</option>
                            </select>
                          )}
                        </>
                      )}
                      {showCertification && (
                        <input
                          type="text"
                          className="border rounded-lg px-2 py-1 text-sm"
                          placeholder="What Certification"
                          value={req.extra || ''}
                          onChange={e => handleRequirementChange(idx, 'extra', e.target.value)}
                          style={{ minWidth: 120 }}
                        />
                      )}
                      {requirements.length > 1 && (
                        <button type="button" className="text-red-500 text-xs font-bold ml-1" onClick={() => handleRemoveRequirement(idx)}>Remove</button>
                      )}
                    </div>
                  );
                })}
                <button type="button" className="text-[#7300FF] text-xs font-bold mt-1 self-start" onClick={handleAddRequirement}>+ Add Requirement</button>
              </div>
              {createError && <div className="text-red-500 text-sm mb-2">{createError}</div>}
              {createSuccess && <div className="text-green-600 text-sm mb-2">{createSuccess}</div>}
              <div className="flex flex-row gap-4 mt-4">
                <button type="submit" disabled={creating || tags.length < 3} className="bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold px-6 py-2 rounded-full shadow hover:from-[#7300FF] hover:to-[#984DE0] transition disabled:opacity-60">
                {creating ? 'Creating...' : 'Create Listing'}
              </button>
                <button type="button" className="bg-gray-200 text-[#7300FF] font-bold px-6 py-2 rounded-full shadow hover:bg-gray-300 transition" onClick={() => setTab('preview')}>
                  Preview
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full flex flex-col items-center justify-center pb-40 px-2">
          {tab === 'preview' && (
          <div className="bg-white rounded-3xl shadow-lg border-4 border-gray-300 p-6 w-full max-w-sm flex flex-col mx-auto relative">
            {/* Bookmark Icon */}
            <div className="absolute top-4 right-4">
              <FaBookmark className="text-gray-400 text-xl" />
            </div>
            {/* Header: Title and Company */}
            <div className="flex justify-between items-start mb-4 flex-shrink-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{fields.title || 'Job Title'}</h1>
                <p className="text-base text-gray-500 underline mb-2">{companyName || 'Company Name'}</p>
              </div>
            </div>
            {/* Tags - Horizontal Scrollable */}
            <div className="mb-4 flex-shrink-0">
              {tags.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {tags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="bg-purple-100 text-[#7300FF] text-sm font-bold px-4 py-1.5 rounded-full whitespace-nowrap flex-shrink-0"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-400">No tags</span>
              )}
            </div>
            {/* Salary and Location */}
            <div className="mb-4 flex-shrink-0">
              <p className="text-[#7300FF] font-semibold text-lg">
                {unitConfig[salaryUnit].format(salary[0])} - {unitConfig[salaryUnit].format(salary[1])} {unitConfig[salaryUnit].label}
              </p>
              <p className="text-sm text-gray-500">📍 {(() => {
                if (!fields.location) return 'Location';
                const parts = fields.location.split(',').map((s: string) => s.trim()).filter((s: string) => Boolean(s));
                return parts.length > 0 ? parts[parts.length - 1] : fields.location;
              })()}</p>
            </div>
            {/* Description */}
            <p className="text-sm text-gray-700 mb-4">
              {fields.description || 'Short job description...'}
            </p>
            {/* Requirements */}
            <div className="mb-4">
              <h2 className="font-bold text-gray-900 mb-2 text-base">Requirements:</h2>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {requirements.map((req: { type: string; value: string; extra?: string; extra2?: string }, idx: number) => (
                  <li key={idx}>
                    {req.type}: {req.value}
                    {req.value === 'Years of Experience' && req.extra ? ` (${req.extra} years${req.extra2 ? ` in ${req.extra2}` : ''})` : ''}
                    {req.value === 'Language Proficiency' && req.extra ? ` (${req.extra}${req.extra2 ? ` - ${req.extra2}` : ''})` : ''}
                    {req.value === 'Certification' && req.extra ? ` (${req.extra})` : ''}
                    {req.value !== 'Years of Experience' && req.value !== 'Language Proficiency' && req.value !== 'Certification' && req.extra ? ` (${req.extra})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          )}
            <button type="button" className="bg-gray-200 text-[#7300FF] font-bold px-6 py-2 rounded-full shadow hover:bg-gray-300 transition mt-4" onClick={() => setTab('edit')}>
              Back to Edit
            </button>
        </div>
      )}
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
          <button
            onClick={onApplicants}
            className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Applicants
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNewListingScreen; 