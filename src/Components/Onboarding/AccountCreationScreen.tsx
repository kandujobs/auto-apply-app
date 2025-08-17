import React, { useState } from "react";

interface AccountCreationScreenProps {
  onGoogle: () => void;
  onLinkedIn: () => void;
  onEmailOrPhone?: (emailOrPhone: string, password: string) => void;
  onBack?: () => void;
  error?: string | null;
  loading?: boolean;
}

const AccountCreationScreen: React.FC<AccountCreationScreenProps> = ({ onGoogle, onLinkedIn, onEmailOrPhone, onBack, error, loading }) => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone || !password) {
      return;
    }
    if (onEmailOrPhone) onEmailOrPhone(emailOrPhone, password);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Top gradient bar */}
      <div className="absolute left-0 top-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-b-[2rem] h-16 transition-all duration-500" />
      {/* Bottom gradient bar */}
      <div className="absolute left-0 bottom-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-t-[2rem] h-16 transition-all duration-500" />
      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 z-10 w-full px-4">
        <form onSubmit={handleCreateAccount} className="w-full max-w-sm bg-white rounded-3xl shadow-lg border-4 border-gray-250 p-6 flex flex-col items-center mt-16 mb-8">
          <h2 className="text-2xl font-extrabold text-black mb-6 text-center">Create Your Account</h2>
          <div className="w-full mb-6">
            <label className="block text-gray-700 font-semibold mb-1">Email or Phone</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={emailOrPhone} onChange={e => setEmailOrPhone(e.target.value)} required autoComplete="username" disabled={loading} />
          </div>
          <div className="w-full mb-6">
            <label className="block text-gray-700 font-semibold mb-1">Password</label>
            <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" disabled={loading} />
          </div>
          {error && <div className="text-red-500 text-sm mb-4 w-full text-center">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-[1rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold shadow-lg mt-2 disabled:opacity-60">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
          {onBack && (
            <button
              type="button"
              className="text-[#7300FF] underline text-base mt-4"
              onClick={onBack}
              disabled={loading}
            >
              Back to Sign In
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AccountCreationScreen; 