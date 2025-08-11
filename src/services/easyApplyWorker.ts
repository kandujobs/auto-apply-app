import { supabase } from '../supabaseClient';

const BACKEND_URL = 'http://localhost:3001';

export interface EasyApplyWorkerStatus {
  isRunning: boolean;
  processId?: number;
  lastActivity?: string;
  error?: string;
}

/**
 * Start the Easy Apply Worker for a user
 */
export async function startEasyApplyWorker(userId: string, linkedInCredentials: { email: string; password: string }): Promise<{ success: boolean; message: string; processId?: number }> {
  try {
    console.log('🚀 Starting Easy Apply Worker for user:', userId);
    
    const response = await fetch(`${BACKEND_URL}/api/start-easy-apply-worker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        linkedInCredentials
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Easy Apply Worker started successfully');
      return {
        success: true,
        message: result.message,
        processId: result.processId
      };
    } else {
      console.error('❌ Failed to start Easy Apply Worker:', result.error);
      return {
        success: false,
        message: result.error || 'Failed to start Easy Apply Worker'
      };
    }
    
  } catch (error) {
    console.error('❌ Error starting Easy Apply Worker:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Check if there are any pending job applications for a user
 */
export async function getPendingApplications(userId: string): Promise<{ success: boolean; count: number; applications?: any[] }> {
  try {
    const { data: swipes, error } = await supabase
      .from('job_swipes')
      .select('job_id, swiped_at, application_processed, application_success, application_error')
      .eq('user_id', userId)
      .eq('swipe_direction', 'right')
      .eq('application_processed', false)  // Changed from .is('application_processed', null) to .eq('application_processed', false)
      .order('swiped_at', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching pending applications:', error.message);
      return {
        success: false,
        count: 0
      };
    }
    
    const pendingCount = swipes?.length || 0;
    console.log(`📋 Found ${pendingCount} pending applications for user: ${userId}`);
    
    return {
      success: true,
      count: pendingCount,
      applications: swipes || []
    };
    
  } catch (error) {
    console.error('❌ Error in getPendingApplications:', error);
    return {
      success: false,
      count: 0
    };
  }
}

/**
 * Get application processing status for a user
 */
export async function getApplicationStatus(userId: string): Promise<{ success: boolean; status: EasyApplyWorkerStatus }> {
  try {
    // Check for recent activity in job_swipes table
    const { data: recentActivity, error } = await supabase
      .from('job_swipes')
      .select('application_processed, application_success, application_error, application_processed_at')
      .eq('user_id', userId)
      .eq('swipe_direction', 'right')
      .not('application_processed', 'is', false)  // Changed from .not('application_processed', 'is', null) to .not('application_processed', 'is', false)
      .order('application_processed_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching application status:', error.message);
      return {
        success: false,
        status: {
          isRunning: false,
          error: error.message
        }
      };
    }
    
    // Check for pending applications
    const pendingResult = await getPendingApplications(userId);
    
    const status: EasyApplyWorkerStatus = {
      isRunning: pendingResult.count > 0 || (recentActivity && recentActivity.length > 0),
      lastActivity: recentActivity?.[0]?.application_processed_at,
      error: recentActivity?.[0]?.application_error
    };
    
    return {
      success: true,
      status
    };
    
  } catch (error) {
    console.error('❌ Error in getApplicationStatus:', error);
    return {
      success: false,
      status: {
        isRunning: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Get detailed application history for a user
 */
export async function getApplicationHistory(userId: string): Promise<{ success: boolean; applications: any[] }> {
  try {
    const { data: swipes, error } = await supabase
      .from('job_swipes')
      .select(`
        job_id,
        swiped_at,
        application_processed,
        application_success,
        application_error,
        application_processed_at,
        linkedin_fetched_jobs!inner(
          job_title,
          company_name,
          job_url
        )
      `)
      .eq('user_id', userId)
      .eq('swipe_direction', 'right')
      .not('application_processed', 'is', null)
      .order('application_processed_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching application history:', error.message);
      return {
        success: false,
        applications: []
      };
    }
    
    const applications = (swipes || []).map(swipe => ({
      jobId: swipe.job_id,
      jobTitle: (swipe.linkedin_fetched_jobs as any)?.job_title || 'Unknown',
      company: (swipe.linkedin_fetched_jobs as any)?.company_name || 'Unknown',
      jobUrl: (swipe.linkedin_fetched_jobs as any)?.job_url || '',
      swipedAt: swipe.swiped_at,
      processed: swipe.application_processed,
      success: swipe.application_success,
      error: swipe.application_error,
      processedAt: swipe.application_processed_at
    }));
    
    console.log(`📊 Found ${applications.length} processed applications for user: ${userId}`);
    
    return {
      success: true,
      applications
    };
    
  } catch (error) {
    console.error('❌ Error in getApplicationHistory:', error);
    return {
      success: false,
      applications: []
    };
  }
} 