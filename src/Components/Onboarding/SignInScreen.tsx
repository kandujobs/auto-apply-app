import React, { useState, useRef } from "react";
import { supabase } from '../../supabaseClient';

const SignInScreen: React.FC<{
  onSignIn: (emailOrPhone: string, password: string) => void;
  onGoogle: () => void;
  onForgotPassword: () => void;
  onGoToOnboarding: () => void;
  onGoToSignUp: () => void;
  error?: string | null;
  loading?: boolean;
}> = ({ onSignIn, onGoogle, onForgotPassword, onGoToOnboarding, onGoToSignUp, error, loading }) => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password.trim()) {
      return;
    }
    setLocalLoading(true);
    
    try {
      // Try to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrPhone.trim().toLowerCase(),
        password: password,
      });
      
      if (error) {
        // Pass the error to the parent component
        onSignIn(emailOrPhone, password);
      } else if (data.user) {
        // Successful sign in - let the parent handle the state update
        onSignIn(emailOrPhone, password);
      }
    } catch (err) {
      // Fallback to original behavior
      onSignIn(emailOrPhone, password);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!emailOrPhone.trim()) {
      setForgotPasswordMessage("Please enter your email address first.");
      return;
    }
    
    setForgotPasswordLoading(true);
    setForgotPasswordMessage("");
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailOrPhone.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        setForgotPasswordMessage(error.message);
      } else {
        setForgotPasswordMessage("Password reset email sent! Check your inbox.");
      }
    } catch (err) {
      setForgotPasswordMessage("Failed to send reset email. Please try again.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const isDisabled = loading || localLoading;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Top gradient bar */}
      <div className="absolute left-0 top-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-b-[2rem] h-16 transition-all duration-500" />
      {/* Bottom gradient bar */}
      <div className="absolute left-0 bottom-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-t-[2rem] h-16 transition-all duration-500" />
      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 z-10 w-full px-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border-4 border-gray-250 p-6 flex flex-col items-center mt-16 mb-8">
          <h2 className="text-2xl font-extrabold text-black mb-6 text-center">Welcome Back!</h2>
          
          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={onGoogle}
            disabled={isDisabled}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="w-full flex items-center mb-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <form onSubmit={handleSignIn} className="w-full">
            <div className="w-full mb-6">
              <label className="block text-gray-700 font-semibold mb-1">Email Address</label>
              <input 
                ref={inputRef}
                type="text" 
                className="w-full border rounded px-3 py-2" 
                value={emailOrPhone} 
                onChange={e => setEmailOrPhone(e.target.value)} 
                required 
                autoComplete="username" 
                disabled={isDisabled} 
              />
            </div>
            <div className="w-full mb-6">
              <label className="block text-gray-700 font-semibold mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border rounded px-3 py-2 pr-16"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isDisabled}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A100FF] text-sm font-medium focus:outline-none"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button
              type="button"
              className="text-[#A100FF] text-sm underline text-left w-full mb-4"
              onClick={handleForgotPassword}
              disabled={isDisabled || forgotPasswordLoading}
            >
              {forgotPasswordLoading ? 'Sending...' : 'Forgot password?'}
            </button>
            {forgotPasswordMessage && (
              <div className={`text-sm mb-4 w-full text-center ${forgotPasswordMessage.includes('sent') ? 'text-green-600' : 'text-red-500'}`}>
                {forgotPasswordMessage}
              </div>
            )}
            {error && <div className="text-red-500 text-sm mb-4 w-full text-center">{error}</div>}
            <button 
              type="submit" 
              disabled={isDisabled} 
              className="w-full py-3 rounded-[1rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold shadow-lg mt-2 disabled:opacity-60"
            >
              {localLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          
          <button
            type="button"
            className="text-[#7300FF] underline text-base mt-4"
            onClick={onGoToSignUp}
            disabled={isDisabled}
          >
            Don't have an account?
          </button>
          
          {/* Legal Links */}
          <div className="mt-6 text-center">
            <div className="flex justify-center gap-4 text-xs">
              <a
                href="https://kandujobs.com/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7300FF] hover:underline"
              >
                Terms of Service
              </a>
              <span className="text-gray-400">•</span>
              <a
                href="https://kandujobs.com/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7300FF] hover:underline"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInScreen; 