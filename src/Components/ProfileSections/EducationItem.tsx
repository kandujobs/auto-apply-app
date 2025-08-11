import React from "react";
import { Education } from "../../types/Profile";

interface EducationItemProps {
  education: Education;
  isEditing: boolean;
  onUpdate: (field: keyof Education, value: string) => void;
  onRemove: () => void;
}

const EducationItem: React.FC<EducationItemProps> = ({
  education,
  isEditing,
  onUpdate,
  onRemove
}) => {
  // Helper function to format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    // If it's already in YYYY-MM format, convert to YYYY
    if (dateString.includes('-')) {
      return dateString.split('-')[0];
    }
    return dateString;
  };

  // Helper function to format date for input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    // If it's just a year, convert to YYYY-01 format for month input
    if (dateString.length === 4 && /^\d{4}$/.test(dateString)) {
      return `${dateString}-01`;
    }
    return dateString;
  };

  return (
    <div className="flex flex-row items-start gap-3 mb-4 relative">
      {/* Responsive vertical purple line */}
      <div className="w-1 rounded-full bg-[#A100FF] min-h-[56px] mt-1 flex-shrink-0" style={{ height: 'auto', alignSelf: 'stretch' }} />
      <div className="flex flex-col flex-1">
        {/* Remove label in view mode */}
        {isEditing && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-gray-600">School / University</label>
            <button
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 text-sm ml-2"
            >
              Remove
            </button>
          </div>
          )}
        {isEditing && (
          <input
            type="text"
            value={education.institution}
            onChange={(e) => onUpdate('institution', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 min-w-0 mb-2"
            placeholder="e.g. University of California"
          />
        )}
        {!isEditing && (
          <span className="font-bold text-lg text-black mb-1">{education.institution}</span>
        )}
        {/* Degree and Field */}
        {isEditing ? (
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Degree</label>
              <input
                type="text"
                value={education.degree}
                onChange={(e) => onUpdate('degree', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 min-w-0"
                placeholder="e.g. Bachelors of Science"
              />
            </div>
            <span className="text-gray-500 mt-6">in</span>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Field</label>
              <input
                type="text"
                value={education.field}
                onChange={(e) => onUpdate('field', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 min-w-0"
                placeholder="e.g. Computer Science"
              />
            </div>
          </div>
        ) : (
          <span className="text-md text-gray-400 -mt-1">{education.degree}{education.field ? ` in ${education.field}` : ''}</span>
        )}
        {/* Dates */}
        {isEditing ? (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="month"
                value={formatDateForInput(education.startDate)}
                onChange={(e) => onUpdate('startDate', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="month"
                value={formatDateForInput(education.endDate)}
                onChange={(e) => onUpdate('endDate', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        ) : (
          <>
          <span className="text-md text-gray-400">{formatDateForDisplay(education.startDate)}{education.startDate && education.endDate ? ' - ' : ''}{formatDateForDisplay(education.endDate)}</span>
            {education.gpa && (
              <div className="flex w-full">
                <span className="bg-purple-200 text-purple-700 font-bold text-xs rounded-full px-3 py-1 inline-flex items-center gap-1 mt-1 self-start">
                  GPA: {education.gpa}
                </span>
              </div>
            )}
          </>
        )}
        {/* GPA and Location */}
        {isEditing && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">GPA (Optional)</label>
              <input
                type="text"
                value={education.gpa || ""}
                onChange={(e) => onUpdate('gpa', e.target.value)}
                placeholder="3.8"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 max-w-[120px]"
              />
            </div>
            {/* Location field removed */}
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationItem; 