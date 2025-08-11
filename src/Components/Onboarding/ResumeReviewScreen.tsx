import React, { useState } from "react";
import { Experience, Education } from "../../types/Profile";
import ExperienceItem from "../ProfileSections/ExperienceItem";
import EditableSection from "../ProfileSections/EditableSection";
import EducationItem from "../ProfileSections/EducationItem";
import SkillsSection from './ResumeReview/SkillsSection';
import { supabase } from '../../supabaseClient';
import ProfileSection from './ResumeReview/ProfileSection';
import ExperienceSection from './ResumeReview/ExperienceSection';
import EducationSection from './ResumeReview/EducationSection';
import OtherSection from './ResumeReview/OtherSection';

interface ResumeSection {
  title: string;
  fields: { label: string; value: string }[];
}

interface ResumeReviewScreenProps {
  parsedResume?: ResumeSection[];
  rawText?: string;
  parserError?: string | null;
  onContinue: (updatedResume?: ResumeSection[]) => void;
  onBack: () => void;
  onUpdateSection?: (sectionIndex: number, fields: { label: string; value: string }[]) => void;
}

const ResumeReviewScreen: React.FC<ResumeReviewScreenProps> = ({
  parsedResume = [
    { title: "Work Experience", fields: [] },
    { title: "Education", fields: [] },
    { title: "Certifications", fields: [] },
    { title: "Account Information", fields: [] },
    { title: "Other", fields: [] },
  ],
  rawText = "",
  parserError = null,
  onContinue,
  onBack,
  onUpdateSection,
}) => {
  const [localResume, setLocalResume] = useState<ResumeSection[]>(parsedResume);
  const [openSections, setOpenSections] = useState<boolean[]>(
    parsedResume.map((_, i) => i === 0) // First section open by default
  );
  const [isExperienceEditing, setIsExperienceEditing] = React.useState(false);
  const [isEducationEditing, setIsEducationEditing] = React.useState(false);
  const [isSkillsEditing, setIsSkillsEditing] = React.useState(false);
  const [isProfileEditing, setIsProfileEditing] = React.useState(false);
  const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({
    profile: false,
    experience: true,
    education: true,
    skills: true,
    other: true,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFieldChange = (sectionIdx: number, fieldIdx: number, value: string) => {
    const updatedSections = localResume.map((section, i) => {
      if (i !== sectionIdx) return section;
      return {
        ...section,
        fields: section.fields.map((field, j) =>
          j === fieldIdx ? { ...field, value } : field
        ),
      };
    });
    setLocalResume(updatedSections);
    if (onUpdateSection) onUpdateSection(sectionIdx, updatedSections[sectionIdx].fields);
  };

  const toggleSection = (idx: number) => {
    setOpenSections(prev => prev.map((open, i) => (i === idx ? !open : open)));
  };

  // Add date formatting helpers
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return "";
    if (dateString.toLowerCase().includes("present")) return "";
    // If it's just a year, convert to YYYY-01
    if (/^\d{4}$/.test(dateString)) return `${dateString}-01`;
    // If it's Month YYYY, convert to YYYY-MM
    const monthMap: { [key: string]: string } = {
      january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
      july: "07", august: "08", september: "09", october: "10", november: "11", december: "12"
    };
    const match = dateString.match(/([A-Za-z]+)\s*(\d{4})/);
    if (match) {
      const month = monthMap[match[1].toLowerCase()];
      if (month) return `${match[2]}-${month}`;
    }
    // Already in YYYY-MM or fallback
    if (/^\d{4}-\d{2}$/.test(dateString)) return dateString;
    return "";
  };

  const parseDateRange = (dateString: string): { start: string, end: string } => {
    if (!dateString) return { start: '', end: '' };
    if (dateString.includes('–')) {
      const [start, end] = dateString.split('–').map(s => s.trim());
      return { start: formatDateForInput(start), end: formatDateForInput(end) };
    }
    return { start: formatDateForInput(dateString), end: '' };
  };

  function handleExperienceFieldChange(sectionIdx: number, expIdx: number, label: string, value: string) {
    setLocalResume((prev: ResumeSection[]) => {
      const updated = [...prev];
      const section = { ...updated[sectionIdx] };
      // Group, update, and flatten back
      const grouped = groupExperienceFields(section.fields);
      grouped[expIdx][label] = value;
      // Flatten back to fields
      section.fields = grouped.flatMap(exp => Object.entries(exp).map(([label, value]) => ({ label, value: String(value) })));
      updated[sectionIdx] = section;
      if (onUpdateSection) onUpdateSection(sectionIdx, section.fields);
      return updated;
    });
  }

  // Map parsed experience fields to Experience objects
  function parsedFieldsToExperience(fields: { label: string; value: string }[]): Experience[] {
    const grouped: any[] = [];
    let current: any = { id: Date.now().toString() + Math.random(), title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' };
    for (const field of fields) {
      if (/job title/i.test(field.label) && Object.keys(current).length > 0 && (current.title || current.company || current.location || current.description)) {
        grouped.push(current);
        current = { id: Date.now().toString() + Math.random(), title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' };
      }
      if (/job title/i.test(field.label)) current.title = field.value;
      else if (/company/i.test(field.label)) current.company = field.value;
      else if (/location/i.test(field.label)) current.location = field.value;
      else if (/start ?date/i.test(field.label) || /^dates?$/i.test(field.label)) current.startDate = field.value;
      else if (/end ?date/i.test(field.label)) current.endDate = field.value;
      else if (/current/i.test(field.label)) current.current = field.value === 'true';
      else if (/description/i.test(field.label)) current.description = field.value;
    }
    if (current.title || current.company || current.location || current.description) grouped.push(current);
    return grouped as Experience[];
  }

  // Experience section state
  const experienceSectionIdx = localResume.findIndex(s => s.title.toLowerCase() === 'experience');
  const experienceFields = experienceSectionIdx !== -1 ? localResume[experienceSectionIdx].fields : [];
  const [editingExperience, setEditingExperience] = React.useState<Experience[]>(parsedFieldsToExperience(experienceFields));

  function handleExperienceUpdate(id: string, field: keyof Experience, value: any) {
    setEditingExperience(prev => prev.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
    // Also update localResume fields for saving
    const updated = editingExperience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp);
    // Flatten back to fields
    const newFields = updated.flatMap(exp => [
      { label: 'Job Title', value: exp.title },
      { label: 'Company', value: exp.company },
      { label: 'Location', value: exp.location },
      { label: 'Start Date', value: exp.startDate },
      { label: 'End Date', value: exp.endDate },
      { label: 'Current', value: exp.current ? 'true' : 'false' },
      { label: 'Description', value: exp.description },
    ]);
    setLocalResume(prev => prev.map((section, i) => i === experienceSectionIdx ? { ...section, fields: newFields } : section));
    if (onUpdateSection) onUpdateSection(experienceSectionIdx, newFields);
  }

  function handleExperienceRemove(id: string) {
    setEditingExperience(prev => prev.filter(exp => exp.id !== id));
    const updated = editingExperience.filter(exp => exp.id !== id);
    const newFields = updated.flatMap(exp => [
      { label: 'Job Title', value: exp.title },
      { label: 'Company', value: exp.company },
      { label: 'Location', value: exp.location },
      { label: 'Start Date', value: exp.startDate },
      { label: 'End Date', value: exp.endDate },
      { label: 'Current', value: exp.current ? 'true' : 'false' },
      { label: 'Description', value: exp.description },
    ]);
    setLocalResume(prev => prev.map((section, i) => i === experienceSectionIdx ? { ...section, fields: newFields } : section));
    if (onUpdateSection) onUpdateSection(experienceSectionIdx, newFields);
  }

  function handleExperienceAdd() {
    const newExp: Experience = {
      id: Date.now().toString() + Math.random(),
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    setEditingExperience(prev => [...prev, newExp]);
    const updated = [...editingExperience, newExp];
    const newFields = updated.flatMap(exp => [
      { label: 'Job Title', value: exp.title },
      { label: 'Company', value: exp.company },
      { label: 'Location', value: exp.location },
      { label: 'Start Date', value: exp.startDate },
      { label: 'End Date', value: exp.endDate },
      { label: 'Current', value: exp.current ? 'true' : 'false' },
      { label: 'Description', value: exp.description },
    ]);
    setLocalResume(prev => prev.map((section, i) => i === experienceSectionIdx ? { ...section, fields: newFields } : section));
    if (onUpdateSection) onUpdateSection(experienceSectionIdx, newFields);
  }

  // Map parsed education fields to Education objects
  function parsedFieldsToEducation(fields: { label: string; value: string }[]): Education[] {
    const grouped: any[] = [];
    let current: any = { id: Date.now().toString() + Math.random(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' };
    for (const field of fields) {
      if (/school|institution|university|college/i.test(field.label) && Object.keys(current).length > 0 && (current.institution || current.degree || current.field)) {
        grouped.push(current);
        current = { id: Date.now().toString() + Math.random(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' };
      }
      if (/school|institution|university|college/i.test(field.label)) current.institution = field.value;
      else if (/degree/i.test(field.label)) current.degree = field.value;
      else if (/field/i.test(field.label)) current.field = field.value;
      else if (/start ?date/i.test(field.label) || /^dates?$/i.test(field.label)) current.startDate = field.value;
      else if (/end ?date/i.test(field.label)) current.endDate = field.value;
      else if (/gpa/i.test(field.label)) current.gpa = field.value;
    }
    if (current.institution || current.degree || current.field) grouped.push(current);
    return grouped as Education[];
  }

  // Education section state
  const educationSectionIdx = localResume.findIndex(s => s.title.toLowerCase() === 'education');
  const educationFields = educationSectionIdx !== -1 ? localResume[educationSectionIdx].fields : [];
  const [editingEducation, setEditingEducation] = React.useState<Education[]>(parsedFieldsToEducation(educationFields));

  function handleEducationUpdate(id: string, field: keyof Education, value: string) {
    setEditingEducation(prev => prev.map(edu => edu.id === id ? { ...edu, [field]: value } : edu));
    // Also update localResume fields for saving
    const updated = editingEducation.map(edu => edu.id === id ? { ...edu, [field]: value } : edu);
    // Flatten back to fields
    const newFields = updated.flatMap(edu => [
      { label: 'Institution', value: edu.institution },
      { label: 'Degree', value: edu.degree },
      { label: 'Field', value: edu.field },
      { label: 'Start Date', value: edu.startDate },
      { label: 'End Date', value: edu.endDate },
      { label: 'GPA', value: edu.gpa || '' },
    ]);
    setLocalResume(prev => prev.map((section, i) => i === educationSectionIdx ? { ...section, fields: newFields } : section));
    if (onUpdateSection) onUpdateSection(educationSectionIdx, newFields);
  }

  function handleEducationRemove(id: string) {
    setEditingEducation(prev => prev.filter(edu => edu.id !== id));
    const updated = editingEducation.filter(edu => edu.id !== id);
    const newFields = updated.flatMap(edu => [
      { label: 'Institution', value: edu.institution },
      { label: 'Degree', value: edu.degree },
      { label: 'Field', value: edu.field },
      { label: 'Start Date', value: edu.startDate },
      { label: 'End Date', value: edu.endDate },
      { label: 'GPA', value: edu.gpa || '' },
    ]);
    setLocalResume(prev => prev.map((section, i) => i === educationSectionIdx ? { ...section, fields: newFields } : section));
    if (onUpdateSection) onUpdateSection(educationSectionIdx, newFields);
  }

  function handleEducationAdd() {
    const newEdu: Education = {
      id: Date.now().toString() + Math.random(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: ''
    };
    setEditingEducation(prev => [...prev, newEdu]);
    const updated = [...editingEducation, newEdu];
    const newFields = updated.flatMap(edu => [
      { label: 'Institution', value: edu.institution },
      { label: 'Degree', value: edu.degree },
      { label: 'Field', value: edu.field },
      { label: 'Start Date', value: edu.startDate },
      { label: 'End Date', value: edu.endDate },
      { label: 'GPA', value: edu.gpa || '' },
    ]);
    setLocalResume(prev => prev.map((section, i) => i === educationSectionIdx ? { ...section, fields: newFields } : section));
    if (onUpdateSection) onUpdateSection(educationSectionIdx, newFields);
  }

  // Parse skills from fields
  function parsedFieldsToSkills(fields: { label: string; value: string }[]): string[] {
    // Find all fields labeled 'Skills' or similar, split by comma/semicolon/bullet/line
    return fields
      .filter(f => /skills?/i.test(f.label))
      .flatMap(f => f.value.split(/[,;•\n]/).map(s => s.trim()).filter(Boolean));
  }

  // Skills section state
  const skillsSectionIdx = localResume.findIndex(s => s.title.toLowerCase() === 'skills');
  const skillsFields = skillsSectionIdx !== -1 ? localResume[skillsSectionIdx].fields : [];
  const [editingSkills, setEditingSkills] = React.useState<string[]>(parsedFieldsToSkills(skillsFields));

  function handleSkillsSave(updatedSkills: string[]) {
    setEditingSkills(updatedSkills);
    // Update localResume fields for saving
    const newFields = [{ label: 'Skills', value: updatedSkills.join(', ') }];
    setLocalResume(prev => prev.map((section, i) => i === skillsSectionIdx ? { ...section, fields: newFields } : section));
    if (onUpdateSection) onUpdateSection(skillsSectionIdx, newFields);
    setIsSkillsEditing(false);
  }

  function handleSkillsEdit() {
    setEditingSkills(parsedFieldsToSkills(skillsFields));
    setIsSkillsEditing(true);
  }

  function handleSkillsCancel() {
    setEditingSkills(parsedFieldsToSkills(skillsFields));
    setIsSkillsEditing(false);
  }

  // Parse profile fields
  function parsedFieldsToProfile(fields: { label: string; value: string }[]): Record<string, string> {
    const profile: Record<string, string> = {};
    for (const field of fields) {
      profile[field.label] = field.value;
    }
    return profile;
  }
  const profileSectionIdx = localResume.findIndex(s => s.title.toLowerCase() === 'profile');
  const profileFields = profileSectionIdx !== -1 ? localResume[profileSectionIdx].fields : [];
  const [editingProfile, setEditingProfile] = React.useState<Record<string, string>>(parsedFieldsToProfile(profileFields));

  function handleProfileFieldChange(label: string, value: string) {
    setEditingProfile(prev => ({ ...prev, [label]: value }));
  }
  function handleProfileSave() {
    // Update localResume fields for saving
    const newFields = Object.entries(editingProfile).map(([label, value]) => ({ label, value }));
    setLocalResume(prev => prev.map((section, i) => i === profileSectionIdx ? { ...section, fields: newFields } : section));
    if (onUpdateSection) onUpdateSection(profileSectionIdx, newFields);
    setIsProfileEditing(false);
  }
  function handleProfileEdit() {
    setEditingProfile(parsedFieldsToProfile(profileFields));
    setIsProfileEditing(true);
  }
  function handleProfileCancel() {
    setEditingProfile(parsedFieldsToProfile(profileFields));
    setIsProfileEditing(false);
  }

  function toggleSectionCollapse(title: string) {
    setCollapsedSections(prev => ({ ...prev, [title]: !prev[title] }));
  }

  // Parse 'Other' fields from localResume
  function parsedFieldsToOther(localResume: ResumeSection[]): { label: string; value: string }[] {
    // Collect fields from sections with title 'other', 'activities', 'organizations', or any not matched to main categories
    const mainSections = ['profile', 'experience', 'education', 'skills'];
    return localResume
      .filter(s => !mainSections.includes(s.title.toLowerCase()))
      .flatMap(s => s.fields);
  }
  const [isOtherEditing, setIsOtherEditing] = React.useState(false);
  const otherFields = parsedFieldsToOther(localResume);
  const [editingOther, setEditingOther] = React.useState<{ label: string; value: string }[]>(otherFields);
  function handleOtherFieldChange(idx: number, value: string) {
    setEditingOther(prev => prev.map((f, i) => i === idx ? { ...f, value } : f));
  }
  function handleOtherSave() {
    // Update localResume: find all 'other', 'activities', 'organizations' sections and update their fields
    let idx = 0;
    setLocalResume(prev => prev.map(section => {
      if (['other', 'activities', 'organizations'].includes(section.title.toLowerCase())) {
        const count = section.fields.length;
        const newFields = editingOther.slice(idx, idx + count);
        idx += count;
        return { ...section, fields: newFields };
      }
      return section;
    }));
    setIsOtherEditing(false);
  }
  function handleOtherEdit() {
    setEditingOther(parsedFieldsToOther(localResume));
    setIsOtherEditing(true);
  }
  function handleOtherCancel() {
    setEditingOther(parsedFieldsToOther(localResume));
    setIsOtherEditing(false);
  }

  // Helper to ensure YYYY-MM-DD format for Supabase date columns
  function toDateYYYYMMDD(date: string): string | null {
    if (!date) return null;
    // If already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    // If YYYY-MM, add -01
    if (/^\d{4}-\d{2}$/.test(date)) return date + '-01';
    // If just year, add -01-01
    if (/^\d{4}$/.test(date)) return date + '-01-01';
    // If Month YYYY, convert to YYYY-MM-01
    const monthMap: { [key: string]: string } = {
      january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
      july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
    };
    const match = date.match(/([A-Za-z]+)\s*(\d{4})/);
    if (match) {
      const month = monthMap[match[1].toLowerCase()];
      if (month) return `${match[2]}-${month}-01`;
    }
    return null;
  }

  async function handleSaveAndContinue() {
    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const isAuthenticated = userData && userData.user;
      if (!isAuthenticated) {
        setLoading(false);
        setError('You must be signed in to save your profile. Please sign in and try again.');
        return;
      }
      // Map localResume to profile, education, experience
      const profileSection = localResume.find(s => s.title.toLowerCase() === 'profile');
      const profileFields = profileSection ? Object.fromEntries(profileSection.fields.map(f => [f.label.toLowerCase().replace(/ /g, '_'), f.value])) : {};
      const user = userData.user;
      const profileData = {
        id: user.id,
        email: profileFields.email || user.email,
        name: profileFields['full_name'] || profileFields['name'] || '',
        location: profileFields.location || '',
        radius: profileFields.radius ? parseInt(profileFields.radius) : null,
        skills: localResume.find(s => s.title.toLowerCase() === 'skills')?.fields.map(f => f.value) || [],
        interests: localResume.find(s => s.title.toLowerCase() === 'interests')?.fields.map(f => f.value) || [],
        phone: profileFields.phone || '',
      };
      // Upsert profile
      const { error: profileError } = await supabase.from('profiles').upsert([profileData], { onConflict: 'id' });
      if (profileError) throw profileError;
      // Education
      const educationSection = localResume.find(s => s.title.toLowerCase() === 'education');
      let educationList = educationSection ? groupEducationFields(educationSection.fields).map(e => ({ ...e, profile_id: user.id })) : [];
      educationList = educationList.map(e => ({
        ...e,
        start_date: toDateYYYYMMDD(e.start_date),
        end_date: toDateYYYYMMDD(e.end_date)
      }));
      if (educationList.length) {
        const { error: eduError } = await supabase.from('education').upsert(educationList, { onConflict: 'id' });
        if (eduError) throw eduError;
      }
      // Experience
      const experienceSection = localResume.find(s => s.title.toLowerCase() === 'experience');
      let experienceList = experienceSection ? groupExperienceFields(experienceSection.fields).map(e => ({ ...e, profile_id: user.id })) : [];
      experienceList = experienceList.map(e => {
        const { current, field, ...rest } = e;
        let is_current = null;
        const isCurrentRaw = e.is_current;
        if (typeof isCurrentRaw === 'boolean') {
          is_current = isCurrentRaw;
        } else if (typeof isCurrentRaw === 'string') {
          if (isCurrentRaw === 'true') {
            is_current = true;
          } else if (isCurrentRaw === 'false') {
            is_current = false;
          }
        }
        return {
          ...rest,
          start_date: toDateYYYYMMDD(e.start_date),
          end_date: toDateYYYYMMDD(e.end_date),
          is_current
        };
      });
      if (experienceList.length) {
        const { error: expError } = await supabase.from('experience').upsert(experienceList, { onConflict: 'id' });
        if (expError) throw expError;
      }
      setLoading(false);
      onContinue(localResume);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || String(err));
    }
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 z-10 w-full px-4">
      <div className="w-full max-w-sm h-[80vh] bg-white rounded-3xl shadow-lg border-4 border-gray-300 p-6 flex flex-col items-center mt-6 mb-8">
        <div className="w-full flex flex-col gap-6 overflow-y-auto">
          {parserError && (
            <div className="w-full bg-red-100 text-red-700 rounded-lg p-3 text-xs mb-2">{parserError}</div>
          )}
          <ProfileSection
            fields={profileFields}
            isEditing={isProfileEditing}
            editingProfile={editingProfile}
            onFieldChange={handleProfileFieldChange}
            onEdit={handleProfileEdit}
            onSave={handleProfileSave}
            onCancel={handleProfileCancel}
            collapsed={collapsedSections['profile']}
            toggleCollapse={() => toggleSectionCollapse('profile')}
          />
          <ExperienceSection
            experiences={editingExperience}
            isEditing={isExperienceEditing}
            onAdd={handleExperienceAdd}
            onEdit={() => setIsExperienceEditing(true)}
            onSave={() => setIsExperienceEditing(false)}
            onCancel={() => {
              setIsExperienceEditing(false);
              setEditingExperience(parsedFieldsToExperience(experienceFields));
            }}
            onUpdate={handleExperienceUpdate}
            onRemove={handleExperienceRemove}
            collapsed={collapsedSections['experience']}
            toggleCollapse={() => toggleSectionCollapse('experience')}
          />
          <EducationSection
            educations={editingEducation}
            isEditing={isEducationEditing}
            onAdd={handleEducationAdd}
            onEdit={() => setIsEducationEditing(true)}
            onSave={() => setIsEducationEditing(false)}
            onCancel={() => {
              setIsEducationEditing(false);
              setEditingEducation(parsedFieldsToEducation(educationFields));
            }}
            onUpdate={handleEducationUpdate}
            onRemove={handleEducationRemove}
            collapsed={collapsedSections['education']}
            toggleCollapse={() => toggleSectionCollapse('education')}
          />
          <SkillsSection
            skills={parsedFieldsToSkills(skillsFields)}
            editingSkills={editingSkills}
            isEditing={isSkillsEditing}
            onEdit={handleSkillsEdit}
            onSave={handleSkillsSave}
            onCancel={handleSkillsCancel}
            onAdd={() => {}}
            onChange={setEditingSkills}
            collapsed={collapsedSections['skills']}
            toggleCollapse={() => toggleSectionCollapse('skills')}
          />
          <OtherSection
            fields={otherFields}
            isEditing={isOtherEditing}
            editingOther={editingOther}
            onFieldChange={handleOtherFieldChange}
            onEdit={handleOtherEdit}
            onSave={handleOtherSave}
            onCancel={handleOtherCancel}
            collapsed={collapsedSections['other']}
            toggleCollapse={() => toggleSectionCollapse('other')}
          />
        </div>
        <div className="flex w-full gap-2 mt-4">
        <button
            className="flex-1 py-2 rounded-full bg-gray-100 text-[#A100FF] font-semibold border border-[#A100FF] hover:bg-purple-50 transition-colors"
            onClick={onBack}
        >
            Back
        </button>
        <button
            className="flex-1 py-2 rounded-full bg-[#A100FF] text-white font-semibold shadow-lg hover:bg-[#6C00FF] transition-colors"
            onClick={handleSaveAndContinue}
            disabled={loading}
        >
            {loading ? 'Saving...' : 'Save & Continue'}
        </button>
        </div>
        {error && <div className="w-full bg-red-100 text-red-700 rounded-lg p-3 text-xs mb-2">{error}</div>}
      </div>
    </div>
  );
};

function SkillsBubbleEditor({ skills, onChange }: { skills: string[], onChange: (skills: string[]) => void }) {
  const [input, setInput] = React.useState('');
  const addSkill = () => {
    const newSkill = input.trim();
    if (newSkill && !skills.includes(newSkill)) {
      onChange([...skills, newSkill]);
      setInput('');
    }
  };
  const removeSkill = (skill: string) => {
    onChange(skills.filter(s => s !== skill));
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {skills.map((skill, i) => (
          <span
            key={i}
            className="bg-purple-200 text-purple-700 font-bold text-xs rounded-full px-3 py-1 flex items-center gap-1 cursor-pointer"
            onClick={() => removeSkill(skill)}
            title="Remove skill"
          >
            {skill} <span className="ml-1 text-purple-700 hover:text-purple-900">×</span>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addSkill(); }}
          placeholder="Add a skill..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0 text-xs"
        />
        <button
          type="button"
          onClick={addSkill}
          className="px-3 py-1 bg-gray-200 rounded-lg font-semibold hover:bg-purple-100 transition-colors text-xs"
        >Add</button>
      </div>
    </div>
  );
}

const EDUCATION_COLUMNS = [
  'institution', 'degree', 'field', 'start_date', 'end_date', 'gpa', 'location', 'created_at', 'id', 'profile_id'
];

function groupEducationFields(fields: { label: string; value: string }[]): any[] {
  const grouped: any[] = [];
  let current: any = {};
  for (const field of fields) {
    if (/school|institution|university|college/i.test(field.label) && Object.keys(current).length > 0) {
      grouped.push(current);
      current = {};
    }
    const key = field.label.toLowerCase().replace(/ /g, '_');
    // Map common variants to DB columns
    if (key === 'school' || key === 'university' || key === 'college') current['institution'] = field.value;
    else if (key === 'graduation_start' || key === 'start') current['start_date'] = field.value;
    else if (key === 'graduation_end' || key === 'end') current['end_date'] = field.value;
    else if (key === 'graduation') {
      // Try to split date range
      const [start, end] = field.value.split(/[–-]/).map(s => s.trim());
      if (start) current['start_date'] = start;
      if (end) current['end_date'] = end;
    }
    else if (EDUCATION_COLUMNS.includes(key)) {
      current[key] = field.value;
    }
  }
  if (Object.keys(current).length > 0) grouped.push(current);
  return grouped;
}

function groupExperienceFields(fields: { label: string; value: string }[]): any[] {
  // Group fields into experience entries by detecting Job Title fields as new entries
  const grouped: any[] = [];
  let current: any = {};
  for (const field of fields) {
    if (/job title/i.test(field.label) && Object.keys(current).length > 0) {
      grouped.push(current);
      current = {};
    }
    const key = field.label.toLowerCase().replace(/ /g, '_');
    // Map to DB columns
    if (key === 'job_title' || key === 'title') current['job_title'] = field.value;
    else if (key === 'company') current['company'] = field.value;
    else if (key === 'location') current['location'] = field.value;
    else if (key === 'dates' || key === 'start_date') current['start_date'] = field.value;
    else if (key === 'end_date') current['end_date'] = field.value;
    else if (key === 'description') current['description'] = field.value;
    else if (key === 'is_current' || key === 'current') current['is_current'] = field.value === 'true';
    else current[key] = field.value;
  }
  if (Object.keys(current).length > 0) grouped.push(current);
  return grouped;
}

// Auto-resizing textarea
function AutoResizeTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [props.value]);
  return <textarea ref={ref} {...props} rows={1} style={{ minHeight: 32, ...props.style }} />;
}

export default ResumeReviewScreen; 