import { supabase } from '../supabaseClient';
import { getBackendEndpoint } from '../utils/backendUrl';

export interface LinkedInFetchedJob {
  id: string;
  job_title: string;
  company_name?: string;
  location?: string;
  job_url: string;
  easy_apply: boolean;
  salary?: string;
  description?: string;
  posted_date: string;
  created_at: string;
}

/**
 * Fetch jobs from the linkedin_fetched_jobs table for the current user
 */
export async function fetchLinkedInFetchedJobs(): Promise<{ success: boolean; jobs: LinkedInFetchedJob[]; error?: string }> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        jobs: [],
        error: 'User not authenticated'
      };
    }

    // Fetch jobs from the database (only unviewed jobs)
    let query = supabase
      .from('linkedin_fetched_jobs')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50);

    // For now, just fetch all jobs and let the frontend handle filtering
    // This was working before we added the job_swipes table

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching LinkedIn fetched jobs:', error);
      return {
        success: false,
        jobs: [],
        error: 'Failed to fetch jobs from database'
      };
    }

    console.log(`✅ Successfully fetched ${jobs.length} LinkedIn jobs from database`);
    return {
      success: true,
      jobs: jobs || []
    };

  } catch (error) {
    console.error('Error in fetchLinkedInFetchedJobs:', error);
    return {
      success: false,
      jobs: [],
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Trigger job fetching for the current user
 */
export async function triggerJobFetch(): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    console.log('🔍 Triggering job fetch for user:', user.id);

    // Call the backend API to trigger job fetching
    const response = await fetch(getBackendEndpoint('/api/jobs/fetch-jobs'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Job fetch triggered successfully:', result.message);
    
    return {
      success: true
    };

  } catch (error) {
    console.error('❌ Error triggering job fetch:', error);
    return {
      success: false,
      error: 'Backend not available. Please run the backend server (npm start in backend/).'
    };
  }
}

/**
 * Convert LinkedIn fetched jobs to the app's Job format
 */
export function convertLinkedInFetchedToAppJobFormat(fetchedJob: LinkedInFetchedJob): any {
  return {
    id: fetchedJob.id,
    title: fetchedJob.job_title,
    company: fetchedJob.company_name || 'Not available',
    salary: fetchedJob.salary || 'Not available',
    location: fetchedJob.location || 'Not available',
    tags: [], // LinkedIn doesn't provide tags
    requirements: [], // Would need to extract from description
    benefits: [], // LinkedIn doesn't provide benefits
    connections: [],
    fitScore: Math.floor(Math.random() * 21) + 70, // Random fit score 70-90
    description: fetchedJob.description || 'LinkedIn job from fetched jobs', // Use actual description if available
    appliedDate: new Date(fetchedJob.created_at),
    lat: 0, // Would need geocoding
    lng: 0, // Would need geocoding
    url: fetchedJob.job_url,
    easyApply: fetchedJob.easy_apply,
    postedTime: fetchedJob.posted_date,
    applicants: 'Not available',
    source: 'LinkedIn',
  };
} 