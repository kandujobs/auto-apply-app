import React, { useState, useRef, useEffect } from "react";
import { Experience } from "../../types/Profile";

interface ExperienceItemProps {
  experience: Experience;
  isEditing: boolean;
  onUpdate: (field: keyof Experience, value: any) => void;
  onRemove: () => void;
}

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return "";
  if (dateString.length === 7 && dateString.includes('-')) {
    // Format YYYY-MM to 'Mon YYYY'
    const [year, month] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  }
  if (dateString.length === 4) {
    return dateString;
  }
  return dateString;
};

const ExperienceItem: React.FC<ExperienceItemProps> = ({
  experience,
  isEditing,
  onUpdate,
  onRemove
}) => {
  const [expanded, setExpanded] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    if (descRef.current && !expanded) {
      setIsClamped(descRef.current.scrollHeight > descRef.current.clientHeight + 2);
    }
  }, [experience.description, expanded]);

  const maxLength = 200;
  const isLong = experience.description && experience.description.length > maxLength;
  const displayText = !expanded && isLong
    ? experience.description.slice(0, maxLength) + '...'
    : experience.description;

  return (
    <div className="flex flex-row items-start gap-3 mb-4 relative">
      {/* Responsive vertical purple line */}
      <div className="w-1 rounded-full bg-[#A100FF] min-h-[56px] mt-1 flex-shrink-0" style={{ height: 'auto', alignSelf: 'stretch' }} />
      <div className="flex flex-col flex-1">
        {isEditing ? (
          <>
      <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-lg text-black">{experience.title}</span>
        <button
          onClick={onRemove}
                className="text-red-500 hover:text-red-700 text-sm ml-2"
        >
          Remove
        </button>
      </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Job Title</label>
          <input
            type="text"
            value={experience.title}
            onChange={(e) => onUpdate('title', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 min-w-0"
          />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
          <input
            type="text"
            value={experience.company}
            onChange={(e) => onUpdate('company', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 min-w-0"
          />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
          <input
            type="text"
            value={experience.location}
            onChange={(e) => onUpdate('location', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 min-w-0"
          />
      </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="month"
              value={experience.startDate}
              onChange={(e) => onUpdate('startDate', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="month"
              value={experience.endDate}
              onChange={(e) => onUpdate('endDate', e.target.value)}
              disabled={experience.current}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-100"
            />
        </div>
          <div className="col-span-2 flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id={`current-${experience.id}`}
            checked={experience.current}
            onChange={(e) => onUpdate('current', e.target.checked)}
            className="rounded"
          />
          <label htmlFor={`current-${experience.id}`} className="text-xs text-gray-600">
            I currently work here
          </label>
        </div>
          <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            value={experience.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            rows={3}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
          />
          </div>
        </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-lg text-black">{experience.title}</span>
            </div>
            <span className="text-md font-semibold text-gray-700">{experience.company}</span>
            <span className="text-md text-gray-500">{experience.location}</span>
            <span className="text-md text-gray-400">{formatDateForDisplay(experience.startDate)}{experience.startDate && experience.endDate ? ' - ' : ''}{experience.current ? 'Present' : formatDateForDisplay(experience.endDate)}</span>
            <div className={expanded ? "max-h-40 overflow-y-auto" : ""}>
              {!expanded ? (
                <p
                  className="text-sm text-gray-600 mt-0.5 line-clamp-3 overflow-hidden cursor-pointer"
                  ref={descRef}
                  onClick={() => setExpanded(true)}
                  title="Click to expand"
                >
                  {experience.description}
                </p>
              ) : (
                <p className="text-sm text-gray-600 mt-0.5">
                  {experience.description}
                  <span className="text-[#A100FF] cursor-pointer ml-2 underline" onClick={() => setExpanded(false)}>
                    Show less
                  </span>
                </p>
              )}
            </div>
          </>
        )}
      </div>
  </div>
);
};

export default ExperienceItem; 