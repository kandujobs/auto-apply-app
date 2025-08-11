import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import EmployerHomeScreen from './EmployerHomeScreen';
import EmployerUserProfileScreen from './EmployerUserProfileScreen';
import EmployerQuestionsScreen from './EmployerQuestionsScreen';
import CreateNewListingScreen from './CreateNewListingScreen';
import ApplicantsScreen from './ApplicantsScreen';
import EmployerCompanyProfileScreen from './EmployerCompanyProfileScreen';
import EmployerDetailsScreen from './EmployerDetailsScreen';
import EmployerOnboardingScreen from './EmployerOnboardingScreen';

type EmployerScreen = 'home' | 'profile' | 'questions' | 'create' | 'applicants' | 'company' | 'details' | 'onboarding';

const EmployerApp: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<EmployerScreen>('home');
  const [employer, setEmployer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Navigation functions
  const goHome = () => setCurrentScreen('home');
  const goProfile = () => setCurrentScreen('profile');
  const goQuestions = () => setCurrentScreen('questions');
  const goCreate = () => setCurrentScreen('create');
  const goApplicants = () => setCurrentScreen('applicants');
  const goCompany = () => setCurrentScreen('company');
  const goDetails = () => setCurrentScreen('details');
  const goOnboarding = () => setCurrentScreen('onboarding');

  // Check employer status and redirect accordingly
  useEffect(() => {
    const checkEmployerStatus = async () => {
      setLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setLoading(false);
        return;
      }

      const { data: employerData, error: employerError } = await supabase
        .from('employers')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      if (employerError || !employerData) {
        setShowOnboarding(true);
        setCurrentScreen('onboarding');
        setLoading(false);
        return;
      }

      if (!employerData.company_name || !employerData.location || !employerData.radius || !employerData.latitude || !employerData.longitude) {
        setShowOnboarding(true);
        setCurrentScreen('onboarding');
        setLoading(false);
        return;
      }

      if (!employerData.employer_name || !employerData.role_at_company) {
        setShowDetails(true);
        setCurrentScreen('details');
        setLoading(false);
        return;
      }

      setEmployer(employerData);
      setCurrentScreen('home');
      setLoading(false);
    };

    checkEmployerStatus();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#A100FF] mb-4"></div>
          <span className="text-xl font-bold text-[#A100FF]">Loading...</span>
        </div>
      </div>
    );
  }

  // Render the appropriate screen based on currentScreen
  switch (currentScreen) {
    case 'home':
      return <EmployerHomeScreen />;
    case 'profile':
      return (
        <EmployerUserProfileScreen 
          onHome={goHome}
          onCreate={goCreate}
          onQuestions={goQuestions}
          onUserSettings={goProfile}
          onApplicants={goApplicants}
          onCompanyProfile={goCompany}
        />
      );
    case 'questions':
      return (
        <EmployerQuestionsScreen 
          goHome={goHome}
          goProfile={goProfile}
          goApplicants={goApplicants}
          goQuestions={goQuestions}
          goCreate={goCreate}
          onUserSettings={goProfile}
        />
      );
    case 'create':
      return (
        <CreateNewListingScreen 
          onHome={goHome}
          onProfile={goProfile}
          onApplicants={goApplicants}
          onQuestions={goQuestions}
        />
      );
    case 'applicants':
      return (
        <ApplicantsScreen 
          onHome={goHome}
          onCreate={goCreate}
          onQuestions={goQuestions}
          onUserSettings={goProfile}
        />
      );
    case 'company':
      return (
        <EmployerCompanyProfileScreen 
          onHome={goHome}
          onApplicants={goApplicants}
          onCreate={goCreate}
          onQuestions={goQuestions}
          company={employer}
          loading={loading}
          onProfileSave={(company) => setEmployer(company)}
        />
      );
    case 'details':
      return (
        <EmployerDetailsScreen 
          onComplete={goHome}
        />
      );
    case 'onboarding':
      return (
        <EmployerOnboardingScreen 
          onNext={(data) => {
            setEmployer(data);
            setCurrentScreen('details');
          }}
        />
      );
    default:
      return <EmployerHomeScreen />;
  }
};

export default EmployerApp; 