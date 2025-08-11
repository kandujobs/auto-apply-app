import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import EmployerTopNav from './EmployerTopNav';

const ROLES = [
  'CEO',
  'Recruiter',
  'HR',
  'Founder',
  'Other',
];

const EmployerDetailsScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [employerName, setEmployerName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [roleAtCompany, setRoleAtCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchEmployer() {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) return;
      const { data: employer, error: employerError } = await supabase
        .from('employers')
        .select('employer_name, company_website, role_at_company')
        .eq('id', userData.user.id)
        .single();
      if (employerError || !employer) return;
      if (employer.employer_name) setEmployerName(employer.employer_name);
      if (employer.company_website) setCompanyWebsite(employer.company_website);
      if (employer.role_at_company) setRoleAtCompany(employer.role_at_company);
    }
    fetchEmployer();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerName.trim() || !companyWebsite.trim() || !roleAtCompany.trim()) {
      setError('Please fill out all required fields.');
      return;
    }
    setError('');
    setLoading(true);
    // Update employer_name, company_website, and role_at_company in supabase
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError('Could not get user.');
      setLoading(false);
      return;
    }
    const { error: updateError } = await supabase
      .from('employers')
      .update({ employer_name: employerName, company_website: companyWebsite, role_at_company: roleAtCompany })
      .eq('id', userData.user.id);
    if (updateError) {
      setError('Failed to save details: ' + updateError.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    onComplete();
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col items-center justify-between">
      {/* Top Nav Gradient */}
      <EmployerTopNav />
      {/* Centered Card */}
      <div className="flex-1 flex items-center justify-center px-4 w-full mt-32 mb-32">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
          <h2 className="text-2xl font-extrabold text-black mb-2 text-center">Your Details</h2>
          <div className="text-xs text-gray-500 mb-4 text-center">* are required fields</div>
          <div className="w-full mb-6">
            <label className="block text-gray-700 font-semibold mb-1">Your Name <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border rounded px-3 py-2" value={employerName} onChange={e => setEmployerName(e.target.value)} required />
          </div>
          <div className="w-full mb-6">
            <label className="block text-gray-700 font-semibold mb-1">Company Website <span className="text-red-500">*</span></label>
            <input type="url" className="w-full border rounded px-3 py-2" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} required placeholder="https://" />
          </div>
          <div className="w-full mb-6">
            <label className="block text-gray-700 font-semibold mb-1">Role at Company <span className="text-red-500">*</span></label>
            <select className="w-full border rounded px-3 py-2" value={roleAtCompany} onChange={e => setRoleAtCompany(e.target.value)} required>
              <option value="" disabled>Select a role</option>
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          {error && <div className="text-red-500 text-sm mb-4 w-full text-center">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white text-lg font-bold shadow-lg hover:from-[#7300FF] hover:to-[#984DE0] transition-colors mt-2 disabled:opacity-60">
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
      {/* Bottom Nav Gradient */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-t-[2rem] p-8 z-10 flex items-center justify-center" />
    </div>
  );
};

export default EmployerDetailsScreen; 