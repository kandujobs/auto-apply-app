import React, { useState } from "react";
import { Education } from "../../types/Profile";
import EditableSection from "./EditableSection";
import EducationItem from "./EducationItem";

interface EducationSectionProps {
  education: Education[];
  editingEducation: Education[];
  onUpdate: (id: string, field: keyof Education, value: string) => void;
  onSave: (updatedEducation: Education[]) => void;
}

const EducationSection: React.FC<EducationSectionProps> = ({
  education,
  editingEducation,
  onUpdate,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localEducation, setLocalEducation] = useState<Education[]>(education);

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: ""
    };
    setLocalEducation([...localEducation, newEducation]);
  };

  const removeEducation = (id: string) => {
    setLocalEducation(localEducation.filter(edu => edu.id !== id));
  };

  const handleSave = () => {
    onSave(localEducation);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalEducation(education);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setLocalEducation(education);
    setIsEditing(true);
  };

  const handleUpdate = (id: string, field: keyof Education, value: string) => {
    setLocalEducation((localEducation || []).map(e =>
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  return (
    <div className="w-full bg-[#F8F8F8] rounded-[2rem] border-4 border-gray-300 pt-5 pb-4 px-6 flex flex-col shadow-lg mb-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {/* New graduation cap SVG icon */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 7.5L12 3L22 7.5L12 12L2 7.5Z" stroke="#5C1EE2" strokeWidth="2" strokeLinejoin="round"/><path d="M6 10.5V15.5C6 17.1569 8.68629 18.5 12 18.5C15.3137 18.5 18 17.1569 18 15.5V10.5" stroke="#5C1EE2" strokeWidth="2" strokeLinejoin="round"/></svg>
          <h2 className="text-xl font-bold">Education</h2>
        </div>
        <button onClick={isEditing ? handleCancel : handleEdit} className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 transition-colors" type="button">
          {/* Plus icon instead of pencil */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4V16" stroke="#5C1EE2" strokeWidth="2" strokeLinecap="round"/>
            <path d="M4 10H16" stroke="#5C1EE2" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        </button>
      </div>
      {isEditing && (
        <div className="mb-3">
          <button
            onClick={addEducation}
            className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-black font-semibold hover:bg-purple-200 transition-colors"
          >
            Add Education
          </button>
        </div>
      )}
      {(isEditing ? localEducation : education).length === 0 ? (
        <div className="text-gray-400 text-sm mb-2">No education added yet.</div>
      ) : (
        ((isEditing ? localEducation : education) || []).map((edu) => (
        <EducationItem
          key={edu.id}
          education={edu}
          isEditing={isEditing}
            onUpdate={(field, value) => handleUpdate(edu.id, field, value)}
          onRemove={() => removeEducation(edu.id)}
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

export default EducationSection; 