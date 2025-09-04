import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

interface InterestsScreenProps {
  onContinue: (info: { skills: string[]; interests: string[] }) => void;
  onBack: () => void;
  prefill?: any[] | null;
}

// Predefined options for skills and interests
const PREDEFINED_SKILLS = [
  // Technical Skills
  "JavaScript", "Python", "React", "SQL", "Git", "AWS", "Excel", "PowerPoint",
  "Word", "Photoshop", "Illustrator", "AutoCAD", "QuickBooks", "Salesforce",
  
  // Soft Skills
  "Communication", "Leadership", "Problem Solving", "Teamwork", "Time Management",
  "Customer Service", "Sales", "Negotiation", "Public Speaking", "Writing",
  "Critical Thinking", "Creativity", "Adaptability", "Organization",
  
  // Industry-Specific Skills
  "Project Management", "Data Analysis", "Marketing", "Accounting", "Design",
  "Teaching", "Nursing", "Cooking", "Welding", "Carpentry", "Plumbing",
  "Electrical Work", "HVAC", "Automotive Repair", "Hair Styling", "Makeup",
  "Photography", "Video Editing", "Graphic Design", "Content Creation",
  "Social Media Management", "Event Planning", "Human Resources", "Legal Research",
  "Medical Terminology", "Pharmacy", "Dental Hygiene", "Physical Therapy",
  "Real Estate", "Insurance", "Banking", "Retail Management", "Warehouse Operations",
  "Logistics", "Supply Chain", "Quality Control", "Manufacturing", "Construction"
];

const PREDEFINED_INTERESTS = [
  // Technology & Innovation
  "Technology", "Artificial Intelligence", "Web Development", "Mobile Apps",
  "Cybersecurity", "Cloud Computing", "Data Science", "Blockchain", "Gaming",
  
  // Business & Finance
  "Business", "Entrepreneurship", "Startups", "Finance", "Investing", "Real Estate",
  "Marketing", "Sales", "E-commerce", "Consulting", "Management",
  
  // Creative & Design
  "Design", "Art", "Photography", "Video Production", "Music", "Fashion",
  "Interior Design", "Architecture", "Graphic Design", "Animation", "Writing",
  
  // Healthcare & Wellness
  "Healthcare", "Medicine", "Nursing", "Mental Health", "Fitness", "Nutrition",
  "Wellness", "Alternative Medicine", "Public Health", "Pharmacy",
  
  // Education & Learning
  "Education", "Teaching", "Learning", "Research", "Academic Writing", "Training",
  "Curriculum Development", "Special Education", "Online Learning",
  
  // Social Impact & Environment
  "Sustainability", "Environmental Science", "Social Justice", "Non-profit",
  "Community Service", "Volunteering", "Human Rights", "Animal Welfare",
  "Climate Change", "Renewable Energy",
  
  // Skilled Trades & Manufacturing
  "Construction", "Manufacturing", "Automotive", "Plumbing", "Electrical Work",
  "HVAC", "Welding", "Carpentry", "Mechanical Engineering", "Industrial Design",
  
  // Service & Hospitality
  "Hospitality", "Restaurants", "Food Service", "Tourism", "Event Planning",
  "Customer Service", "Retail", "Beauty", "Spa Services", "Entertainment",
  
  // Science & Research
  "Science", "Biology", "Chemistry", "Physics", "Engineering", "Mathematics",
  "Research", "Laboratory Work", "Scientific Writing", "Data Analysis",
  
  // Legal & Government
  "Law", "Legal Research", "Government", "Public Policy", "Criminal Justice",
  "Compliance", "Regulatory Affairs", "Public Administration",
  
  // Transportation & Logistics
  "Transportation", "Logistics", "Supply Chain", "Warehouse Operations",
  "Shipping", "Freight", "Aviation", "Maritime", "Railway",
  
  // Media & Communication
  "Journalism", "Media", "Public Relations", "Advertising", "Broadcasting",
  "Podcasting", "Content Creation", "Social Media", "Digital Marketing",
  
  // Agriculture & Food
  "Agriculture", "Farming", "Food Production", "Culinary Arts", "Wine Making",
  "Organic Farming", "Food Safety", "Agricultural Technology",
  
  // Sports & Recreation
  "Sports", "Fitness", "Coaching", "Athletics", "Recreation", "Outdoor Activities",
  "Adventure Sports", "Team Sports", "Individual Sports"
];

