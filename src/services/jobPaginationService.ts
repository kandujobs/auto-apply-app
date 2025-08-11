import { supabase } from '../supabaseClient';
import { triggerJobFetch } from './linkedinFetchedJobs';

export interface JobPaginationState {
  totalJobs: number;
  viewedJobs: number;
  remainingJobs: number;
  shouldRefetch: boolean;
}

/**
 * Get the current pagination state for a user
 */
export async function getJobPaginationState(userId: string): Promise<JobPaginationState> {
  try {
    // Get total number of available jobs
    const { data: totalJobs, error: totalError } = await supabase
      .from('linkedin_fetched_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (totalError) {
      console.error('Error getting total jobs:', totalError);
      return { totalJobs: 0, viewedJobs: 0, remainingJobs: 0, shouldRefetch: false };
    }

    const total = totalJobs?.length || 0;

    // Get the number of jobs that have been viewed (swiped on)
    const { data: viewedJobs, error: viewedError } = await supabase
      .from('job_swipes')
      .select('job_id', { count: 'exact' })
      .eq('user_id', userId);

    if (viewedError) {
      console.error('Error getting viewed jobs:', viewedError);
      return { totalJobs: total, viewedJobs: 0, remainingJobs: total, shouldRefetch: false };
    }

    const viewed = viewedJobs?.length || 0;
    const remaining = total - viewed;
    const shouldRefetch = remaining <= 5 && total > 0;

    return {
      totalJobs: total,
      viewedJobs: viewed,
      remainingJobs: remaining,
      shouldRefetch
    };
  } catch (error) {
    console.error('Error in getJobPaginationState:', error);
    return { totalJobs: 0, viewedJobs: 0, remainingJobs: 0, shouldRefetch: false };
  }
}

/**
 * Check if we need to refetch jobs and trigger the fetch if needed
 */
export async function checkAndTriggerJobRefetch(userId: string): Promise<{ refetched: boolean; error?: string }> {
  try {
    const paginationState = await getJobPaginationState(userId);
    
    if (paginationState.shouldRefetch) {
      console.log('🔄 Triggering job refetch - user has only', paginationState.remainingJobs, 'jobs remaining');
      
      const result = await triggerJobFetch();
      
      if (result.success) {
        console.log('✅ Job refetch completed successfully');
        return { refetched: true };
      } else {
        console.error('❌ Job refetch failed:', result.error);
        return { refetched: false, error: result.error };
      }
    }
    
    return { refetched: false };
  } catch (error) {
    console.error('Error in checkAndTriggerJobRefetch:', error);
    return { refetched: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

  /**
   * Mark a job as viewed (called when user swipes on a job)
   */
  export async function markJobAsViewed(userId: string, jobId: string, direction: 'left' | 'right' | 'saved'): Promise<void> {
    try {
      // Insert or update the job swipe record
      const { error } = await supabase
        .from('job_swipes')
        .upsert([{
          user_id: userId,
          job_id: jobId,
          swipe_direction: direction,
          swiped_at: new Date().toISOString()
        }], { onConflict: 'user_id,job_id' });

      if (error) {
        console.error('Error marking job as viewed:', error);
        // If table doesn't exist, that's okay - just log it
        if (error.code === '42P01') { // Table doesn't exist
          console.log('job_swipes table does not exist yet, skipping job tracking');
        }
      } else {
        console.log('✅ Marked job as viewed:', jobId, 'direction:', direction);
      }
    } catch (error) {
      console.error('Error in markJobAsViewed:', error);
    }
  }

  /**
   * Reset pagination state by clearing job swipes for a user
   * This is useful when jobs are deleted and pagination state becomes invalid
   */
  export async function resetPaginationState(userId: string): Promise<void> {
    try {
      console.log('🔄 Resetting pagination state for user:', userId);
      
      // Delete all job swipes for this user
      const { error } = await supabase
        .from('job_swipes')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting pagination state:', error);
        // If table doesn't exist, that's okay - just log it
        if (error.code === '42P01') { // Table doesn't exist
          console.log('job_swipes table does not exist yet, skipping reset');
        }
      } else {
        console.log('✅ Successfully reset pagination state for user:', userId);
      }
      
      // Also clear localStorage pagination state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentJobIndex');
        console.log('✅ Cleared localStorage currentJobIndex');
      }
    } catch (error) {
      console.error('Error in resetPaginationState:', error);
    }
  }

  /**
   * Get the next batch of jobs for a user (unviewed jobs)
   */
  export async function getNextJobs(userId: string, limit: number = 10): Promise<any[]> {
    try {
      // Get jobs that haven't been swiped on yet
      let query = supabase
        .from('linkedin_fetched_jobs')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

            // For now, just fetch all jobs and let the frontend handle filtering
      // This was working before we added the job_swipes table

      const { data: jobs, error } = await query;

      if (error) {
        console.error('Error getting next jobs:', error);
        return [];
      }

      return jobs || [];
    } catch (error) {
      console.error('Error in getNextJobs:', error);
      return [];
    }
  } 