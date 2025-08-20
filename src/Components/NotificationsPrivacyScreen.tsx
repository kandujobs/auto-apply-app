import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FiBell, FiShield, FiEye, FiEyeOff, FiMail, FiSmartphone, FiZap, FiUsers, FiSearch, FiLock, FiUnlock, FiSave } from 'react-icons/fi';

interface NotificationsPrivacyScreenProps {
  goBack?: () => void;
}

interface NotificationSettings {
  // Email Notifications
  emailNotifications: boolean;
  jobMatchNotifications: boolean;
  weeklySummary: boolean;
  applicationUpdates: boolean;
  newJobAlerts: boolean;
  employerMessages: boolean;
  
  // Push Notifications
  pushNotifications: boolean;
  pushJobMatches: boolean;
  pushApplications: boolean;
  pushMessages: boolean;
  
  // Auto-Apply Notifications
  autoApplyNotifications: boolean;
  autoApplySuccess: boolean;
  autoApplyErrors: boolean;
  autoApplyDaily: boolean;
  
  // LinkedIn Integration
  linkedInNotifications: boolean;
  linkedInJobAlerts: boolean;
  linkedInMessages: boolean;
}

interface PrivacySettings {
  // Profile Visibility
  profileVisibleToEmployers: boolean;
  showInPublicSearch: boolean;
  showContactInfo: boolean;
  showResume: boolean;
  
  // Data Sharing
  allowMessagesFromEmployers: boolean;
  allowDataAnalytics: boolean;
  allowThirdPartySharing: boolean;
  
  // Account Security
  twoFactorAuthentication: boolean;
  sessionTimeout: number; // minutes
  loginNotifications: boolean;
}

