import React, { useState } from "react";
import { Experience } from "../../types/Profile";
import ExperienceItem from "./ExperienceItem";

interface ExperienceSectionProps {
  experience: Experience[];
  editingExperience: Experience[];
  onUpdate: (id: string, field: keyof Experience, value: any) => void;
  onSave: (updatedExperience: Experience[]) => void;
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experience,
  editingExperience,
  onUpdate,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localExperience, setLocalExperience] = useState<Experience[]>(experience);

  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: ""
    };
    setLocalExperience([...localExperience, newExperience]);
  };

  const removeExperience = (id: string) => {
    setLocalExperience(localExperience.filter(exp => exp.id !== id));
  };

  const handleSave = () => {
    onSave(localExperience);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalExperience(experience);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setLocalExperience(experience);
    setIsEditing(true);
  };

  const handleUpdate = (id: string, field: keyof Experience, value: any) => {
    setLocalExperience(localExperience.map(e =>
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  return (
    <div className="w-full bg-[#F8F8F8] rounded-[2rem] border-4 border-gray-300 pt-5 pb-4 px-6 flex flex-col shadow-lg mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {/* Lightning bolt SVG icon */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#5C1EE2" strokeWidth="2" strokeLinejoin="round"/></svg>
          <h2 className="text-xl font-bold">Experience</h2>
        </div>
        <button onClick={isEditing ? handleCancel : handleEdit} className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 transition-colors" type="button">
          {/* Plus icon */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4V16" stroke="#5C1EE2" strokeWidth="2" strokeLinecap="round"/>
            <path d="M4 10H16" stroke="#5C1EE2" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        </button>
      </div>
      {isEditing && (
        <div className="mb-3">
          <button
            onClick={addExperience}
            className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-black font-semibold hover:bg-purple-200 transition-colors"
          >
            Add Experience
          </button>
        </div>
      )}
      {(isEditing ? localExperience : experience).length === 0 ? (
        <div className="text-gray-400 text-sm mb-2">No experience added yet.</div>
      ) : (
        (isEditing ? localExperience : experience).map((exp) => (
        <ExperienceItem
          key={exp.id}
          experience={exp}
          isEditing={isEditing}
            onUpdate={(field, value) => handleUpdate(exp.id, field, value)}
          onRemove={() => removeExperience(exp.id)}
        />
        ))
      )}
      {isEditing && (
        <div className="flex gap-2 mt-2">
          <button onClick={handleSave} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">Save</button>
          <button onClick={handleCancel} className="px-4 py-2 bg-gray-200 rounded-lg font-semibold">Cancel</button>
        </div>
      )}
    </div>
  );
};

export default ExperienceSection; 