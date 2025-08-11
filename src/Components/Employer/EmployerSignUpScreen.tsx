import React, { useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import EmployerOnboardingScreen from './EmployerOnboardingScreen';
import { useEffect } from 'react';
import EmployerDetailsScreen from './EmployerDetailsScreen';

const EmployerVerifyEmailScreen: React.FC<{
  onContinue: (code: string) => Promise<void>;
  onBack: () => void;
  email: string;
  onResend: () => Promise<void>;
  onChangeEmail: () => void;
  resendCooldown: number;
  resendError: string;
}> = ({ onContinue, onBack, email, onResend, onChangeEmail, resendCooldown, resendError }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isCodeValid = code.length === 6 && /^\d{6}$/.test(code);

  const handleContinue = async () => {
    setError('');
    setLoading(true);
    try {
      await onContinue(code);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border-4 border-gray-300 p-6 flex flex-col items-center mt-6 mb-8">
      <h2 className="text-2xl font-extrabold text-black mb-2 text-center">Verify Your Email</h2>
      <p className="text-gray-700 text-center mb-6">We sent a 6-digit code to <span className="font-semibold">{email}</span>.<br/>Please enter it below to verify your account.</p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        pattern="\d{6}"
        className="w-full border rounded px-3 py-2 text-center text-lg tracking-widest mb-4"
        value={code}
        onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
        placeholder="------"
      />
      <button
        className="w-full py-3 rounded-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white text-lg font-bold shadow-lg hover:from-[#7300FF] hover:to-[#984DE0] transition-colors mt-2 disabled:opacity-60"
        onClick={handleContinue}
        disabled={!isCodeValid || loading}
      >
        {loading ? 'Verifying...' : 'Continue'}
      </button>
      <div className="flex flex-col items-center w-full mt-3 gap-1">
        <button
          type="button"
          className="text-sm text-[#984DE0] underline hover:text-[#7300FF] focus:outline-none disabled:opacity-60"
          onClick={onResend}
          disabled={resendCooldown > 0}
        >
          {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
        </button>
        <button
          type="button"
          className="text-sm text-[#984DE0] underline hover:text-[#7300FF] focus:outline-none"
          onClick={onChangeEmail}
        >
          Change email address
        </button>
      </div>
      {resendError && <div className="text-red-500 text-xs mt-2 w-full text-center">{resendError}</div>}
      {error && <div className="text-red-500 text-xs mt-2 w-full text-center">{error}</div>}
      <button
        type="button"
        className="mt-4 text-sm text-gray-500 underline hover:text-gray-700 focus:outline-none"
        onClick={onBack}
      >
        Back
      </button>
    </div>
  );
};

const EmployerSignUpScreen: React.FC<{
  onSignUpComplete?: (emailOrPhone: string) => void;
  onBack?: () => void;
  onVerifyComplete?: (emailOrPhone: string) => void; // Make optional
}> = ({ onSignUpComplete, onBack, onVerifyComplete = () => {} }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showEmployerOnboarding, setShowEmployerOnboarding] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendError, setResendError] = useState('');
  const resendInterval = useRef<NodeJS.Timeout | null>(null);
  const [showEmployerDetails, setShowEmployerDetails] = useState(false);
  const [employerData, setEmployerData] = useState(null);
  // Add step state for persistence
  const [step, setStep] = useState(() => {
    return localStorage.getItem('employerOnboardingStep') || 'signup';
  });

  // Sync step to localStorage
  useEffect(() => {
    localStorage.setItem('employerOnboardingStep', step);
  }, [step]);

  // Helper to clear onboarding progress (e.g., after completion)
  const clearOnboardingProgress = () => {
    localStorage.removeItem('employerOnboardingStep');
    localStorage.removeItem('employerOnboardingData');
    localStorage.removeItem('employerEmailOrPhone');
  };

  // Save email/phone for restore
  useEffect(() => {
    if (emailOrPhone) localStorage.setItem('employerEmailOrPhone', emailOrPhone);
  }, [emailOrPhone]);
  useEffect(() => {
    const saved = localStorage.getItem('employerEmailOrPhone');
    if (saved && !emailOrPhone) setEmailOrPhone(saved);
  }, []);

  // Save onboarding data for restore
  useEffect(() => {
    if (employerData) localStorage.setItem('employerOnboardingData', JSON.stringify(employerData));
  }, [employerData]);
  useEffect(() => {
    const saved = localStorage.getItem('employerOnboardingData');
    if (saved && !employerData) setEmployerData(JSON.parse(saved));
  }, []);

  // Step logic
  const goToStep = (newStep: string) => setStep(newStep);

  useEffect(() => {
    if (resendCooldown > 0) {
      resendInterval.current = setInterval(() => {
        setResendCooldown(cooldown => {
          if (cooldown <= 1) {
            if (resendInterval.current) clearInterval(resendInterval.current);
            return 0;
          }
          return cooldown - 1;
        });
      }, 1000);
      return () => { if (resendInterval.current) clearInterval(resendInterval.current); };
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password.trim()) {
      setError('Please fill out all fields.');
      return;
    }
    setError('');
    setLoading(true);
    setError('Checking account status...');
    
    const normalizedEmail = emailOrPhone.trim().toLowerCase();
    
    // First, check if user already exists by trying to sign in
    const { data: existingUser, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    
    if (existingUser?.user) {
      // User exists and password is correct, sign them out and redirect to sign in
      await supabase.auth.signOut();
      setLoading(false);
      setError('An account with this email already exists. Redirecting to sign in...');
      setTimeout(() => {
        if (onBack) onBack();
      }, 2000);
      return;
    }
    
    // If sign in failed but not due to wrong password, check if user exists with different method
    if (signInError && !signInError.message.toLowerCase().includes('invalid login credentials')) {
      // Try to check if user exists by attempting to reset password (this will fail if user doesn't exist)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: 'http://localhost:3000' // Dummy URL
      });
      
      if (!resetError || resetError.message.toLowerCase().includes('user not found')) {
        // User doesn't exist, proceed with account creation
      } else {
        // User exists, redirect to sign in
        setLoading(false);
        setError('An account with this email already exists. Redirecting to sign in...');
        setTimeout(() => {
          if (onBack) onBack();
        }, 2000);
        return;
      }
    }
    
    // Try to create a new user with Supabase Auth
    let signUpResult;
    if (emailOrPhone.includes('@')) {
      signUpResult = await supabase.auth.signUp({ email: normalizedEmail, password });
    } else {
      signUpResult = await supabase.auth.signUp({ phone: emailOrPhone, password });
    }
    setLoading(false);
    if (signUpResult.error) {
      if (signUpResult.error.message && signUpResult.error.message.toLowerCase().includes('user already registered')) {
        // Account already exists, redirect to sign in
        setError('An account with this email already exists. Redirecting to sign in...');
        setTimeout(() => {
          if (onBack) onBack();
        }, 2000);
        return;
      } else {
        setError(signUpResult.error.message);
      }
      return;
    }
    setShowVerify(true);
    setResendCooldown(60);
    setResendError('');
    goToStep('verify');
  };

  const handleResend = async () => {
    setResendError('');
    setResendCooldown(60);
    let result;
    if (emailOrPhone.includes('@')) {
      result = await supabase.auth.resend({ type: 'signup', email: emailOrPhone });
      if (result?.error) {
        setResendError(result.error.message);
      }
    } else {
      setResendError('If you did not receive an SMS, please try again later or check your phone number.');
    }
  };

  const handleChangeEmail = () => {
    setShowVerify(false);
    setResendCooldown(0);
    setResendError('');
    setPassword('');
  };

  const handleVerify = async (code: string) => {
    if (!emailOrPhone) throw new Error('Missing email.');
    const { error } = await supabase.auth.verifyOtp({
      email: emailOrPhone,
      token: code,
      type: 'email',
    });
    if (error) throw new Error('Invalid or expired code.');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('Could not get user after verification.');
    const employerRow = { id: userData.user.id, contact_email: userData.user.email, company_name: 'Not Given' };
    console.log('Upserting employer row:', employerRow);
    const { error: upsertError } = await supabase.from('employers').upsert([
      employerRow
    ], { onConflict: 'id' });
    if (upsertError) {
      console.error('Supabase upsert error:', upsertError.message);
      throw new Error('Failed to create employer row: ' + upsertError.message);
    }
    setShowEmployerOnboarding(true);
    goToStep('onboarding');
  };

  const handleEmployerOnboardingNext = async (data: any) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return;
    await supabase.from('employers').update({
      company_name: data.companyName,
      location: data.location,
      radius: data.radius,
      latitude: data.latitude,
      longitude: data.longitude,
      company_website: data.companyWebsite
    }).eq('id', userData.user.id);
    setEmployerData(data);
    setShowEmployerDetails(true);
    goToStep('details');
  };

  // Step-based rendering
  if (step === 'details' && showEmployerDetails) {
    return <EmployerDetailsScreen onComplete={() => { clearOnboardingProgress(); /* handle next step here */ }} />;
  }
  if (step === 'onboarding' && showEmployerOnboarding) {
    return <EmployerOnboardingScreen onNext={handleEmployerOnboardingNext} />;
  }
  if (step === 'verify' && showVerify) {
    return <EmployerVerifyEmailScreen
      email={emailOrPhone}
      onContinue={handleVerify}
      onBack={onBack || (() => {})}
      onResend={handleResend}
      onChangeEmail={handleChangeEmail}
      resendCooldown={resendCooldown}
      resendError={resendError}
    />;
  }
  // Default: signup
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-3xl shadow-lg border-4 border-gray-300 p-6 flex flex-col items-center mt-6 mb-8">
      <h2 className="text-2xl font-extrabold text-black mb-2 text-center">Create Your Employer Account</h2>
      <div className="w-full mb-6">
        <label className="block text-gray-700 font-semibold mb-1">Email or Phone</label>
        <input type="text" className="w-full border rounded px-3 py-2" value={emailOrPhone} onChange={e => setEmailOrPhone(e.target.value)} required autoComplete="username" />
      </div>
      <div className="w-full mb-6">
        <label className="block text-gray-700 font-semibold mb-1">Password</label>
        <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
      </div>
      {error && <div className="text-red-500 text-sm mb-4 w-full text-center">{error}</div>}
      <button type="submit" disabled={loading} className="w-full py-3 rounded-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white text-lg font-bold shadow-lg hover:from-[#7300FF] hover:to-[#984DE0] transition-colors mt-2 disabled:opacity-60">
        {loading ? 'Signing Up...' : 'Sign Up'}
      </button>
      <button
        type="button"
        className="mt-4 text-sm text-gray-500 underline hover:text-gray-700 focus:outline-none"
        onClick={onBack}
      >
        Back
      </button>
    </form>
  );
};

export default EmployerSignUpScreen; 