import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

interface VerifyEmailScreenProps {
  email: string;
  onResend?: () => void;
  onChangeEmail?: (newEmail: string) => void;
  onVerified?: () => void;
}

const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({ email, onResend, onChangeEmail, onVerified }) => {
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [newEmail, setNewEmail] = useState(email);
  const [changeStatus, setChangeStatus] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pinStatus, setPinStatus] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResendStatus(null);
    setResending(true);
    const { error } = await supabase.auth.resend({ email, type: 'signup' });
    if (error) setResendStatus('Failed to resend verification email.');
    else setResendStatus('Verification email resent!');
    if (onResend) onResend();
    setResending(false);
  };

  const handleChangeEmail = async () => {
    setChangeStatus(null);
    if (!newEmail) return;
    // Optionally, call a prop or handle email change logic here
    if (onChangeEmail) onChangeEmail(newEmail);
    setChangeStatus('Email change requested. Please check your new email.');
    setChanging(false);
  };

  const handleVerifyPin = async () => {
    setPinStatus(null);
    if (!pin || pin.length !== 6) {
      setPinStatus('Please enter the 6-digit code.');
      return;
    }
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: pin,
      type: 'email',
    });
    if (otpError) {
      setPinStatus('Invalid or expired code.');
      return;
    }
    // Now user is verified and signed in
    try {
      // Get the authenticated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setPinStatus('Could not get user after verification.');
        return;
      }
      // Check if this is an employer verification by checking if there's an employer record
      const { data: employerData, error: employerError } = await supabase
        .from('employers')
        .select('id')
        .eq('contact_email', userData.user.email)
        .single();
      
      // Only create profiles entry if this is not an employer
      if (!employerData || employerError) {
        await supabase.from('profiles').upsert([
          {
            id: userData.user.id,
            email: userData.user.email,
          }
        ], { onConflict: 'id' });
      }
      setPinStatus('Email verified and onboarding complete! Redirecting...');
      if (onResend) onResend(); // Optionally call onVerified/onResend
      if (onVerified) onVerified();
      // Optionally, redirect or call a callback here
    } catch (err: any) {
      setPinStatus('Verification error: ' + (err.message || String(err)));
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
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border-4 border-gray-250 p-6 flex flex-col items-center mt-16 mb-8">
        <h2 className="text-2xl font-bold text-black mb-2 text-center">Verify Your Email</h2>
        <div className="text-base text-gray-700 text-center mb-2">
          Welcome to the platform!
        </div>
        <div className="text-gray-600 text-center mb-8">
          Please check (<b>{email}</b>)
        </div>
        <div className="w-full flex flex-col items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1 text-center w-full">Enter the 6-digit code sent to your email:</label>
          <input
            type="text"
            value={pin}
            onChange={e => setPin(e.target.value)}
            maxLength={6}
            className="w-full border rounded px-3 py-2 text-center text-3xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
            placeholder="------"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
          <button
            className="w-full py-3 rounded-[1rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold shadow-lg mb-2 disabled:opacity-60"
            onClick={handleVerifyPin}
          >
            Verify Code
          </button>
          <button
            className="text-[#7300FF] underline text-base bg-transparent border-none shadow-none p-0 m-0 hover:text-[#6C00FF] focus:outline-none"
            style={{ minWidth: 0, minHeight: 0 }}
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? "Resending..." : "Resend OTP"}
          </button>
        </div>
        <button
          className="text-[#7300FF] underline text-base bg-transparent border-none shadow-none p-0 m-0 hover:text-[#6C00FF] focus:outline-none mt-2"
          style={{ minWidth: 0, minHeight: 0 }}
          onClick={() => setChanging(true)}
        >
          Change Email Address
        </button>
        {changing && (
          <div className="w-full flex flex-col items-center gap-2 mt-2">
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
              placeholder="Enter new email"
            />
            <div className="flex gap-2 w-full">
              <button
                className="flex-1 py-2 rounded-[1rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
                onClick={() => {
                  if (onChangeEmail && newEmail) {
                    onChangeEmail(newEmail);
                    setChangeStatus('Email updated! Please check your new email.');
                    setChanging(false);
                  }
                }}
              >
                Submit
              </button>
              <button
                className="flex-1 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-semibold border border-gray-300 hover:bg-gray-300 transition-colors"
                onClick={() => setChanging(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {changeStatus && <div className="text-green-600 text-center mt-2 text-sm">{changeStatus}</div>}
        {pinStatus && <div className="text-red-500 text-center mt-3 text-sm">{pinStatus}</div>}
        {resendStatus && <div className="text-sm text-center mt-2 text-gray-700">{resendStatus}</div>}
      </div>
      </div>
    </div>
  );
};

export default VerifyEmailScreen; 