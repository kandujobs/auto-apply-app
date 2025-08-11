import React, { useState, useRef } from "react";
import { supabase } from '../../supabaseClient';

const SignInScreen: React.FC<{
  onSignIn: (emailOrPhone: string, password: string) => void;
  onForgotPassword: () => void;
  onGoToOnboarding: () => void;
  onGoToSignUp: () => void;
  error?: string | null;
}> = ({ onSignIn, onForgotPassword, onGoToOnboarding, onGoToSignUp, error }) => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    
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
      setLoading(false);
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

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Top gradient bar */}
      <div className="absolute left-0 top-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-b-[2rem] h-32 transition-all duration-500" />
      {/* Bottom gradient bar */}
      <div className="absolute left-0 bottom-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-t-[2rem] h-32 transition-all duration-500" />
      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 z-10 w-full px-4">
        <form onSubmit={handleSignIn} className="w-full max-w-sm bg-white rounded-3xl shadow-lg border-4 border-gray-250 p-6 flex flex-col items-center mt-16 mb-8">
          <h2 className="text-2xl font-extrabold text-black mb-6 text-center">Welcome Back!</h2>
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
              disabled={loading} 
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
                disabled={loading}
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
            disabled={loading || forgotPasswordLoading}
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
            disabled={loading} 
            className="w-full py-3 rounded-[1rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold shadow-lg mt-2 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <button
            type="button"
            className="text-[#7300FF] underline text-base mt-4"
            onClick={onGoToSignUp}
            disabled={loading}
          >
            Don't have an account?
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignInScreen; 