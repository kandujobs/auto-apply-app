import React from "react";

interface SkillsSectionProps {
  skills: string[];
  editingSkills: string[];
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updatedSkills: string[]) => void;
  onCancel: () => void;
  onAdd: () => void;
  onChange: (skills: string[]) => void;
  collapsed: boolean;
  toggleCollapse: () => void;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({
  skills,
  editingSkills,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onAdd,
  onChange,
  collapsed,
  toggleCollapse,
}) => {
  const [input, setInput] = React.useState("");

  const addSkill = () => {
    const newSkill = input.trim();
    if (newSkill && !editingSkills.includes(newSkill)) {
      onChange([...editingSkills, newSkill]);
      setInput("");
    }
  };
  const removeSkill = (skill: string) => {
    onChange(editingSkills.filter(s => s !== skill));
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">Skills</h2>
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
        isEditing ? (
          <div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add Skills..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addSkill(); }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-black font-semibold hover:bg-purple-200 transition-colors"
              >Add</button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {editingSkills.map((skill, i) => (
                <div
                  key={i}
                  className="bg-purple-200 text-purple-700 font-bold text-[12px] rounded-full px-3 py-1 flex items-center gap-1"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSkill(skill)}
                    className="text-purple-700 hover:text-purple-900 text-xs font-bold ml-1"
                  >x</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => onSave(editingSkills)} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">Save</button>
              <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg font-semibold">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.length === 0 ? (
              <span className="text-gray-400 italic">No skills added yet.</span>
            ) : (
              skills.map((skill, i) => (
                <div
                  key={i}
                  className="bg-purple-200 text-purple-700 font-bold text-[12px] rounded-full px-3 py-1 flex items-center gap-1"
                >
                  <span>{skill}</span>
                </div>
              ))
            )}
          </div>
        )
      )}
    </div>
  );
};

export default SkillsSection; 