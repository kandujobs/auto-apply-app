import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  saveLinkedInCredentials, 
  getLinkedInCredentials, 
  deleteLinkedInCredentials,
  hasLinkedInCredentials,
  LinkedInCredentials 
} from '../services/linkedinCredentials';

interface LinkedInCredentialsSectionProps {
  onCredentialsSaved?: (credentials: LinkedInCredentials) => void;
  onCredentialsDeleted?: () => void;
}

const LinkedInCredentialsSection: React.FC<LinkedInCredentialsSectionProps> = ({
  onCredentialsSaved,
  onCredentialsDeleted
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');
  const [savedCredentials, setSavedCredentials] = useState<{ email: string; password: string } | null>(null);

  // Load account email and check for existing credentials on component mount
  useEffect(() => {
    fetchAccountEmail();
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const result = await getLinkedInCredentials();
      if (result.success && result.credentials) {
        setSavedCredentials(result.credentials);
        setHasCredentials(true);
        // Pre-fill the form with saved credentials
        setEmail(result.credentials.email);
        setPassword(result.credentials.password);
      } else {
        setHasCredentials(false);
        setSavedCredentials(null);
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
      setHasCredentials(false);
      setSavedCredentials(null);
    }
  };

  const fetchAccountEmail = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return;
      }

      // First try to get email from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (!profileError && profile?.email) {
        setAccountEmail(profile.email);
        // Auto-fill email if no credentials exist yet
        if (!hasCredentials && !email) {
          setEmail(profile.email);
        }
        return;
      }

      // If no profile found, try to get email from auth.users
      if (user.email) {
        setAccountEmail(user.email);
        // Auto-fill email if no credentials exist yet
        if (!hasCredentials && !email) {
          setEmail(user.email);
        }
      }
    } catch (error) {
      console.error('Error fetching account email:', error);
      // Fallback to auth user email
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setAccountEmail(user.email);
          if (!hasCredentials && !email) {
            setEmail(user.email);
          }
        }
      } catch (fallbackError) {
        console.error('Error in fallback email fetch:', fallbackError);
      }
    }
  };

  const handleSave = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'Please fill in both email and password' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: 'error', text: 'Please log in to save credentials' });
        return;
      }

      const result = await saveLinkedInCredentials({ email: email.trim(), password: password.trim() });
      
      if (result.success) {
        setHasCredentials(true);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'LinkedIn credentials saved successfully!' });
        
        if (onCredentialsSaved) {
          onCredentialsSaved({ email: email.trim(), password: password.trim() });
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save credentials' });
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving credentials' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: 'error', text: 'Please log in to delete credentials' });
        return;
      }

      const result = await deleteLinkedInCredentials();
      
      if (result.success) {
        setHasCredentials(false);
        setEmail('');
        setPassword('');
        setMessage({ type: 'success', text: 'LinkedIn credentials deleted successfully!' });
        
        if (onCredentialsDeleted) {
          onCredentialsDeleted();
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete credentials' });
      }
    } catch (error) {
      console.error('Error deleting credentials:', error);
      setMessage({ type: 'error', text: 'An error occurred while deleting credentials' });
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEmail('');
    setPassword('');
  };

  const clearMessage = () => {
    setMessage(null);
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border-4 border-[#984DE0] p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-800">LinkedIn Credentials</h3>
        <div className="flex items-center gap-2">
          {hasCredentials && !isEditing && (
            <button
              onClick={handleEdit}
              className="px-3 py-1 bg-blue-100 text-blue-600 font-semibold rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              Edit
            </button>
          )}
          {hasCredentials && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1 bg-red-100 text-red-600 font-semibold rounded-full text-sm hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div 
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{message.text}</span>
            <button onClick={clearMessage} className="text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
        </div>
      )}

      {hasCredentials && !isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-green-700 font-medium">Credentials saved</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Email
            </label>
            <div className="px-3 py-2 border-2 border-gray-200 rounded-xl bg-gray-50 text-base text-gray-700">
              {savedCredentials?.email || 'Email not available'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Password
            </label>
            <div className="px-3 py-2 border-2 border-gray-200 rounded-xl bg-gray-50 text-base text-gray-700">
              ••••••••••••••••
            </div>
          </div>
          
          <p className="text-gray-600 text-sm text-center">Your LinkedIn credentials are configured and ready to use.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="linkedin-email" className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Email
            </label>
            <input
              id="linkedin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={accountEmail || "your.email@example.com"}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              disabled={saving}
            />
            {accountEmail && email === accountEmail && (
              <p className="text-xs text-gray-500 mt-1">
                Using your account email. Change if your LinkedIn email is different.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="linkedin-password" className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Password
            </label>
            <div className="relative">
              <input
                id="linkedin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your LinkedIn password"
                className="w-full px-3 py-2 pr-10 border-2 border-gray-300 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={saving}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !email.trim() || !password.trim()}
              className="flex-1 bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-semibold py-2 px-4 rounded-full shadow hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {saving ? 'Saving...' : 'Save Credentials'}
            </button>
            {isEditing && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-100 text-gray-600 font-semibold rounded-full shadow hover:bg-gray-200 transition-all duration-200"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedInCredentialsSection; 