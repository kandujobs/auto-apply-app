import React, { useState } from "react";

const NY_LOCATIONS = [
  "New York, NY", "Buffalo, NY", "Rochester, NY", "Yonkers, NY", "Syracuse, NY", "Albany, NY", "New Rochelle, NY", "Mount Vernon, NY", "Schenectady, NY", "Utica, NY", "White Plains, NY", "Troy, NY", "Niagara Falls, NY", "Binghamton, NY", "Rome, NY", "Long Beach, NY", "Poughkeepsie, NY", "North Tonawanda, NY", "Jamestown, NY", "Ithaca, NY", "Elmira, NY", "Newburgh, NY", "Middletown, NY", "Auburn, NY", "Watertown, NY", "Glen Cove, NY", "Saratoga Springs, NY", "Kingston, NY", "Peekskill, NY", "Lockport, NY", "Plattsburgh, NY"
];

interface BasicInfoScreenProps {
  onContinue: (info: { name: string; location: string; radius: number }) => void;
  onBack: () => void;
  prefill?: any[] | null;
}

const BasicInfoScreen: React.FC<BasicInfoScreenProps> = ({ onContinue, onBack, prefill }) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [radius, setRadius] = useState(25);

  React.useEffect(() => {
    if (prefill && Array.isArray(prefill)) {
      const profileSection = prefill.find(s => s.title && s.title.toLowerCase() === 'profile');
      if (profileSection && Array.isArray(profileSection.fields)) {
        const nameField = profileSection.fields.find((f: any) => f.label.toLowerCase().includes('name'));
        const locationField = profileSection.fields.find((f: any) => f.label.toLowerCase().includes('location'));
        if (nameField) setName(nameField.value);
        if (locationField) setLocation(locationField.value);
      }
    }
  }, [prefill]);

  const filteredLocations = location.length > 0
    ? NY_LOCATIONS.filter(loc => loc.toLowerCase().includes(location.toLowerCase()))
    : NY_LOCATIONS;

  const handleLocationSelect = (loc: string) => {
    setLocation(loc);
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({ name, location, radius });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Top gradient bar */}
      <div className="absolute left-0 top-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-b-[2rem] h-32 transition-all duration-500" />
      {/* Bottom gradient bar */}
      <div className="absolute left-0 bottom-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-t-[2rem] h-32 transition-all duration-500" />
      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 z-10 w-full px-4 py-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border-4 border-gray-250 p-6 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-black mb-2 text-center w-full">Tell us about yourself</h2>
        <p className="text-base text-gray-500 mb-6 text-center w-full">Let's start with some basic information</p>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mb-6 relative">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0"
              required
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => {
                setLocation(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="City, State"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0"
              required
              autoComplete="off"
            />
            {showDropdown && filteredLocations.length > 0 && (
              <ul className="absolute left-0 right-0 bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-40 overflow-y-auto z-20">
                {filteredLocations.map(loc => (
                  <li
                    key={loc}
                    className="px-4 py-2 hover:bg-purple-100 cursor-pointer text-sm"
                    onMouseDown={() => handleLocationSelect(loc)}
                  >
                    {loc}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {location && (
            <div className="flex flex-col gap-2 mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Looking for jobs within</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <span className="text-sm font-semibold text-purple-700 w-12 text-right">{radius} mi</span>
              </div>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-[1rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold shadow-lg mt-2 disabled:opacity-60"
          >
            Continue
          </button>
        </form>
        <button
          className="text-[#7300FF] underline text-base mt-4"
          onClick={onBack}
        >
          Back to previous step
        </button>
      </div>
      </div>
    </div>
  );
};

export default BasicInfoScreen; 