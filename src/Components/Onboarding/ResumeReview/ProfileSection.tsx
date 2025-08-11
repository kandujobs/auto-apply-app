import React from "react";

interface ProfileSectionProps {
  fields: { label: string; value: string }[];
  isEditing: boolean;
  editingProfile: Record<string, string>;
  onFieldChange: (label: string, value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  collapsed: boolean;
  toggleCollapse: () => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  fields,
  isEditing,
  editingProfile,
  onFieldChange,
  onEdit,
  onSave,
  onCancel,
  collapsed,
  toggleCollapse,
}) => (
  <div className="w-full">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-lg font-bold">Profile</h2>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {Object.entries(editingProfile).map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type="text"
                value={value}
                onChange={e => onFieldChange(label, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0 text-sm"
              />
            </div>
          ))}
          <div className="col-span-2 flex gap-2 mt-2">
            <button onClick={onSave} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">Save</button>
            <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg font-semibold">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full">
          {editingProfile['Full Name'] && (
            <div className="text-2xl font-bold text-gray-900 mb-1">{editingProfile['Full Name']}</div>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-1 items-center text-sm text-gray-700">
            {editingProfile['Email'] && <span>{editingProfile['Email']}</span>}
            {editingProfile['Phone'] && <span>{editingProfile['Phone']}</span>}
            {editingProfile['LinkedIn'] && <span>{editingProfile['LinkedIn']}</span>}
            {editingProfile['Address'] && <span>{editingProfile['Address']}</span>}
            {editingProfile['Website'] && <span>{editingProfile['Website']}</span>}
          </div>
        </div>
      )
    )}
  </div>
);

export default ProfileSection; 