import React, { useState } from "react";
import { Experience, Education } from "../../types/Profile";
import ExperienceItem from "../ProfileSections/ExperienceItem";
import EducationItem from "../ProfileSections/EducationItem";
import { v4 as uuidv4 } from 'uuid';

interface ExperienceScreenProps {
  onContinue: (info: { experience: Experience[]; education: Education[] }) => void;
  onBack: () => void;
  prefill?: any[] | null;
}

const emptyExperience = (): Experience => ({
  id: uuidv4(),
  title: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  description: ""
});

const emptyEducation = (): Education => ({
  id: uuidv4(),
  institution: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
  gpa: ""
});

const ExperienceScreen: React.FC<ExperienceScreenProps> = ({ onContinue, onBack, prefill }) => {
  const [experience, setExperience] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);

  React.useEffect(() => {
    if (prefill && Array.isArray(prefill)) {
      const expSection = prefill.find(s => s.title && s.title.toLowerCase() === 'experience');
      if (expSection && Array.isArray(expSection.fields)) {
        // Group fields into Experience objects
        const grouped: Experience[] = [];
        let current: any = { id: uuidv4(), title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' };
        for (const field of expSection.fields) {
          if (/job[_ ]?title/i.test(field.label) && Object.keys(current).length > 0 && (current.title || current.company)) {
            grouped.push(current);
            current = { id: uuidv4(), title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' };
          }
          if (/job[_ ]?title/i.test(field.label)) current.title = field.value;
          else if (/company/i.test(field.label)) current.company = field.value;
          else if (/location/i.test(field.label)) current.location = field.value;
          else if (/start/i.test(field.label)) current.startDate = field.value;
          else if (/end/i.test(field.label)) current.endDate = field.value;
          else if (/current/i.test(field.label)) current.current = field.value === 'true';
          else if (/description/i.test(field.label)) current.description = field.value;
        }
        if (current.title || current.company) grouped.push(current);
        setExperience(grouped);
      }
      const eduSection = prefill.find(s => s.title && s.title.toLowerCase() === 'education');
      if (eduSection && Array.isArray(eduSection.fields)) {
        // Group fields into Education objects
        const grouped: Education[] = [];
        let current: any = { id: uuidv4(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' };
        for (const field of eduSection.fields) {
          if (/institution|school|university|college/i.test(field.label) && Object.keys(current).length > 0 && (current.institution || current.degree)) {
            grouped.push(current);
            current = { id: uuidv4(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' };
          }
          if (/institution|school|university|college/i.test(field.label)) current.institution = field.value;
          else if (/degree/i.test(field.label)) current.degree = field.value;
          else if (/field/i.test(field.label)) current.field = field.value;
          else if (/start/i.test(field.label)) current.startDate = field.value;
          else if (/end/i.test(field.label)) current.endDate = field.value;
          else if (/gpa/i.test(field.label)) current.gpa = field.value;
        }
        if (current.institution || current.degree) grouped.push(current);
        setEducation(grouped);
      }
    }
  }, [prefill]);

  // Experience handlers
  const handleAddOrSaveExperience = () => {
    if (editingExpId === null) {
      const newExp = emptyExperience();
      setExperience(prev => [...prev, newExp]);
      setEditingExpId(newExp.id);
    } else {
      setEditingExpId(null);
    }
  };
  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setExperience(prev => prev.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };
  const removeExperience = (id: string) => {
    setExperience(prev => prev.filter(exp => exp.id !== id));
    setEditingExpId(null);
  };

  // Education handlers
  const handleAddOrSaveEducation = () => {
    if (editingEduId === null) {
      const newEdu = emptyEducation();
      setEducation(prev => [...prev, newEdu]);
      setEditingEduId(newEdu.id);
    } else {
      setEditingEduId(null);
    }
  };
  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEducation(prev => prev.map(edu => edu.id === id ? { ...edu, [field]: value } : edu));
  };
  const removeEducation = (id: string) => {
    setEducation(prev => prev.filter(edu => edu.id !== id));
    setEditingEduId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({ experience, education });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Top gradient bar */}
      <div className="absolute left-0 top-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-b-[2rem] h-32 transition-all duration-500" />
      {/* Bottom gradient bar */}
      <div className="absolute left-0 bottom-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-t-[2rem] h-32 transition-all duration-500" />
      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 z-10 w-full px-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border-4 border-gray-250 p-6 flex flex-col items-center mt-16 mb-8 overflow-y-auto">
        <h2 className="text-2xl font-bold text-black mb-2 text-center w-full">Your Experience</h2>
        <p className="text-base text-gray-500 mb-6 text-center w-full">Add your work and education history</p>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 mb-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-lg font-bold text-black">Work Experience</label>
              <button
                type="button"
                onClick={handleAddOrSaveExperience}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${editingExpId ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
              >
                {editingExpId ? 'Save' : 'Add'}
              </button>
            </div>
            {experience.length === 0 && <div className="text-gray-400 text-sm mb-2">No experience added yet.</div>}
            {experience.map(exp => (
              <div key={exp.id} className="relative">
                <ExperienceItem
                  experience={exp}
                  isEditing={editingExpId === exp.id}
                  onUpdate={(field, value) => updateExperience(exp.id, field, value)}
                  onRemove={() => removeExperience(exp.id)}
                />
                {editingExpId !== exp.id && (
                  <button
                    type="button"
                    onClick={() => setEditingExpId(exp.id)}
                    className="absolute top-2 right-4 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-200"
                  >
                    Edit
                  </button>
                )}
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-lg font-bold text-black">Education</label>
              <button
                type="button"
                onClick={handleAddOrSaveEducation}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${editingEduId ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
              >
                {editingEduId ? 'Save' : 'Add'}
              </button>
            </div>
            {education.length === 0 && <div className="text-gray-400 text-sm mb-2">No education added yet.</div>}
            {education.map(edu => (
              <div key={edu.id} className="relative">
                <EducationItem
                  education={edu}
                  isEditing={editingEduId === edu.id}
                  onUpdate={(field, value) => updateEducation(edu.id, field, value)}
                  onRemove={() => removeEducation(edu.id)}
                />
                {editingEduId !== edu.id && (
                  <button
                    type="button"
                    onClick={() => setEditingEduId(edu.id)}
                    className="absolute top-2 right-4 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-200"
                  >
                    Edit
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-[1rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold shadow-lg mt-2 disabled:opacity-60"
          >
            Continue
          </button>
        </form>
        <button
          className="text-[#7300FF] underline text-base mt-4"
          onClick={onBack}
        >
          Back to previous step
        </button>
      </div>
      </div>
    </div>
  );
};

export default ExperienceScreen; 