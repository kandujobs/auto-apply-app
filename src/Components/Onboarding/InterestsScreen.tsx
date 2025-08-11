import React, { useState } from "react";

interface InterestsScreenProps {
  onContinue: (info: { skills: string[]; interests: string[] }) => void;
  onBack: () => void;
  prefill?: any[] | null;
}

const InterestsScreen: React.FC<InterestsScreenProps> = ({ onContinue, onBack, prefill }) => {
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  React.useEffect(() => {
    if (prefill && Array.isArray(prefill)) {
      const skillsSection = prefill.find(s => s.title && s.title.toLowerCase() === 'skills');
      if (skillsSection && Array.isArray(skillsSection.fields)) {
        setSkills((skillsSection.fields as any[])
          .flatMap((f: any) =>
            typeof f.value === 'string'
              ? f.value.split(/[,;•\n]/).map((s: string) => s.trim()).filter(Boolean)
              : []
          )
        );
      }
      const interestsSection = prefill.find(s => s.title && s.title.toLowerCase() === 'interests');
      if (interestsSection && Array.isArray(interestsSection.fields)) {
        setInterests((interestsSection.fields as any[]).map((f: any) => f.value).filter(Boolean));
      }
    }
  }, [prefill]);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed].filter(Boolean));
      setSkillInput("");
    }
  };
  const addInterest = () => {
    const trimmed = interestInput.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed].filter(Boolean));
      setInterestInput("");
    }
  };
  const removeSkill = (skill: string) => setSkills(skills.filter(s => s !== skill));
  const removeInterest = (interest: string) => setInterests(interests.filter(i => i !== interest));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({ skills, interests });
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 z-10 w-full px-4">
      <div className="w-full max-w-sm min-h-[65vh] bg-white rounded-3xl shadow-lg border-4 border-gray-300 p-6 flex flex-col items-center mt-6 mb-8 overflow-y-auto">
        <h2 className="text-2xl font-bold text-black mb-2 text-center w-full">Your Interests</h2>
        <p className="text-base text-gray-500 mb-6 text-center w-full">What are you passionate about?</p>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 mb-6">
          <div>
            <label className="block text-lg font-bold text-black mb-2">Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                placeholder="Add a skill..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0 text-base"
              />
              <button type="button" onClick={addSkill} className="px-3 py-1 bg-gray-200 rounded-lg font-semibold hover:bg-purple-100 transition-colors text-sm">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.filter(Boolean).map((skill, i) => (
                <span key={skill + i} className="bg-purple-200 text-purple-700 font-bold text-xs rounded-full px-3 py-1 flex items-center gap-1">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="ml-1 text-purple-700 hover:text-purple-900">×</button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-lg font-bold text-black mb-2">Interests</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={interestInput}
                onChange={e => setInterestInput(e.target.value)}
                placeholder="Add an interest..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0 text-base"
              />
              <button type="button" onClick={addInterest} className="px-3 py-1 bg-gray-200 rounded-lg font-semibold hover:bg-purple-100 transition-colors text-sm">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {interests.filter(Boolean).map((interest, i) => (
                <span key={interest + i} className="bg-purple-200 text-purple-700 font-bold text-xs rounded-full px-3 py-1 flex items-center gap-1">
                  {interest}
                  <button type="button" onClick={() => removeInterest(interest)} className="ml-1 text-purple-700 hover:text-purple-900">×</button>
                </span>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-[#A100FF] text-white text-lg font-semibold shadow-lg hover:bg-[#6C00FF] transition-colors mt-2"
          >
            Continue
          </button>
        </form>
        <button
          className="text-[#6C00FF] underline text-[15px]"
          onClick={onBack}
        >
          Back to previous step
        </button>
      </div>
    </div>
  );
};

export default InterestsScreen;
