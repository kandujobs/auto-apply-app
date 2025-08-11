import { getLinkedInCredentials } from './linkedinCredentials';
import { supabase } from '../supabaseClient';

// Import types from the auto-apply system
export interface UserProfile {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  resumePath: string;
  experience: any[];
  education: any[];
  skills: string[];
  interests: string[];
}

export interface ApplicationResult {
  success: boolean;
  jobId: string;
  jobTitle: string;
  company: string;
  appliedAt: Date;
  screenshotPath?: string;
  error?: string;
  applicationId?: string;
}

/**
 * Bridge function to apply to a LinkedIn job using the auto-apply system
 */
export async function applyToLinkedInJob(
  jobUrl: string, 
  userProfile: UserProfile
): Promise<ApplicationResult> {
  try {
    // Get LinkedIn credentials from Supabase
    const credentialsResult = await getLinkedInCredentials();
    if (!credentialsResult.success || !credentialsResult.credentials) {
      return {
        success: false,
        jobId: 'unknown',
        jobTitle: 'Unknown',
        company: 'Unknown',
        appliedAt: new Date(),
        error: 'LinkedIn credentials not found. Please save your credentials first.',
      };
    }

    console.log('Starting LinkedIn auto-apply process...');
    console.log('Job URL:', jobUrl);
    console.log('User Profile:', userProfile);
    console.log('LinkedIn Credentials:', {
      email: credentialsResult.credentials.email,
      password: '***hidden***'
    });

    // Call the backend API
    const response = await fetch('http://localhost:3001/api/auto-apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobUrl,
        userProfile,
        linkedInCredentials: credentialsResult.credentials,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error in auto-apply:', error);
    return {
      success: false,
      jobId: 'unknown',
      jobTitle: 'Unknown',
      company: 'Unknown',
      appliedAt: new Date(),
      error: 'Backend not available. Please run the backend server (npm start in backend/).',
    };
  }
}

/**
 * Apply to multiple LinkedIn jobs
 */
export async function applyToMultipleLinkedInJobs(
  jobUrls: string[], 
  userProfile: UserProfile
): Promise<ApplicationResult[]> {
  const results: ApplicationResult[] = [];
  
  for (const jobUrl of jobUrls) {
    console.log(`Applying to job: ${jobUrl}`);
    const result = await applyToLinkedInJob(jobUrl, userProfile);
    results.push(result);
    
    // Add delay between applications to avoid rate limiting
    if (jobUrls.indexOf(jobUrl) < jobUrls.length - 1) {
      console.log('Waiting before next application...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  return results;
}

/**
 * Validate if auto-apply is ready (has credentials and profile)
 */
export async function validateAutoApplySetup(): Promise<{
  ready: boolean;
  missing: string[];
  error?: string;
}> {
  const missing: string[] = [];

  try {
    // Check LinkedIn credentials
    const credentialsResult = await getLinkedInCredentials();
    if (!credentialsResult.success || !credentialsResult.credentials) {
      missing.push('LinkedIn credentials');
    }

    // Check if user profile has required fields
    const userProfile = await getUserProfile();
    if (!userProfile) {
      missing.push('User profile data');
    } else {
      // Check for required profile fields
      if (!userProfile.firstName || !userProfile.lastName) {
        missing.push('Name information');
      }
      if (!userProfile.email) {
        missing.push('Email address');
      }
      if (!userProfile.phone) {
        missing.push('Phone number');
      }
      if (!userProfile.location) {
        missing.push('Location');
      }
    }

    return {
      ready: missing.length === 0,
      missing,
    };
  } catch (error) {
    return {
      ready: false,
      missing: ['LinkedIn credentials', 'User profile data'],
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Get user profile from the app's user data
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated');
      return null;
    }

    // Fetch user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    // Education and experience are stored as JSONB arrays in the profiles table
    const education = profile.education || [];
    const experience = profile.experience || [];

    // Parse name into first and last name
    const nameParts = (profile.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Convert education data to the format expected by auto-apply system
    const formattedEducation = (education || []).map((edu: any) => ({
      degree: edu.degree || '',
      school: edu.institution || '',
      fieldOfStudy: edu.field || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      gpa: edu.gpa || '',
    }));

    // Convert experience data to the format expected by auto-apply system
    const formattedExperience = (experience || []).map((exp: any) => ({
      title: exp.title || '',
      company: exp.company || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      description: exp.description || '',
      current: exp.current || false,
    }));

    // Extract skills from profile (assuming skills is stored as an array or string)
    let skills: string[] = [];
    if (profile.skills) {
      if (Array.isArray(profile.skills)) {
        skills = profile.skills;
      } else if (typeof profile.skills === 'string') {
        skills = profile.skills.split(',').map((s: string) => s.trim());
      }
    }

    const userProfile: UserProfile = {
      name: profile.name || '',
      firstName,
      lastName,
      email: profile.email || user.email || '',
      phone: profile.phone || '',
      location: profile.location || '',
      resumePath: './resume.pdf', // This would need to be updated based on your resume storage
      experience: formattedExperience,
      education: formattedEducation,
      skills,
      interests: Array.isArray(profile.interests) ? profile.interests : [],
    };

    console.log('Fetched user profile:', userProfile);
    return userProfile;

  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
} 