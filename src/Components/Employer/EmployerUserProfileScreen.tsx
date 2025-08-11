import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import EmployerTopNav from './EmployerTopNav';

interface EmployerUserProfileScreenProps {
  onHome: () => void;
  onCreate: () => void;
  onQuestions: () => void;
  onUserSettings: () => void;
  onApplicants?: () => void;
  onCompanyProfile?: () => void;
}

const EmployerUserProfileScreen: React.FC<EmployerUserProfileScreenProps> = ({ onHome, onCreate, onQuestions, onUserSettings, onApplicants, onCompanyProfile }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [employerInfo, setEmployerInfo] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError('Could not get user.');
        setLoading(false);
        return;
      }
      const { data: employer, error: employerError } = await supabase
        .from('employers')
        .select('*')
        .eq('id', userData.user.id)
        .single();
      if (employerError || !employer) {
        setError('Could not fetch profile.');
        setLoading(false);
        return;
      }
      setEmployerInfo(employer);
      setLoading(false);
    }
    fetchUser();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError('Could not get user.');
      setLoading(false);
      return;
    }
    const { error: updateError } = await supabase
      .from('employers')
      .update({ employer_name: name, email, phone })
      .eq('id', userData.user.id);
    if (updateError) {
      setError('Failed to save profile: ' + updateError.message);
      setLoading(false);
      return;
    }
    setSuccess('Profile updated!');
    setLoading(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.reload(); // Or redirect to login if you have routing
  };

  // Example articles for interview tips and other sections
  const interviewTips = [
    { title: 'How to Structure an Interview', url: 'https://example.com/structure', summary: 'Best practices for structuring interviews.' },
    { title: 'Behavioral Questions to Ask', url: 'https://example.com/behavioral', summary: 'Top behavioral questions for candidates.' },
    { title: 'Avoiding Bias', url: 'https://example.com/bias', summary: 'Tips to reduce bias in interviews.' },
  ];
  const onboardingResources = [
    { title: 'Onboarding Checklist', url: 'https://example.com/onboarding', summary: 'A checklist for onboarding new hires.' },
    { title: 'First Day Tips', url: 'https://example.com/firstday', summary: 'How to make a great first impression.' },
  ];
  const legalGuides = [
    { title: 'Interview Compliance', url: 'https://example.com/compliance', summary: 'Legal do\'s and don\'ts for interviews.' },
    { title: 'Diversity Hiring', url: 'https://example.com/diversity', summary: 'Building a diverse team.' },
  ];

  const renderHorizontalSection = (title: string, articles: { title: string; url: string; summary: string }[]) => (
    <div className="mb-8 w-full">
      <h3 className="text-lg font-bold mb-2 text-gray-800">{title}</h3>
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {articles.map((a, i) => (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-[220px] bg-white rounded-xl shadow p-4 flex-shrink-0 hover:shadow-lg transition-shadow border border-gray-100"
          >
            <div className="font-semibold text-purple-700 mb-1">{a.title}</div>
            <div className="text-xs text-gray-500">{a.summary}</div>
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <EmployerTopNav onCreate={onCreate} onQuestions={onQuestions} onUserSettings={onUserSettings} />
      <div className="w-full max-w-2xl px-4 pt-40 pb-12 mb-32">
        <h1 className="text-3xl font-extrabold text-black mb-1 text-center">Your Profile</h1>
        <div className="text-md text-gray-500 mb-8 text-center">Your information and tips to help you as an interviewer</div>
        {renderHorizontalSection('Interview Tips', interviewTips)}
        {renderHorizontalSection('Onboarding Resources', onboardingResources)}
        {renderHorizontalSection('Legal & Compliance Guides', legalGuides)}
        <div className="w-full mb-4">
          <div className="text-gray-700 font-semibold">Name:</div>
          <div className="text-gray-900 mb-2">{employerInfo?.employer_name || '-'}</div>
          <div className="text-gray-700 font-semibold">Email:</div>
          <div className="text-gray-900 mb-2">{employerInfo?.contact_email || '-'}</div>
          <div className="text-gray-700 font-semibold">Role at Company:</div>
          <div className="text-gray-900 mb-2">{employerInfo?.role_at_company || '-'}</div>
          <div className="text-gray-700 font-semibold">Company Name:</div>
          <div className="text-gray-900 mb-2">{employerInfo?.company_name || '-'}</div>
          <div className="text-gray-700 font-semibold">Company Website:</div>
          <div className="text-gray-900 mb-2">{employerInfo?.company_website || '-'}</div>
          <div className="text-gray-700 font-semibold">Location:</div>
          <div className="text-gray-900 mb-2">{employerInfo?.location || '-'}</div>
          <div className="text-gray-700 font-semibold">Phone:</div>
          <div className="text-gray-900 mb-2">{employerInfo?.phone || '-'}</div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full py-3 rounded-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white text-lg font-bold shadow-lg hover:from-[#7300FF] hover:to-[#984DE0] transition-colors mt-2 disabled:opacity-60"
        >
          {signingOut ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
      {/* Bottom Nav Gradient - Updated to match CreateNewListingScreen */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-t-[2rem] p-8 z-10 flex items-center justify-center">
        <div className="w-fit mx-auto bg-white rounded-3xl flex justify-center items-center gap-6 py-3 px-8 shadow-lg border-2 border-gray-400">
          <button
            onClick={onCompanyProfile || onUserSettings}
            className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Profile
          </button>
          <button
            onClick={onHome}
            className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Home
          </button>
          <button
            onClick={onApplicants || onCreate}
            className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105"
          >
            Applicants
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployerUserProfileScreen; 