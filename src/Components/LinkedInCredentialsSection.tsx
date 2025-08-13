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
  const [showModal, setShowModal] = useState(false);
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
        setShowModal(false);
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

  // Function to blur email for display
  const blurEmail = (email: string) => {
    if (!email) return 'Email not available';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    
    if (localPart.length <= 2) {
      return `${localPart}***@${domain}`;
    } else {
      const visiblePart = localPart.substring(0, 2);
      const hiddenPart = '*'.repeat(Math.min(localPart.length - 2, 3));
      return `${visiblePart}${hiddenPart}@${domain}`;
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg border-4 border-[#984DE0] p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-800">LinkedIn Connection</h3>
        {hasCredentials && (
          <div className="flex items-center gap-2">
                          <button
                onClick={handleEdit}
                className="px-3 py-1 bg-blue-100 text-blue-600 font-semibold rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                Edit
              </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1 bg-red-100 text-red-600 font-semibold rounded-full text-sm hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        )}
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

          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-700 font-semibold">LinkedIn Connected</span>
            </div>
            <p className="text-gray-600 text-sm">Your LinkedIn account is connected to Kandu</p>
          </div>

                     <div className="bg-gray-50 rounded-xl p-4">
             <div className="flex items-center space-x-3 mb-3">
               <div className="w-8 h-8 bg-[#0077B5] rounded-full flex items-center justify-center">
                 <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                 </svg>
               </div>
               <span className="text-gray-700 font-medium">{blurEmail(savedCredentials?.email || '')}</span>
             </div>
             <p className="text-xs text-gray-500">Connected account • Encrypted connection</p>
           </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* OAuth-style Connection Flow */}
          {!isEditing ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-[#0077B5] rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <div className="w-8 h-8 bg-[#984DE0] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-[#984DE0] to-[#7300FF] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">K</span>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Connect your LinkedIn to Kandu</h4>
                <p className="text-gray-600 text-sm mb-6">Securely connect your LinkedIn account to enable automatic job applications</p>
              </div>

                             <button
                 onClick={() => setShowModal(true)}
                 className="w-full bg-[#0077B5] text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:bg-[#006097] transition-all duration-200 flex items-center justify-center space-x-3"
               >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>Sign in with LinkedIn</span>
              </button>

              
            </div>
          ) : (
            /* Credential Entry Form */
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Enter your LinkedIn credentials</h4>
                <p className="text-gray-600 text-sm">We'll securely connect your account to enable automatic applications</p>
              </div>

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
                  className="flex-1 bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-semibold py-3 px-4 rounded-xl shadow hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {saving ? 'Connecting...' : 'Connect Account'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl shadow hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>

              
            </div>
          )}
        </div>
      )}

      {/* LinkedIn Sign-in Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            {/* LinkedIn Header */}
            <div className="flex items-center justify-center mb-8">
              <svg className="w-8 h-8 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">Sign into LinkedIn</h2>
            <p className="text-gray-600 text-center mb-8">Stay updated on your professional world</p>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email or Phone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077B5] focus:border-[#0077B5]"
                  disabled={saving}
                />
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0077B5] focus:border-[#0077B5] pr-12"
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#0077B5] text-sm font-medium"
                    disabled={saving}
                  >
                    {showPassword ? 'hide' : 'show'}
                  </button>
                </div>
              </div>



              <button
                type="submit"
                disabled={saving || !email.trim() || !password.trim()}
                className="w-full bg-[#0077B5] text-white font-semibold py-3 px-4 rounded-md hover:bg-[#006097] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Connecting...' : 'Connect'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedInCredentialsSection; 