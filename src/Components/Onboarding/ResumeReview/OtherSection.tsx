import React from "react";

interface OtherSectionProps {
  fields: { label: string; value: string }[];
  isEditing: boolean;
  editingOther: { label: string; value: string }[];
  onFieldChange: (idx: number, value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  collapsed: boolean;
  toggleCollapse: () => void;
}

const OtherSection: React.FC<OtherSectionProps> = ({
  fields,
  isEditing,
  editingOther,
  onFieldChange,
  onEdit,
  onSave,
  onCancel,
  collapsed,
  toggleCollapse,
}) => (
  <div className="w-full">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-lg font-bold">Other</h2>
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
      editingOther.length === 0 ? (
        <div className="text-gray-400 text-sm mb-2">No additional information found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {editingOther.map((field, idx) => (
            <div key={field.label + idx} className="flex flex-col gap-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={field.value}
                  onChange={e => onFieldChange(idx, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0 text-sm"
                />
              ) : (
                field.value ? (
                  <span className="text-gray-900 break-words text-sm">{field.value}</span>
                ) : (
                  <span className="text-gray-400 italic text-sm">Edit to add {field.label.toLowerCase()}</span>
                )
              )}
            </div>
          ))}
          {isEditing && (
            <div className="col-span-2 flex gap-2 mt-2">
              <button onClick={onSave} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">Save</button>
              <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg font-semibold">Cancel</button>
            </div>
          )}
        </div>
      )
    )}
  </div>
);

export default OtherSection; 