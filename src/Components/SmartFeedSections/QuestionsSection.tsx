import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from '../../supabaseClient';

const QUESTIONS = [
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

const TABLE = 'user_essential_questions';

function CustomDropdown({ value, options, onChange, disabled, onOpenChange }: { value: string; options: string[]; onChange: (v: string) => void; disabled?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number; width: number } | null>(null);

  useEffect(() => {
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

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
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

const QuestionsSection: React.FC = () => {
  const [answers, setAnswers] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowId, setRowId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeStates, setFadeStates] = useState<number[]>(QUESTIONS.map(() => 1));
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Fade effect for rolodex
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const centerY = containerRect.top + containerRect.height / 2;
    const newFades = Array.from(container.children)
      .filter((child: any) => child.nodeType === 1)
      .map((child: any) => {
        const rect = child.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const dist = Math.abs(cardCenter - centerY);
        const fadeDist = containerRect.height / 1.3;
        return Math.max(0.15, 1 - dist / fadeDist);
      });
    setFadeStates(newFades);
  }, []);

  useEffect(() => {
    async function fetchOrCreateRow() {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setLoading(false);
          return;
        }
        const user_id = userData.user.id;
        
        // Try to fetch existing row
        let { data, error } = await supabase
          .from(TABLE)
          .select('*')
          .eq('user_id', user_id)
          .single();
        
        if (error) {
          console.error('[QuestionsSection] Error fetching existing row:', error);
          
          // If table doesn't exist or other critical error, create a local state
          if (error.code === '406' || error.code === '42P01') {
            console.warn('[QuestionsSection] Table may not exist, using local state only');
            setRowId('local_' + user_id);
            setAnswers({});
            setLoading(false);
            return;
          }
        }
        
        if (!data) {
          // Create row if not exists
          const { data: newRow, error: insertError } = await supabase
            .from(TABLE)
            .insert([{ user_id }])
            .select()
            .single();
          
          if (insertError) {
            console.error('[QuestionsSection] Error creating new row:', insertError);
            // Fallback to local state if insert fails
            setRowId('local_' + user_id);
            setAnswers({});
            setLoading(false);
            return;
          }
          
          data = newRow;
        }
        
        if (data) {
          setRowId(data.id);
          setAnswers(data);
        }
      } catch (error) {
        console.error('[QuestionsSection] Unexpected error:', error);
        setAnswers({});
      }
      setLoading(false);
    }
    fetchOrCreateRow();
  }, []);

  // Helper to trigger fade update after answers load
  useEffect(() => {
    setTimeout(() => handleScroll(), 50);
  }, [loading, handleScroll]);

  useEffect(() => {
    handleScroll(); // initial
    const container = scrollRef.current;
    if (!container) return;
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  const handleChange = async (key: string, value: string) => {
    setSaving(true);
    setAnswers((prev: any) => ({ ...prev, [key]: value }));
    
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
        console.error('[QuestionsSection] Error updating answer:', error);
        // Continue with local state even if database update fails
      }
    } catch (error) {
      console.error('[QuestionsSection] Unexpected error updating answer:', error);
    }
    
    setSaving(false);
  };

  if (loading) {
    return <div className="w-full flex items-center justify-center py-8 text-gray-400 text-base">Loading...</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[18px] font-bold text-[#6C2BD7]">Essential Questions</h2>
      </div>
      <div className="relative" style={{maxHeight: '312px', minHeight: '312px'}}>
        <div
          ref={scrollRef}
          className="questions-scroll-container flex flex-col gap-3 overflow-y-auto pr-1 scrollbar-hide snap-y snap-mandatory"
          style={{scrollBehavior: 'smooth', maxHeight: '312px', minHeight: '312px'}} 
          onScroll={handleScroll}
        >
          {QUESTIONS.map((q, i) => {
            const answered = !!answers[q.key];
            const dropdownOpen = openDropdownIndex === i;
            return (
              <div
                key={q.key}
                className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-start gap-2 snap-center transition-opacity duration-300"
                style={dropdownOpen ? { opacity: 1, zIndex: 999, position: 'relative', pointerEvents: 'auto', isolation: 'isolate' } : { opacity: fadeStates[i] ?? 1 }}
              >
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <span className="whitespace-normal text-sm font-medium text-gray-800 leading-snug">{q.label}</span>
                  <span className={`mt-1 ml-1 w-2.5 h-2.5 rounded-full ${answered ? 'bg-green-500' : 'bg-red-500'}`} title={answered ? 'Answered' : 'Required'}></span>
                </div>
                <div className="min-w-[120px]">
                  <CustomDropdown
                    value={answers[q.key] || ''}
                    options={q.options}
                    onChange={v => handleChange(q.key, v)}
                    disabled={saving}
                    onOpenChange={open => setOpenDropdownIndex(open ? i : null)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestionsSection;

// Add to InterestsSection.css or global CSS:
// .animate-fadein { animation: fadein 0.15s; }
// @keyframes fadein { from { opacity: 0; transform: translateY(-4px);} to { opacity: 1; transform: none; } } 