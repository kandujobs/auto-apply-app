import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import BasicInfoSection from './ProfileSections/BasicInfoSection';
import { UserProfile } from '../types/Profile';
import Notification from './Notification';
import { FiUser, FiShield, FiAlertTriangle, FiFileText, FiTrash2, FiSave, FiEdit3, FiCreditCard, FiCalendar, FiZap, FiStar } from 'react-icons/fi';

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

interface SubscriptionData {
  id: string;
  status: 'trialing' | 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  trial_start: number | null;
  trial_end: number | null;
  cancel_at_period_end: boolean;
  plan: {
    name: string;
    price: number;
    interval: 'month' | 'year';
  };
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

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

    async function fetchSubscription() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        // Fetch subscription data from your backend
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/api/payment/subscription`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.user.id}`
          }
        });

        if (response.ok) {
          const subscriptionData = await response.json();
          setSubscription(subscriptionData);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setIsLoadingSubscription(false);
      }
    }

    fetchProfile();
    fetchSubscription();
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

  const handleSaveProfile = async (updatedProfile: Partial<UserProfile>) => {
    setSaveStatus('saving');
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', userData.user.id);

      if (error) throw error;
      
      // Update local state with the new data
      setProfile(prev => prev ? { ...prev, ...updatedProfile } : prev);
      setEditingProfile(prev => prev ? { ...prev, ...updatedProfile } : prev);
      
      setSaveStatus('success');
      setShowEditNotification(true);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Create Stripe customer portal session
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/api/payment/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.user.id,
          returnUrl: window.location.href
        })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        throw new Error('Failed to create portal session');
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
      alert('Failed to open subscription management. Please try again.');
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const getTrialDaysLeft = () => {
    if (!subscription?.trial_end) return null;
    const trialEnd = new Date(subscription.trial_end * 1000);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return 'No subscription';
    
    switch (subscription.status) {
      case 'trialing':
        return 'Free Trial';
      case 'active':
        return 'Active';
      case 'canceled':
        return 'Canceled';
      case 'past_due':
        return 'Past Due';
      case 'incomplete':
        return 'Incomplete';
      case 'incomplete_expired':
        return 'Expired';
      case 'unpaid':
        return 'Unpaid';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Free Trial':
      case 'Active':
        return 'text-green-600 bg-green-100';
      case 'Canceled':
      case 'Expired':
        return 'text-red-600 bg-red-100';
      case 'Past Due':
      case 'Unpaid':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const SettingItem = ({ 
    title, 
    description, 
    icon: Icon,
    children,
    className = ""
  }: { 
    title: string; 
    description: string; 
    icon: any;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`flex items-start space-x-4 p-4 rounded-xl border transition-all duration-200 bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm ${className}`}>
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="w-5 h-5 text-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed mb-3">{description}</p>
        {children}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-gradient-to-br from-purple-50 to-blue-50 pt-4 pb-4 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button 
                  onClick={goBack} 
                  className="text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1 transition-colors text-sm"
                >
                  <span className="text-base">←</span>
                  <span>Back</span>
                </button>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Account Settings</h1>
              </div>
              {saveStatus === 'saving' && (
                <div className="text-sm text-gray-500 flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span>Saving...</span>
                </div>
              )}
              {saveStatus === 'success' && (
                <div className="text-sm text-green-600 flex items-center space-x-2">
                  <span>✓ Saved!</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="text-sm text-red-600 flex items-center space-x-2">
                  <span>✗ Error</span>
                </div>
              )}
            </div>
            
            {/* Subtle refresh indicator */}
            {isRefreshing && (
              <div className="text-xs text-gray-500 flex items-center space-x-2 mb-4">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                <span>Refreshing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="space-y-6 sm:space-y-8">
              
              {/* Basic Information Section */}
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  <span>Basic Information</span>
                </h2>
                <div className="space-y-3">
                  <SettingItem
                    title="Profile Information"
                    description="Manage your personal details and contact information"
                    icon={FiUser}
                  >
                    <BasicInfoSection
                      profile={profile}
                      editingProfile={editingProfile}
                      onUpdate={(field, value) => setEditingProfile(prev => prev ? { ...prev, [field]: value } : prev)}
                      onSave={handleSaveProfile}
                    />
                  </SettingItem>
                </div>
              </div>

              {/* Subscription Section */}
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <FiCreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  <span>Subscription</span>
                </h2>
                <div className="space-y-3">
                  {isLoadingSubscription ? (
                    <SettingItem
                      title="Loading Subscription"
                      description="Fetching your subscription details..."
                      icon={FiCreditCard}
                    >
                      <div className="animate-pulse bg-gray-200 h-4 rounded w-24"></div>
                    </SettingItem>
                  ) : subscription ? (
                    <>
                      <SettingItem
                        title="Current Plan"
                        description={`${subscription.plan.name} - $${subscription.plan.price}/${subscription.plan.interval}`}
                        icon={FiStar}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getSubscriptionStatus())}`}>
                            {getSubscriptionStatus()}
                          </span>
                          {subscription.status === 'trialing' && getTrialDaysLeft() !== null && (
                            <span className="text-sm text-gray-600">
                              {getTrialDaysLeft()} days left
                            </span>
                          )}
                        </div>
                      </SettingItem>

                      <SettingItem
                        title="Billing Period"
                        description={`Next billing date: ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`}
                        icon={FiCalendar}
                      >
                        <div className="text-sm text-gray-600">
                          {subscription.cancel_at_period_end && (
                            <span className="text-orange-600 font-medium">Cancels at period end</span>
                          )}
                        </div>
                      </SettingItem>

                      <SettingItem
                        title="Manage Subscription"
                        description="Update your plan, payment method, or cancel your subscription"
                        icon={FiCreditCard}
                      >
                        <button
                          onClick={handleManageSubscription}
                          disabled={isManagingSubscription}
                          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {isManagingSubscription ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Opening...
                            </>
                          ) : (
                            <>
                              <FiEdit3 className="w-4 h-4 mr-2" />
                              Manage Subscription
                            </>
                          )}
                        </button>
                      </SettingItem>
                    </>
                  ) : (
                    <SettingItem
                      title="No Active Subscription"
                      description="You don't have an active subscription. Start a free trial to access premium features."
                      icon={FiCreditCard}
                    >
                      <button
                        onClick={() => window.location.href = '/app?showPaywall=true'}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <FiZap className="w-4 h-4 mr-2" />
                        Start Free Trial
                      </button>
                    </SettingItem>
                  )}
                </div>
              </div>

              {/* Legal Section */}
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <FiFileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  <span>Legal</span>
                </h2>
                <div className="space-y-3">
                  <SettingItem
                    title="Privacy Policy"
                    description="Read our privacy policy to understand how we handle your data"
                    icon={FiFileText}
                  >
                    <a
                      href="https://kandujobs.com/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      View Privacy Policy
                    </a>
                  </SettingItem>
                  
                  <SettingItem
                    title="Terms of Service"
                    description="Review our terms of service and user agreement"
                    icon={FiFileText}
                  >
                    <a
                      href="https://kandujobs.com/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      View Terms of Service
                    </a>
                  </SettingItem>
                </div>
              </div>

              {/* Danger Zone Section */}
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <FiAlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  <span>Danger Zone</span>
                </h2>
                <div className="space-y-3">
                  <SettingItem
                    title="Delete Account"
                    description="Permanently delete your account and all associated data. This action cannot be undone."
                    icon={FiTrash2}
                    className="border-red-200 bg-red-50"
                  >
                    <button
                      onClick={() => setShowDeleteConfirmation(true)}
                      disabled={isDeleting}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4 mr-2" />
                      {isDeleting ? 'Deleting Account...' : 'Delete Account'}
                    </button>
                  </SettingItem>
                </div>
              </div>
            </div>
          </div>
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
                <FiAlertTriangle className="w-6 h-6 text-red-600" />
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
  );
};

export default AccountSettingsScreen; 