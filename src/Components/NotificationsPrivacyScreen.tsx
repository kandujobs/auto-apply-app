import React, { useState } from 'react';

interface NotificationsPrivacyScreenProps {
  goBack?: () => void;
}

const NotificationsPrivacyScreen: React.FC<NotificationsPrivacyScreenProps> = ({ goBack }) => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [jobMatchNotifications, setJobMatchNotifications] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [publicSearch, setPublicSearch] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 pt-40 pb-40 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center mb-6">
          <button onClick={goBack} className="mr-4 text-purple-600 font-bold text-lg hover:underline">Back</button>
          <h1 className="text-2xl font-bold">Notifications & Privacy Preferences</h1>
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Notifications</h2>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700">Email Notifications</span>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={() => setEmailNotifications(v => !v)}
              className="w-5 h-5 accent-purple-600"
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700">Push Notifications</span>
            <input
              type="checkbox"
              checked={pushNotifications}
              onChange={() => setPushNotifications(v => !v)}
              className="w-5 h-5 accent-purple-600"
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700">Job Match Notifications</span>
            <input
              type="checkbox"
              checked={jobMatchNotifications}
              onChange={() => setJobMatchNotifications(v => !v)}
              className="w-5 h-5 accent-purple-600"
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700">Weekly Summary Emails</span>
            <input
              type="checkbox"
              checked={weeklySummary}
              onChange={() => setWeeklySummary(v => !v)}
              className="w-5 h-5 accent-purple-600"
            />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Privacy</h2>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700">Profile Visible to Employers</span>
            <input
              type="checkbox"
              checked={profileVisibility}
              onChange={() => setProfileVisibility(v => !v)}
              className="w-5 h-5 accent-purple-600"
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700">Allow Messages from Employers</span>
            <input
              type="checkbox"
              checked={allowMessages}
              onChange={() => setAllowMessages(v => !v)}
              className="w-5 h-5 accent-purple-600"
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700">Show Profile in Public Search</span>
            <input
              type="checkbox"
              checked={publicSearch}
              onChange={() => setPublicSearch(v => !v)}
              className="w-5 h-5 accent-purple-600"
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700">Two-Factor Authentication</span>
            <input
              type="checkbox"
              checked={twoFactor}
              onChange={() => setTwoFactor(v => !v)}
              className="w-5 h-5 accent-purple-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPrivacyScreen; 