// Skill and interest categories for intelligent suggestions
const SKILL_CATEGORIES = {
  tech: ["JavaScript", "Python", "React", "SQL", "Git", "AWS", "Data Analysis"],
  business: ["Excel", "PowerPoint", "Word", "QuickBooks", "Salesforce", "Project Management", "Marketing", "Accounting"],
  creative: ["Photoshop", "Illustrator", "AutoCAD", "Design", "Photography", "Video Editing", "Graphic Design", "Content Creation"],
  healthcare: ["Nursing", "Medical Terminology", "Pharmacy", "Dental Hygiene", "Physical Therapy"],
  trades: ["Welding", "Carpentry", "Plumbing", "Electrical Work", "HVAC", "Automotive Repair", "Construction"],
  service: ["Hair Styling", "Makeup", "Event Planning", "Customer Service", "Social Media Management"],
  soft: ["Communication", "Leadership", "Problem Solving", "Teamwork", "Time Management", "Sales", "Negotiation", "Public Speaking", "Writing", "Critical Thinking", "Creativity", "Adaptability", "Organization"]
};

const INTEREST_CATEGORIES = {
  tech: ["Technology", "Artificial Intelligence", "Web Development", "Mobile Apps", "Cybersecurity", "Cloud Computing", "Data Science", "Blockchain", "Gaming"],
  business: ["Business", "Entrepreneurship", "Startups", "Finance", "Investing", "Real Estate", "Marketing", "Sales", "E-commerce", "Consulting", "Management"],
  creative: ["Design", "Art", "Photography", "Video Production", "Music", "Fashion", "Interior Design", "Architecture", "Graphic Design", "Animation", "Writing"],
  healthcare: ["Healthcare", "Medicine", "Nursing", "Mental Health", "Fitness", "Nutrition", "Wellness", "Alternative Medicine", "Public Health", "Pharmacy"],
  education: ["Education", "Teaching", "Learning", "Research", "Academic Writing", "Training", "Curriculum Development", "Special Education", "Online Learning"],
  social: ["Sustainability", "Environmental Science", "Social Justice", "Non-profit", "Community Service", "Volunteering", "Human Rights", "Animal Welfare", "Climate Change", "Renewable Energy"],
  trades: ["Construction", "Manufacturing", "Automotive", "Plumbing", "Electrical Work", "HVAC", "Welding", "Carpentry", "Mechanical Engineering", "Industrial Design"],
  service: ["Hospitality", "Restaurants", "Food Service", "Tourism", "Event Planning", "Customer Service", "Retail", "Beauty", "Spa Services", "Entertainment"],
  science: ["Science", "Biology", "Chemistry", "Physics", "Engineering", "Mathematics", "Research", "Laboratory Work", "Scientific Writing", "Data Analysis"],
  legal: ["Law", "Legal Research", "Government", "Public Policy", "Criminal Justice", "Compliance", "Regulatory Affairs", "Public Administration"],
  logistics: ["Transportation", "Logistics", "Supply Chain", "Warehouse Operations", "Shipping", "Freight", "Aviation", "Maritime", "Railway"],
  media: ["Journalism", "Media", "Public Relations", "Advertising", "Broadcasting", "Podcasting", "Content Creation", "Social Media", "Digital Marketing"],
  agriculture: ["Agriculture", "Farming", "Food Production", "Culinary Arts", "Wine Making", "Organic Farming", "Food Safety", "Agricultural Technology"],
  sports: ["Sports", "Fitness", "Coaching", "Athletics", "Recreation", "Outdoor Activities", "Adventure Sports", "Team Sports", "Individual Sports"]
};