const NotificationsPrivacyScreen: React.FC<NotificationsPrivacyScreenProps> = ({ goBack }) => {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    // Email Notifications
    emailNotifications: true,
    jobMatchNotifications: true,
    weeklySummary: false,
    applicationUpdates: true,
    newJobAlerts: true,
    employerMessages: true,
    
    // Push Notifications
    pushNotifications: false,
    pushJobMatches: true,
    pushApplications: true,
    pushMessages: true,
    
    // Auto-Apply Notifications
    autoApplyNotifications: true,
    autoApplySuccess: true,
    autoApplyErrors: true,
    autoApplyDaily: false,
    
    // LinkedIn Integration
    linkedInNotifications: true,
    linkedInJobAlerts: true,
    linkedInMessages: false,
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    // Profile Visibility
    profileVisibleToEmployers: true,
    showInPublicSearch: false,
    showContactInfo: true,
    showResume: true,
    
    // Data Sharing
    allowMessagesFromEmployers: true,
    allowDataAnalytics: true,
    allowThirdPartySharing: false,
    
    // Account Security
    twoFactorAuthentication: false,
    sessionTimeout: 30,
    loginNotifications: true,
  });

  const [activeTab, setActiveTab] = useState<'notifications' | 'privacy' | 'security'>('notifications');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('profiles')
          .select('notification_settings, privacy_settings')
          .eq('id', user.id)
          .single();

        if (data?.notification_settings) {
          setNotificationSettings(prev => ({ ...prev, ...data.notification_settings }));
        }
        if (data?.privacy_settings) {
          setPrivacySettings(prev => ({ ...prev, ...data.privacy_settings }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Auto-save settings to database
  const saveSettings = async (newNotificationSettings?: NotificationSettings, newPrivacySettings?: PrivacySettings) => {
    setSaveStatus('saving');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_settings: newNotificationSettings || notificationSettings,
          privacy_settings: newPrivacySettings || privacySettings
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    saveSettings(newSettings, privacySettings);
  };

  const updatePrivacySetting = (key: keyof PrivacySettings, value: boolean | number) => {
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);
    saveSettings(notificationSettings, newSettings);
  };

  const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
        checked ? 'bg-purple-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const SettingItem = ({ 
    title, 
    description, 
    checked, 
    onChange, 
    icon: Icon,
    disabled = false 
  }: { 
    title: string; 
    description: string; 
    checked: boolean; 
    onChange: () => void; 
    icon: any;
    disabled?: boolean;
  }) => (
    <div className={`flex items-start space-x-4 p-4 rounded-xl border transition-all duration-200 ${
      disabled 
        ? 'bg-gray-50 border-gray-100' 
        : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm'
    }`}>
      <div className="flex-shrink-0 mt-0.5">
        <Icon className={`w-5 h-5 ${checked ? 'text-purple-600' : 'text-gray-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
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
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Notifications & Privacy</h1>
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
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1.5 rounded-xl overflow-x-auto">
              {[
                { id: 'notifications', label: 'Notifications', icon: FiBell },
                { id: 'privacy', label: 'Privacy', icon: FiEye },
                { id: 'security', label: 'Security', icon: FiShield }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === id
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            {activeTab === 'notifications' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FiMail className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    <span>Email Notifications</span>
                  </h2>
                  <div className="space-y-3">
                    <SettingItem
                      title="Email Notifications"
                      description="Receive notifications via email"
                      checked={notificationSettings.emailNotifications}
                      onChange={() => updateNotificationSetting('emailNotifications', !notificationSettings.emailNotifications)}
                      icon={FiMail}
                    />
                    <SettingItem
                      title="Job Match Alerts"
                      description="Get notified when we find jobs that match your profile"
                      checked={notificationSettings.jobMatchNotifications}
                      onChange={() => updateNotificationSetting('jobMatchNotifications', !notificationSettings.jobMatchNotifications)}
                      icon={FiZap}
                      disabled={!notificationSettings.emailNotifications}
                    />
                    <SettingItem
                      title="Application Updates"
                      description="Receive updates on your job applications"
                      checked={notificationSettings.applicationUpdates}
                      onChange={() => updateNotificationSetting('applicationUpdates', !notificationSettings.applicationUpdates)}
                      icon={FiBell}
                      disabled={!notificationSettings.emailNotifications}
                    />
                    <SettingItem
                      title="Weekly Summary"
                      description="Get a weekly digest of your job search activity"
                      checked={notificationSettings.weeklySummary}
                      onChange={() => updateNotificationSetting('weeklySummary', !notificationSettings.weeklySummary)}
                      icon={FiMail}
                      disabled={!notificationSettings.emailNotifications}
                    />
                    <SettingItem
                      title="New Job Alerts"
                      description="Be notified of new jobs in your area"
                      checked={notificationSettings.newJobAlerts}
                      onChange={() => updateNotificationSetting('newJobAlerts', !notificationSettings.newJobAlerts)}
                      icon={FiBell}
                      disabled={!notificationSettings.emailNotifications}
                    />
                    <SettingItem
                      title="Employer Messages"
                      description="Receive messages from potential employers"
                      checked={notificationSettings.employerMessages}
                      onChange={() => updateNotificationSetting('employerMessages', !notificationSettings.employerMessages)}
                      icon={FiUsers}
                      disabled={!notificationSettings.emailNotifications}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FiSmartphone className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    <span>Push Notifications</span>
                  </h2>
                  <div className="space-y-3">
                    <SettingItem
                      title="Push Notifications"
                      description="Receive notifications on your device"
                      checked={notificationSettings.pushNotifications}
                      onChange={() => updateNotificationSetting('pushNotifications', !notificationSettings.pushNotifications)}
                      icon={FiSmartphone}
                    />
                    <SettingItem
                      title="Job Matches"
                      description="Get push notifications for job matches"
                      checked={notificationSettings.pushJobMatches}
                      onChange={() => updateNotificationSetting('pushJobMatches', !notificationSettings.pushJobMatches)}
                      icon={FiZap}
                      disabled={!notificationSettings.pushNotifications}
                    />
                    <SettingItem
                      title="Application Updates"
                      description="Push notifications for application status changes"
                      checked={notificationSettings.pushApplications}
                      onChange={() => updateNotificationSetting('pushApplications', !notificationSettings.pushApplications)}
                      icon={FiBell}
                      disabled={!notificationSettings.pushNotifications}
                    />
                    <SettingItem
                      title="Messages"
                      description="Push notifications for new messages"
                      checked={notificationSettings.pushMessages}
                      onChange={() => updateNotificationSetting('pushMessages', !notificationSettings.pushMessages)}
                      icon={FiUsers}
                      disabled={!notificationSettings.pushNotifications}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FiZap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    <span>Auto-Apply Notifications</span>
                  </h2>
                  <div className="space-y-3">
                    <SettingItem
                      title="Auto-Apply Notifications"
                      description="Get notified about automatic job applications"
                      checked={notificationSettings.autoApplyNotifications}
                      onChange={() => updateNotificationSetting('autoApplyNotifications', !notificationSettings.autoApplyNotifications)}
                      icon={FiZap}
                    />
                    <SettingItem
                      title="Successful Applications"
                      description="Notify when auto-apply is successful"
                      checked={notificationSettings.autoApplySuccess}
                      onChange={() => updateNotificationSetting('autoApplySuccess', !notificationSettings.autoApplySuccess)}
                      icon={FiBell}
                      disabled={!notificationSettings.autoApplyNotifications}
                    />
                    <SettingItem
                      title="Application Errors"
                      description="Notify when auto-apply encounters errors"
                      checked={notificationSettings.autoApplyErrors}
                      onChange={() => updateNotificationSetting('autoApplyErrors', !notificationSettings.autoApplyErrors)}
                      icon={FiBell}
                      disabled={!notificationSettings.autoApplyNotifications}
                    />
                    <SettingItem
                      title="Daily Summary"
                      description="Daily summary of auto-apply activity"
                      checked={notificationSettings.autoApplyDaily}
                      onChange={() => updateNotificationSetting('autoApplyDaily', !notificationSettings.autoApplyDaily)}
                      icon={FiMail}
                      disabled={!notificationSettings.autoApplyNotifications}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    <span>LinkedIn Integration</span>
                  </h2>
                  <div className="space-y-3">
                    <SettingItem
                      title="LinkedIn Notifications"
                      description="Receive notifications from LinkedIn integration"
                      checked={notificationSettings.linkedInNotifications}
                      onChange={() => updateNotificationSetting('linkedInNotifications', !notificationSettings.linkedInNotifications)}
                      icon={FiUsers}
                    />
                    <SettingItem
                      title="LinkedIn Job Alerts"
                      description="Get notified of new LinkedIn job opportunities"
                      checked={notificationSettings.linkedInJobAlerts}
                      onChange={() => updateNotificationSetting('linkedInJobAlerts', !notificationSettings.linkedInJobAlerts)}
                      icon={FiBell}
                      disabled={!notificationSettings.linkedInNotifications}
                    />
                    <SettingItem
                      title="LinkedIn Messages"
                      description="Receive LinkedIn message notifications"
                      checked={notificationSettings.linkedInMessages}
                      onChange={() => updateNotificationSetting('linkedInMessages', !notificationSettings.linkedInMessages)}
                      icon={FiMail}
                      disabled={!notificationSettings.linkedInNotifications}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FiEye className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    <span>Profile Visibility</span>
                  </h2>
                  <div className="space-y-3">
                    <SettingItem
                      title="Visible to Employers"
                      description="Allow employers to view your profile"
                      checked={privacySettings.profileVisibleToEmployers}
                      onChange={() => updatePrivacySetting('profileVisibleToEmployers', !privacySettings.profileVisibleToEmployers)}
                      icon={FiEye}
                    />
                    <SettingItem
                      title="Show in Public Search"
                      description="Allow your profile to appear in public job searches"
                      checked={privacySettings.showInPublicSearch}
                      onChange={() => updatePrivacySetting('showInPublicSearch', !privacySettings.showInPublicSearch)}
                      icon={FiSearch}
                    />
                    <SettingItem
                      title="Show Contact Information"
                      description="Display your contact information to employers"
                      checked={privacySettings.showContactInfo}
                      onChange={() => updatePrivacySetting('showContactInfo', !privacySettings.showContactInfo)}
                      icon={FiMail}
                    />
                    <SettingItem
                      title="Show Resume"
                      description="Allow employers to view your resume"
                      checked={privacySettings.showResume}
                      onChange={() => updatePrivacySetting('showResume', !privacySettings.showResume)}
                      icon={FiSave}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    <span>Data Sharing</span>
                  </h2>
                  <div className="space-y-3">
                    <SettingItem
                      title="Allow Employer Messages"
                      description="Allow employers to send you direct messages"
                      checked={privacySettings.allowMessagesFromEmployers}
                      onChange={() => updatePrivacySetting('allowMessagesFromEmployers', !privacySettings.allowMessagesFromEmployers)}
                      icon={FiUsers}
                    />
                    <SettingItem
                      title="Data Analytics"
                      description="Help us improve by sharing anonymous usage data"
                      checked={privacySettings.allowDataAnalytics}
                      onChange={() => updatePrivacySetting('allowDataAnalytics', !privacySettings.allowDataAnalytics)}
                      icon={FiSearch}
                    />
                    <SettingItem
                      title="Third-Party Sharing"
                      description="Allow sharing data with trusted third-party services"
                      checked={privacySettings.allowThirdPartySharing}
                      onChange={() => updatePrivacySetting('allowThirdPartySharing', !privacySettings.allowThirdPartySharing)}
                      icon={FiUsers}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FiShield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    <span>Account Security</span>
                  </h2>
                  <div className="space-y-3">
                    <SettingItem
                      title="Two-Factor Authentication"
                      description="Add an extra layer of security to your account"
                      checked={privacySettings.twoFactorAuthentication}
                      onChange={() => updatePrivacySetting('twoFactorAuthentication', !privacySettings.twoFactorAuthentication)}
                      icon={FiLock}
                    />
                    <SettingItem
                      title="Login Notifications"
                      description="Get notified of new login attempts"
                      checked={privacySettings.loginNotifications}
                      onChange={() => updatePrivacySetting('loginNotifications', !privacySettings.loginNotifications)}
                      icon={FiBell}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Session Timeout</h2>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto-logout after inactivity (minutes)
                    </label>
                    <select
                      value={privacySettings.sessionTimeout}
                      onChange={(e) => updatePrivacySetting('sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                      <option value={0}>Never</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPrivacyScreen; 