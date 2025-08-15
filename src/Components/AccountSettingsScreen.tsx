import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import BasicInfoSection from './ProfileSections/BasicInfoSection';
import { UserProfile } from '../types/Profile';
import Notification from './Notification';

const NY_LOCATIONS = [
  "New York, NY", "Buffalo, NY", "Rochester, NY", "Yonkers, NY", "Syracuse, NY", "Albany, NY", "New Rochelle, NY", "Mount Vernon, NY", "Schenectady, NY", "Utica, NY", "White Plains, NY", "Troy, NY", "Niagara Falls, NY", "Binghamton, NY", "Rome, NY", "Long Beach, NY", "Poughkeepsie, NY", "North Tonawanda, NY", "Jamestown, NY", "Ithaca, NY", "Elmira, NY", "Newburgh, NY", "Middletown, NY", "Auburn, NY", "Watertown, NY", "Glen Cove, NY", "Saratoga Springs, NY", "Kingston, NY", "Peekskill, NY", "Lockport, NY", "Plattsburgh, NY"
];

interface AccountSettingsScreenProps {
  goBack?: () => void;
  goToHome?: () => void;
  goToSaved?: () => void;
  goToApplied?: () => void;
  goToProfile?: () => void;
  goToFilters?: () => void;
  goToNotifications?: () => void;
}