// Keywords to identify user background
const BACKGROUND_KEYWORDS = {
  tech: ['software', 'developer', 'programmer', 'engineer', 'computer', 'technology', 'it', 'web', 'app', 'coding', 'programming'],
  business: ['business', 'management', 'admin', 'office', 'finance', 'accounting', 'marketing', 'sales', 'consulting'],
  creative: ['design', 'art', 'creative', 'graphic', 'visual', 'media', 'photography', 'video', 'animation'],
  healthcare: ['nurse', 'doctor', 'medical', 'health', 'patient', 'clinical', 'pharmacy', 'dental', 'therapy'],
  education: ['teacher', 'professor', 'education', 'academic', 'student', 'learning', 'teaching', 'school', 'university'],
  trades: ['construction', 'plumber', 'electrician', 'welder', 'carpenter', 'mechanic', 'technician', 'repair', 'maintenance'],
  service: ['customer', 'service', 'retail', 'hospitality', 'restaurant', 'beauty', 'spa', 'event', 'tourism'],
  science: ['scientist', 'research', 'laboratory', 'biology', 'chemistry', 'physics', 'engineering', 'analysis'],
  legal: ['lawyer', 'legal', 'attorney', 'law', 'government', 'policy', 'compliance', 'regulatory'],
  logistics: ['logistics', 'warehouse', 'shipping', 'freight', 'transportation', 'supply', 'chain', 'operations'],
  media: ['journalist', 'media', 'broadcasting', 'advertising', 'pr', 'content', 'social', 'digital'],
  agriculture: ['farmer', 'agriculture', 'farming', 'food', 'production', 'culinary', 'wine', 'organic'],
  sports: ['coach', 'athlete', 'fitness', 'sports', 'training', 'recreation', 'outdoor', 'adventure']
};

