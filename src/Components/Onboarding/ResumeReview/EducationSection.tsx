import React from "react";
import EducationItem from "../../ProfileSections/EducationItem";

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  location?: string;
}

interface EducationSectionProps {
  educations: Education[];
  isEditing: boolean;
  onAdd: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onUpdate: (id: string, field: keyof Education, value: string) => void;
  onRemove: (id: string) => void;
  collapsed: boolean;
  toggleCollapse: () => void;
}

const EducationSection: React.FC<EducationSectionProps> = ({
  educations,
  isEditing,
  onAdd,
  onEdit,
  onSave,
  onCancel,
  onUpdate,
  onRemove,
  collapsed,
  toggleCollapse,
}) => (
  <div className="w-full">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-lg font-bold">Education</h2>
      <div className="flex gap-2">
        <button onClick={toggleCollapse} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors" type="button">
          <span className="text-lg">{collapsed ? '▼' : '▲'}</span>
        </button>
        <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 transition-colors" type="button">
          <span role="img" aria-label="edit">✏️</span>
        </button>
      </div>
    </div>
    {!collapsed && (
      <>
        {isEditing && (
          <div className="mb-3">
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-black font-semibold hover:bg-purple-200 transition-colors"
            >
              Add Education
            </button>
          </div>
        )}
        {educations.length === 0 ? (
          <div className="text-gray-400 text-sm mb-2">No education added yet.</div>
        ) : (
          educations.map(edu => (
            <EducationItem
              key={edu.id}
              education={edu}
              isEditing={isEditing}
              onUpdate={(field, value) => onUpdate(edu.id, field, value)}
              onRemove={() => onRemove(edu.id)}
            />
          ))
        )}
        {isEditing && (
          <div className="flex gap-2 mt-2">
            <button onClick={onSave} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">Save</button>
            <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg font-semibold">Cancel</button>
          </div>
        )}
      </>
    )}
  </div>
);

export default EducationSection; 