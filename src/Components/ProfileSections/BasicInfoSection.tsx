import React, { useState } from "react";
import { UserProfile } from "../../types/Profile";

interface BasicInfoSectionProps {
  profile: UserProfile;
  editingProfile: UserProfile;
  onUpdate: (field: keyof UserProfile, value: any) => void;
  onSave: (updatedProfile: Partial<UserProfile>) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  profile,
  editingProfile,
  onUpdate,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave({
      name: editingProfile.name,
      email: editingProfile.email,
      phone: editingProfile.phone,
      location: editingProfile.location,
      headline: editingProfile.headline
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    onUpdate('name', profile.name);
    onUpdate('email', profile.email);
    onUpdate('phone', profile.phone);
    onUpdate('location', profile.location);
    onUpdate('headline', profile.headline);
    setIsEditing(false);
  };

  return (
    <div className="w-full bg-white rounded-[2rem] border-4 border-gray-300 p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[18px] font-bold">Basic Information</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 bg-purple-200 text-purple-700 font-semibold rounded-lg hover:bg-purple-300 transition-colors text-sm"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={handleCancel}
              className="w-[24px] h-[24px] bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <span className="text-gray-600 text-xs">✕</span>
            </button>
            <button
              onClick={handleSave}
              className="w-[24px] h-[24px] bg-green-200 rounded-full flex items-center justify-center hover:bg-green-300 transition-colors"
            >
              <span className="text-green-600 text-xs">✓</span>
            </button>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          {isEditing ? (
            <input
              type="text"
              value={editingProfile.name || ''}
              onChange={(e) => onUpdate('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0"
            />
          ) : (
            profile.name ? (
            <p className="text-gray-900 break-words">{profile.name}</p>
            ) : (
              <p className="text-gray-400 italic">Edit to add full name</p>
            )
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          {isEditing ? (
            <input
              type="email"
              value={editingProfile.email || ''}
              onChange={(e) => onUpdate('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0"
            />
          ) : (
            profile.email ? (
            <p className="text-gray-900 break-words">{profile.email}</p>
            ) : (
              <p className="text-gray-400 italic">Edit to add email</p>
            )
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          {isEditing ? (
            <input
              type="tel"
              value={editingProfile.phone || ''}
              onChange={(e) => onUpdate('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0"
            />
          ) : (
            profile.phone ? (
            <p className="text-gray-900 break-words">{profile.phone}</p>
            ) : (
              <p className="text-gray-400 italic">Edit to add phone number</p>
            )
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          {isEditing ? (
            <input
              type="text"
              value={editingProfile.location || ''}
              onChange={(e) => onUpdate('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0"
            />
          ) : (
            profile.location ? (
            <p className="text-gray-900 break-words">{profile.location}</p>
          ) : (
              <p className="text-gray-400 italic">Edit to add location</p>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection; 