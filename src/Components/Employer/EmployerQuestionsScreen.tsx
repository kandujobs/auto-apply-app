import React, { useState, useEffect } from 'react';
import EmployerTopNav from './EmployerTopNav';
import { supabase } from '../../supabaseClient';
import ReactDOM from 'react-dom';

function CustomDropdown({ value, options, onChange, disabled, onOpenChange }: { value: string; options: string[]; onChange: (v: string) => void; disabled?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = React.useState<{ left: number; top: number; width: number } | null>(null);

  React.useEffect(() => {
    if (onOpenChange) onOpenChange(open);
    if (open) {
      const handleScroll = () => setOpen(false);
      window.addEventListener('scroll', handleScroll, { passive: true });
      const scrollContainer = ref.current?.closest('.questions-scroll-container');
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      }
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (scrollContainer) {
          scrollContainer.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  React.useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownPos({ left: rect.left, top: rect.bottom, width: rect.width });
    } else {
      setDropdownPos(null);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative w-full select-none">
      <button
        type="button"
        className={`w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-2 text-base font-normal shadow-sm transition focus:outline-none ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${open ? 'z-20' : ''}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        tabIndex={0}
        style={{ boxShadow: open ? '0 2px 8px 0 rgba(0,0,0,0.10)' : undefined, borderColor: open ? '#E5E7EB' : '#E5E7EB' }}
      >
        <span className={`truncate ${!value ? 'text-gray-400' : 'text-gray-900'}`}>{value || 'Select an answer'}</span>
        <svg className={`ml-2 w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && dropdownPos && ReactDOM.createPortal(
        <div
          className="bg-white border border-gray-200 rounded-lg shadow-lg animate-fadein"
          style={{
            position: 'fixed',
            left: dropdownPos.left,
            top: dropdownPos.top,
            width: dropdownPos.width,
            opacity: 1,
            zIndex: 99999,
            background: 'white',
            pointerEvents: 'auto',
          }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              className={`px-4 py-2 text-base hover:bg-purple-50 cursor-pointer ${value === opt ? 'text-purple-700 font-semibold' : 'text-gray-900'}`}
              onMouseDown={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

interface EmployerQuestionsScreenProps {
  goHome: () => void;
  goProfile: () => void;
  goApplicants: () => void;
  goQuestions?: () => void;
  goCreate?: () => void;
  onUserSettings?: () => void;
}

const TABLE = 'employer_essential_questions';

const staticQuestionKeys = [
  'authorized_to_work',
  'require_sponsorship',
  'convicted_felony',
  'start_availability',
  'pre_employment_screening',
  'willing_to_relocate',
  'gender_identity',
  'pronouns',
  'race_ethnicity',
];

const staticQuestionsList = [
  {
    key: 'authorized_to_work',
    label: 'Are you authorised to work in the United States?',
    options: ['Yes', 'No'],
  },
  {
    key: 'require_sponsorship',
    label: 'Will you now or in the future require sponsorship to work in the United States?',
    options: ['Yes', 'No'],
  },
  {
    key: 'convicted_felony',
    label: 'Have you ever been convicted of a felony?',
    options: ['Yes', 'No', 'Prefer not to say'],
  },
  {
    key: 'start_availability',
    label: 'When can you start a new job?',
    options: ['Immediately', 'Within 2 weeks', 'Within a month', 'Other'],
  },
  {
    key: 'pre_employment_screening',
    label: 'Are you willing to conduct any sort of pre-employment screening that is required?',
    options: ['Yes', 'No', 'Depends on screening'],
  },
  {
    key: 'willing_to_relocate',
    label: 'Are you willing to relocate for a job?',
    options: ['Yes', 'No', 'Maybe'],
  },
  {
    key: 'gender_identity',
    label: 'What gender do you identify as?',
    options: ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'],
  },
  {
    key: 'pronouns',
    label: 'What are your desired pronouns?',
    options: ['He/Him', 'She/Her', 'They/Them', 'Other', 'Prefer not to say'],
  },
  {
    key: 'race_ethnicity',
    label: 'Which race or ethnicity best describes you?',
    options: [
      'American Indian or Alaska Native',
      'Asian',
      'Black or African American',
      'Hispanic or Latino',
      'Native Hawaiian or Other Pacific Islander',
      'White',
      'Two or more races',
      'Other',
      'Prefer not to say',
    ],
  },
];

const EmployerQuestionsScreen: React.FC<EmployerQuestionsScreenProps> = ({ goHome, goProfile, goApplicants, goQuestions, goCreate, onUserSettings }) => {
  const [staticAnswers, setStaticAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowId, setRowId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrCreateRow() {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setLoading(false);
          return;
        }
        const employer_id = userData.user.id;
        
        let { data, error } = await supabase
          .from(TABLE)
          .select('*')
          .eq('employer_id', employer_id)
          .single();
        
        if (error) {
          console.error('[EmployerQuestionsScreen] Error fetching existing row:', error);
          
          // If table doesn't exist or other critical error, create a local state
          if (error.code === '406' || error.code === '42P01') {
            console.warn('[EmployerQuestionsScreen] Table may not exist, using local state only');
            setRowId('local_' + employer_id);
            setStaticAnswers({});
            setLoading(false);
            return;
          }
        }
        
        if (!data) {
          const { data: newRow, error: insertError } = await supabase
            .from(TABLE)
            .insert([{ employer_id }])
            .select()
            .single();
          
          if (insertError) {
            console.error('[EmployerQuestionsScreen] Error creating new row:', insertError);
            // Fallback to local state if insert fails
            setRowId('local_' + employer_id);
            setStaticAnswers({});
            setLoading(false);
            return;
          }
          
          data = newRow;
        }
        
        if (data) {
          setRowId(data.id);
          // Populate staticAnswers from columns
          const answers: { [key: string]: string } = {};
          staticQuestionKeys.forEach(key => {
            answers[key] = data[key] || '';
          });
          setStaticAnswers(answers);
        }
      } catch (error) {
        console.error('[EmployerQuestionsScreen] Unexpected error:', error);
        setStaticAnswers({});
      }
      setLoading(false);
    }
    fetchOrCreateRow();
  }, []);

  const handleStaticAnswerChange = async (key: string, value: string) => {
    setSaving(true);
    setStaticAnswers(prev => ({ ...prev, [key]: value }));
    
    if (!rowId) {
      setSaving(false);
      return;
    }
    
    // If using local state, don't try to save to database
    if (rowId.startsWith('local_')) {
      setSaving(false);
      return;
    }
    
    try {
      const { error } = await supabase
        .from(TABLE)
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('id', rowId);
      
      if (error) {
        console.error('[EmployerQuestionsScreen] Error updating answer:', error);
        // Continue with local state even if database update fails
      }
    } catch (error) {
      console.error('[EmployerQuestionsScreen] Unexpected error updating answer:', error);
    }
    
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Top Nav Gradient */}
      <div className="fixed top-0 left-0 w-full z-20">
        <EmployerTopNav 
          onHome={goHome}
          onQuestions={goQuestions}
          onUserSettings={onUserSettings || goProfile}
          onApplicants={goApplicants}
          onCreate={goCreate}
        />
      </div>
      <div className="max-w-md mx-auto pt-40 pb-40 relative z-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold mb-6 text-center">Essential Questions</h1>
          {/* Progress indicator */}
          {(() => {
            const answeredCount = staticQuestionsList.filter(q => staticAnswers[q.key]).length;
            const totalCount = staticQuestionsList.length;
            const isComplete = answeredCount === totalCount;
            return (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 mx-auto ${isComplete ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                <span>{answeredCount} out of {totalCount} answered</span>
                {isComplete && <span className="text-green-600">✓</span>}
              </div>
            );
          })()}
          {/* Concise info box for employers */}
          <div className="bg-purple-50 border border-purple-200 text-purple-800 rounded-xl px-4 py-3 mb-6 text-sm text-center w-[350px] mx-auto">
            Filter applicants: Only users who match your answers will see your job.
          </div>
          <ul className="flex flex-col gap-4 mt-6">
            {/* Static essential questions */}
            {staticQuestionsList.map((q) => (
              <li key={q.key} className="bg-white rounded-xl shadow-sm px-4 py-3 border border-gray-200 flex flex-col gap-2 w-[350px] mx-auto">
                <div className="flex items-center justify-between">
                  <div className="text-gray-900 font-medium mb-1">{q.label}</div>
                  {/* Status indicator */}
                  <div className={`w-3 h-3 rounded-full ${staticAnswers[q.key] ? 'bg-green-500' : 'bg-red-500'}`} title={staticAnswers[q.key] ? 'Answered' : 'Not answered'}></div>
                </div>
                <CustomDropdown
                  value={staticAnswers[q.key] || ''}
                  options={q.options}
                  onChange={(v: string) => handleStaticAnswerChange(q.key, v)}
                  disabled={saving}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Bottom Nav Gradient */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-t-[2rem] p-8 z-20 flex items-center justify-center">
        <div className="w-fit mx-auto bg-white rounded-3xl flex justify-center items-center gap-6 py-3 px-8 shadow-lg border-2 border-gray-400">
          <button
            onClick={goProfile}
            className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Profile
          </button>
          <button
            onClick={goHome}
            className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Home
          </button>
          <button
            onClick={goApplicants}
            className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Applicants
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployerQuestionsScreen; 