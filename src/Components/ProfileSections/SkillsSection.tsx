import React, { useState, useRef, useEffect } from "react";

interface SkillsSectionProps {
  skills: string[];
  editingSkills: string[];
  onSave: (updatedSkills: string[]) => void;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({
  skills,
  editingSkills,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localSkills, setLocalSkills] = useState(editingSkills);
  const [addingNew, setAddingNew] = useState(false);
  const [newSkillValue, setNewSkillValue] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSkills(editingSkills);
  }, [editingSkills]);

  // Exit edit mode on outside click
  useEffect(() => {
    if (!isEditing) return;
    function handleClickOutside(event: MouseEvent) {
      if (sectionRef.current && !sectionRef.current.contains(event.target as Node)) {
        if (addingNew && newSkillValue.trim()) {
          setLocalSkills([...localSkills, newSkillValue.trim()]);
        }
        setAddingNew(false);
        setNewSkillValue("");
        handleSave();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, localSkills, addingNew, newSkillValue]);

  // Enter edit mode on click
  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      addInputRef.current?.focus();
    }, 100);
  };

  const handleSave = () => {
    onSave(localSkills);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalSkills(skills);
    setIsEditing(false);
    setAddingNew(false);
    setNewSkillValue("");
  };

  const removeSkill = (skillToRemove: string) => {
    setLocalSkills(localSkills.filter((skill) => skill !== skillToRemove));
  };

  // Add skill bubble logic
  const handleAddBubbleClick = () => {
    setAddingNew(true);
    setNewSkillValue("");
    setTimeout(() => {
      addInputRef.current?.focus();
    }, 100);
  };

  // Save or discard new skill bubble on blur
  const handleNewSkillBlur = () => {
    if (newSkillValue.trim()) {
      setLocalSkills([...localSkills, newSkillValue.trim()]);
    }
    setAddingNew(false);
    setNewSkillValue("");
  };

  return (
    <div className="w-full" ref={sectionRef}>
      <div className="w-full overflow-x-auto px-0 relative" style={{height: 48}}>
        <div className="flex gap-3 whitespace-nowrap min-w-0 justify-center">
          {((isEditing ? localSkills : skills) || []).map((skill, i) => (
            <div
              key={i}
              className="bg-purple-100 text-purple-700 font-semibold text-[16px] rounded-full px-4 py-1 flex items-center gap-1 min-w-max cursor-pointer"
              style={{ minHeight: 32 }}
              onClick={!isEditing ? handleEdit : undefined}
            >
              <span>{skill}</span>
              {isEditing && (
                <button
                  onClick={e => { e.stopPropagation(); removeSkill(skill); }}
                  className="text-gray-500 hover:text-gray-700 text-xs ml-1"
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {/* New skill bubble in edit mode */}
          {isEditing && addingNew && (
            <input
              ref={addInputRef}
              type="text"
              value={newSkillValue}
              onChange={e => setNewSkillValue(e.target.value)}
              onBlur={handleNewSkillBlur}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  if (newSkillValue.trim()) {
                    setLocalSkills([...localSkills, newSkillValue.trim()]);
                  }
                  setAddingNew(false);
                  setNewSkillValue("");
                }
              }}
              className="bg-purple-50 text-purple-700 font-semibold text-[16px] rounded-full px-4 py-1 flex items-center min-w-max focus:ring-2 focus:ring-purple-400 mx-0"
              style={{ minHeight: 32, height: 32, width: 90, maxWidth: 140 }}
              placeholder="New..."
              autoFocus
            />
          )}
          {/* Plus button styled as skill bubble */}
          {isEditing && !addingNew && (
            <button
              onClick={handleAddBubbleClick}
              className="bg-purple-100 text-purple-700 font-bold text-[22px] rounded-full px-4 py-1 flex items-center justify-center min-w-max cursor-pointer hover:bg-purple-200 transition"
              style={{ minHeight: 32, height: 32 }}
              aria-label="Add Skill Bubble"
            >
              +
            </button>
          )}
        </div>
      </div>
      {isEditing && (
        null
      )}
    </div>
  );
};

export default SkillsSection; 