const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({
  goBack,
  goToHome = () => {},
  goToSaved = () => {},
  goToApplied = () => {},
  goToProfile = () => {},
  goToNotifications = () => {},
  goToFilters = () => {},
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [showEditNotification, setShowEditNotification] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      // If we already have profile data, show refreshing state
      if (profile) {
        setIsRefreshing(true);
      }
      
      const { data } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single();
      
      if (data) {
        // Ensure we have the user's email from auth as fallback
        const profileWithEmail = {
          ...data,
          email: data.email || userData.user.email || ''
        };
        setProfile(profileWithEmail);
        setEditingProfile(profileWithEmail);
      } else {
        // If no profile exists, create one with auth data
        const newProfile = {
          id: userData.user.id,
          name: userData.user.user_metadata?.full_name || '',
          email: userData.user.email || '',
          phone: '',
          location: '',
          headline: '',
          education: [],
          experience: [],
          skills: [],
          interests: [],
          statistics: {
            applied: 0,
            pending: 0,
            offers: 0
          }
        };
        setProfile(newProfile);
        setEditingProfile(newProfile);
      }
      setIsRefreshing(false);
    }
    fetchProfile();
  }, []);

  // Show loading only on initial load, not when refreshing
  if (!profile || !editingProfile) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('No user found');
      }

      // Delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userData.user.id);

      if (profileError) {
        throw profileError;
      }

      // Delete from linkedin_credentials table
      const { error: credentialsError } = await supabase
        .from('linkedin_credentials')
        .delete()
        .eq('id', userData.user.id);

      if (credentialsError) {
        console.warn('Could not delete LinkedIn credentials:', credentialsError);
      }

      // Delete the user account
      const { error: authError } = await supabase.auth.admin.deleteUser(userData.user.id);
      
      if (authError) {
        // If admin delete fails, try to delete the user's own account
        const { error: selfDeleteError } = await supabase.auth.admin.deleteUser(userData.user.id);
        if (selfDeleteError) {
          throw selfDeleteError;
        }
      }

      // Sign out the user
      await supabase.auth.signOut();
      
      // Redirect to home or show success message
      if (goToHome) {
        goToHome();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  return (
    <div className="bg-gray-100 pt-40 pb-40 px-4 h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Top Nav Gradient Bar */}
      <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] p-4 rounded-b-[2rem] z-20 flex items-center justify-center shadow-lg">
        <div className="mt-6 bg-white/100 rounded-3xl flex justify-center items-center px-8 py-2 gap-8 w-fit border-2 border-gray-400">
          <button onClick={goToNotifications} className="text-white text-[30px]">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="35" height="35">
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M4.51555 7C3.55827 8.4301 3 10.1499 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3V6M12 12L8 8" stroke="#878787" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
              </g>
            </svg>
          </button>
          <button onClick={goToProfile} className="text-white text-[30px]">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#878787" strokeWidth="1.896" width="35" height="35">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <g id="style=linear">
                  <g id="profile">
                    <path id="vector" d="M12 11C14.4853 11 16.5 8.98528 16.5 6.5C16.5 4.01472 14.4853 2 12 2C9.51472 2 7.5 4.01472 7.5 6.5C7.5 8.98528 9.51472 11 12 11Z" stroke="#878787" strokeWidth="1.896" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path id="rec" d="M5 18.5714C5 16.0467 7.0467 14 9.57143 14H14.4286C16.9533 14 19 16.0467 19 18.5714C19 20.465 17.465 22 15.5714 22H8.42857C6.53502 22 5 20.465 5 18.5714Z" stroke="#878787" strokeWidth="1.896"></path>
                  </g>
                </g>
              </g>
            </svg>
          </button>
          <button onClick={goToHome} className="text-white text-[30px]">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#878787" width="35" height="35">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M10.5026 5.01692L9.96661 3.65785C9.62068 2.78072 8.37933 2.78072 8.03339 3.65784L6.96137 6.37599C6.85576 6.64378 6.64378 6.85575 6.37599 6.96137L3.65785 8.03339C2.78072 8.37932 2.78072 9.62067 3.65784 9.96661L6.37599 11.0386C6.64378 11.1442 6.85575 11.3562 6.96137 11.624L8.03339 14.3422C8.37932 15.2193 9.62067 15.2193 9.96661 14.3422L11.0386 11.624C11.1442 11.3562 11.3562 11.1442 11.624 11.0386L14.3422 9.96661C15.2193 9.62068 15.2193 8.37933 14.3422 8.03339L12.9831 7.49738" stroke="#878787" strokeWidth="1.92" strokeLinecap="round"></path>
                <path d="M16.4885 13.3481C16.6715 12.884 17.3285 12.884 17.5115 13.3481L18.3121 15.3781C18.368 15.5198 18.4802 15.632 18.6219 15.6879L20.6519 16.4885C21.116 16.6715 21.116 17.3285 20.6519 17.5115L18.6219 18.3121C18.4802 18.368 18.368 18.4802 18.3121 18.6219L17.5115 20.6519C17.3285 21.116 16.6715 21.116 16.4885 20.6519L15.6879 18.6219C15.632 18.4802 15.5198 18.368 15.3781 18.3121L13.3481 17.5115C12.884 17.3285 12.884 16.6715 13.3481 16.4885L15.3781 15.6879C15.5198 15.632 15.632 15.5198 15.6879 15.3781L16.4885 13.3481Z" stroke="#878787" strokeWidth="1.92"></path>
              </g>
            </svg>
          </button>
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto flex flex-col gap-y-8 items-center justify-center pb-32">
        {/* Back Button and Title */}
        <div className="w-full flex items-center gap-4 mb-4">
          <button 
            onClick={goBack} 
            className="flex items-center gap-2 text-purple-600 font-bold text-lg hover:text-purple-700 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>
        </div>
        {/* Subtle refresh indicator */}
        {isRefreshing && (
          <div className="absolute left-0 right-0 top-0 flex justify-center items-center pointer-events-none">
            <div className="mt-4 text-xs text-gray-400 animate-pulse bg-white/80 rounded-full px-4 py-1 shadow">Refreshing...</div>
          </div>
        )}

        <BasicInfoSection
          profile={profile}
          editingProfile={editingProfile}
          onUpdate={(field, value) => setEditingProfile(prev => prev ? { ...prev, [field]: value } : prev)}
          onSave={async (updatedProfile) => {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) return;
            
            // Only update the specific fields that were changed
            const { error } = await supabase.from('profiles').update(updatedProfile).eq('id', userData.user.id);
            
            if (error) {
              console.error('Error saving profile:', error);
              alert('Failed to save profile. Please try again.');
              return;
            }
            
            // Update local state with the new data
            setProfile(prev => prev ? { ...prev, ...updatedProfile } : prev);
            setEditingProfile(prev => prev ? { ...prev, ...updatedProfile } : prev);
            setShowEditNotification(true);
          }}
        />

        {/* Delete Account Section */}
        <div className="w-full bg-white rounded-[2rem] border-4 border-red-300 p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[18px] font-bold text-red-700">Danger Zone</h2>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={isDeleting}
              className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? 'Deleting Account...' : 'Delete Account'}
            </button>
          </div>
        </div>

        <Notification
          message="Account info saved!"
          isVisible={showEditNotification}
          onClose={() => setShowEditNotification(false)}
          duration={2000}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-t-[2rem] p-8 z-10 flex items-center justify-center">
        <div className="w-fit mx-auto bg-white rounded-3xl flex justify-center items-center gap-6 py-3 px-8 shadow-lg border-2 border-gray-400">
          <button onClick={goToSaved} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Saved</button>
          <button onClick={goToHome} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Discover</button>
          <button onClick={goToApplied} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Applied</button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsScreen; 