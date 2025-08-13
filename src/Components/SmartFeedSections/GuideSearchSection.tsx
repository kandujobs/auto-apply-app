import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface GuideSearchSectionProps {
  desiredJobTitle?: string;
  onJobTitleUpdated?: (jobTitle: string) => void;
}

const GuideSearchSection: React.FC<GuideSearchSectionProps> = ({ 
  desiredJobTitle = '', 
  onJobTitleUpdated 
}) => {
  const [jobTitle, setJobTitle] = useState(desiredJobTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setJobTitle(desiredJobTitle);
  }, [desiredJobTitle]);

  const handleSave = async () => {
    if (!jobTitle.trim()) return;
    
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ desired_job_title: jobTitle.trim() })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating desired job title:', error);
      } else {
        console.log('✅ Desired job title updated successfully');
        setIsEditing(false);
        if (onJobTitleUpdated) {
          onJobTitleUpdated(jobTitle.trim());
        }
      }
    } catch (error) {
      console.error('Error saving desired job title:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setJobTitle(desiredJobTitle);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Guide Search</h3>
            <p className="text-sm text-gray-600">Set your target job title</p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
            type="button"
          >
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Desired Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-gray-900 placeholder-gray-500"
              maxLength={255}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used to guide your job search and filter recommendations
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={!jobTitle.trim() || isSaving}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                'Save'
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-600">Current Target:</p>
              <p className="text-lg font-semibold text-gray-900">
                {jobTitle || 'Intern'}
              </p>
            </div>
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500">Job searches will focus on this title</p>
        </div>
      )}
    </div>
  );
};

export default GuideSearchSection;
