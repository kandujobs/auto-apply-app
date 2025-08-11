import React, { useState, useEffect } from 'react';
import LocationSection from '../SmartFeedSections/LocationSection';
import EmployerTopNav from './EmployerTopNav';

const ROLES = [
  'CEO',
  'Recruiter',
  'HR',
  'Founder',
  'Other',
];

interface EmployerOnboardingScreenProps {
  onNext: (data: {
    companyName: string;
    location: string;
    radius: number;
    latitude: number;
    longitude: number;
    companyWebsite: string;
  }) => void;
}

const EmployerOnboardingScreen: React.FC<EmployerOnboardingScreenProps> = ({ onNext }) => {
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(5);
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.006);
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchEmployer() {
      const { data: userData, error: userError } = await import('../../supabaseClient').then(m => m.supabase.auth.getUser());
      if (userError || !userData.user) return;
      const { data: employer, error: employerError } = await import('../../supabaseClient').then(m => m.supabase
        .from('employers')
        .select('company_name, location, radius, latitude, longitude, company_website')
        .eq('id', userData.user.id)
        .single());
      if (employerError || !employer) return;
      if (employer.company_name) setCompanyName(employer.company_name);
      if (employer.location) setLocation(employer.location);
      if (employer.radius) setRadius(employer.radius);
      if (employer.latitude) setLatitude(employer.latitude);
      if (employer.longitude) setLongitude(employer.longitude);
      if (employer.company_website) setCompanyWebsite(employer.company_website);
    }
    fetchEmployer();
  }, []);

  const handleLocationUpdated = (loc: string, rad: number, lat: number, lng: number) => {
    setLocation(loc);
    setRadius(rad);
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !location.trim()) {
      setError('Please fill out all required fields.');
      return;
    }
    setError('');
    onNext({ companyName, location, radius, latitude, longitude, companyWebsite });
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col items-center justify-between">
      {/* Top Nav Gradient */}
      <EmployerTopNav />
      {/* Centered Card */}
      <div className="flex-1 flex items-center justify-center px-4 w-full mt-32 mb-32">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full flex flex-col items-center">
          <h2 className="text-2xl font-extrabold text-black mb-2 text-center">Tell us about your company</h2>
          <div className="w-full mb-6">
            <label className="block text-gray-700 font-semibold mb-1">Company Name <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border rounded px-3 py-2" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
          </div>
          <div className="w-full mb-6">
            <label className="block text-gray-700 font-semibold mb-1">Location <span className="text-red-500">*</span></label>
            <LocationSection
              location={location}
              radius={radius}
              latitude={latitude}
              longitude={longitude}
              onLocationUpdated={handleLocationUpdated}
            />
          </div>
          <div className="w-full mb-6">
            <label className="block text-gray-700 font-semibold mb-1">Company Website</label>
            <input type="url" className="w-full border rounded px-3 py-2" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="https://" />
          </div>
          {error && <div className="text-red-500 text-sm mb-4 w-full text-center">{error}</div>}
          <button type="submit" className="w-full py-3 rounded-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white text-lg font-bold shadow-lg hover:from-[#7300FF] hover:to-[#984DE0] transition-colors mt-2">Continue</button>
        </form>
      </div>
      {/* Bottom Nav Gradient */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-t-[2rem] p-8 z-10 flex items-center justify-center" />
    </div>
  );
};

export default EmployerOnboardingScreen; 