const InterestsScreen: React.FC<InterestsScreenProps> = ({ onContinue, onBack, prefill }) => {
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [userBackground, setUserBackground] = useState<string[]>([]);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [suggestedInterests, setSuggestedInterests] = useState<string[]>([]);

  // Function to analyze user background and suggest relevant categories
  const analyzeUserBackground = (profileData: any, prefillData: any[]) => {
    const backgroundKeywords: string[] = [];
    const textToAnalyze: string[] = [];

    // Collect text from profile data
    if (profileData) {
      if (profileData.headline) textToAnalyze.push(profileData.headline.toLowerCase());
      if (profileData.location) textToAnalyze.push(profileData.location.toLowerCase());
    }

    // Collect text from prefill data (resume parsing)
    if (prefillData && Array.isArray(prefillData)) {
      prefillData.forEach(section => {
        if (section.title) textToAnalyze.push(section.title.toLowerCase());
        if (section.fields && Array.isArray(section.fields)) {
          section.fields.forEach((field: any) => {
            if (field.label) textToAnalyze.push(field.label.toLowerCase());
            if (field.value) textToAnalyze.push(field.value.toLowerCase());
          });
        }
      });
    }

    // Analyze text for background keywords
    const allText = textToAnalyze.join(' ');
    
    Object.entries(BACKGROUND_KEYWORDS).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (allText.includes(keyword)) {
          backgroundKeywords.push(category);
        }
      });
    });

    return [...new Set(backgroundKeywords)]; // Remove duplicates
  };

  // Function to get suggested skills and interests based on background
  const getSuggestions = (backgrounds: string[]) => {
    const suggestedSkillsSet = new Set<string>();
    const suggestedInterestsSet = new Set<string>();

    // Add soft skills to all suggestions (universal)
    SKILL_CATEGORIES.soft.forEach(skill => suggestedSkillsSet.add(skill));

    // Add category-specific suggestions
    backgrounds.forEach(background => {
      if (SKILL_CATEGORIES[background as keyof typeof SKILL_CATEGORIES]) {
        SKILL_CATEGORIES[background as keyof typeof SKILL_CATEGORIES].forEach(skill => 
          suggestedSkillsSet.add(skill)
        );
      }
      if (INTEREST_CATEGORIES[background as keyof typeof INTEREST_CATEGORIES]) {
        INTEREST_CATEGORIES[background as keyof typeof INTEREST_CATEGORIES].forEach(interest => 
          suggestedInterestsSet.add(interest)
        );
      }
    });

    // If no specific background detected, show a mix of popular options
    if (backgrounds.length === 0) {
      ['tech', 'business', 'creative'].forEach(category => {
        if (SKILL_CATEGORIES[category as keyof typeof SKILL_CATEGORIES]) {
          SKILL_CATEGORIES[category as keyof typeof SKILL_CATEGORIES].slice(0, 3).forEach(skill => 
            suggestedSkillsSet.add(skill)
          );
        }
        if (INTEREST_CATEGORIES[category as keyof typeof INTEREST_CATEGORIES]) {
          INTEREST_CATEGORIES[category as keyof typeof INTEREST_CATEGORIES].slice(0, 3).forEach(interest => 
            suggestedInterestsSet.add(interest)
          );
        }
      });
    }

    return {
      skills: Array.from(suggestedSkillsSet).slice(0, 15), // Limit to 15 suggestions
      interests: Array.from(suggestedInterestsSet).slice(0, 15)
    };
  };

  React.useEffect(() => {
    // Load existing skills and interests data if available
    const loadProfileData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('skills, interests, headline, location')
            .eq('id', userData.user.id)
            .single();
          
          if (profileData && !error) {
            if (profileData.skills && Array.isArray(profileData.skills)) {
              setSkills(profileData.skills);
            }
            if (profileData.interests && Array.isArray(profileData.interests)) {
              setInterests(profileData.interests);
            }

            // Analyze background and get suggestions
            const backgrounds = analyzeUserBackground(profileData, prefill || []);
            setUserBackground(backgrounds);
            const suggestions = getSuggestions(backgrounds);
            setSuggestedSkills(suggestions.skills);
            setSuggestedInterests(suggestions.interests);
          } else {
            // No existing profile data, use default suggestions
            const defaultBackgrounds: string[] = [];
            const defaultSuggestions = getSuggestions(defaultBackgrounds);
            setSuggestedSkills(defaultSuggestions.skills);
            setSuggestedInterests(defaultSuggestions.interests);
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    // First try to load from prefill (resume parsing)
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

      // Analyze background from prefill data
      const backgrounds = analyzeUserBackground(null, prefill);
      setUserBackground(backgrounds);
      const suggestions = getSuggestions(backgrounds);
      setSuggestedSkills(suggestions.skills);
      setSuggestedInterests(suggestions.interests);
    }

    // Then load from existing profile data
    loadProfileData();
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

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      removeSkill(skill);
    } else {
      setSkills([...skills, skill]);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      removeInterest(interest);
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onContinue({ skills, interests });
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Top gradient bar */}
      <div className="absolute left-0 top-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-b-[2rem] h-16 transition-all duration-500" />
      {/* Bottom gradient bar */}
      <div className="absolute left-0 bottom-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-t-[2rem] h-16 transition-all duration-500" />
      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 z-10 w-full px-4 py-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border-4 border-gray-250 p-6 flex flex-col items-center h-[calc(100vh-8rem)] max-h-[600px]">
          <h2 className="text-2xl font-bold text-black mb-2 text-center w-full">Your Interests</h2>
          <p className="text-base text-gray-500 mb-6 text-center w-full">What are you passionate about?</p>
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 mb-6 flex-1 overflow-y-auto pr-2">
            
            {/* Skills Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Skills</label>
              
              {/* Suggested Skills */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">
                  {userBackground.length > 0 
                    ? `Based on your background: ${userBackground.join(', ')}`
                    : 'Popular skills:'
                  }
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        skills.includes(skill)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Skill Input */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  placeholder="Add a custom skill..."
                  className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0 text-sm"
                />
                <button 
                  type="button" 
                  onClick={addSkill} 
                  className="px-3 py-1 bg-gray-200 rounded font-semibold hover:bg-purple-100 transition-colors text-sm"
                >
                  Add
                </button>
              </div>

              {/* Selected Skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span key={skill + i} className="bg-purple-200 text-purple-700 font-bold text-xs rounded-full px-3 py-1 flex items-center gap-1">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="ml-1 text-purple-700 hover:text-purple-900">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Interests Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Interests</label>
              
              {/* Suggested Interests */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">
                  {userBackground.length > 0 
                    ? `Based on your background: ${userBackground.join(', ')}`
                    : 'Popular interests:'
                  }
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedInterests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        interests.includes(interest)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Interest Input */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={interestInput}
                  onChange={e => setInterestInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }}
                  placeholder="Add a custom interest..."
                  className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-0 text-sm"
                />
                <button 
                  type="button" 
                  onClick={addInterest} 
                  className="px-3 py-1 bg-gray-200 rounded font-semibold hover:bg-purple-100 transition-colors text-sm"
                >
                  Add
                </button>
              </div>

              {/* Selected Interests */}
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, i) => (
                    <span key={interest + i} className="bg-purple-200 text-purple-700 font-bold text-xs rounded-full px-3 py-1 flex items-center gap-1">
                      {interest}
                      <button type="button" onClick={() => removeInterest(interest)} className="ml-1 text-purple-700 hover:text-purple-900">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </form>

          <div className="w-full mt-4">
            <button
              type="submit"
              onClick={handleSubmit}
              className="w-full py-3 rounded-[1rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold shadow-lg disabled:opacity-60"
            >
              Continue
            </button>
            <button
              className="text-[#7300FF] underline text-base mt-4 w-full text-center"
              onClick={onBack}
            >
              Back to previous step
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestsScreen;
