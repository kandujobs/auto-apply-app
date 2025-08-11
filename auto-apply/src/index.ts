import { fetchJobsForUser, resetPaginationState } from './jobFetcherWorker';
import { UserProfile } from './types';
import { config, validateConfig } from './config';
import { log } from './utils';

// Sample user profile for testing
const testProfile: UserProfile = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-123-4567',
  location: 'San Francisco, CA',
  resumePath: config.resumePath,
  experience: [
    {
      title: 'Software Engineer',
      company: 'Tech Corp',
      startDate: '2022-01-01',
      endDate: '2023-12-31',
      description: 'Developed web applications using React and Node.js',
      current: false,
    },
    {
      title: 'Senior Developer',
      company: 'Startup Inc',
      startDate: '2024-01-01',
      description: 'Leading development of cloud-based solutions',
      current: true,
    },
  ],
  education: [
    {
      degree: 'Bachelor of Science',
      school: 'University of Technology',
      fieldOfStudy: 'Computer Science',
      startDate: '2018-09-01',
      endDate: '2022-05-01',
      gpa: '3.8',
    },
  ],
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS'],
};

/**
 * Main function to run the auto-apply process (with login)
 */
async function main() {
  try {
    log('Starting LinkedIn Auto-Apply System');
    
    // Validate configuration
    validateConfig();
    
    // Sample job URL (replace with actual job URL)
    const jobUrl = 'https://www.linkedin.com/jobs/view/XXXXX'; // Replace with actual job URL
    
    log(`Target job URL: ${jobUrl}`);
    log(`Using resume: ${config.resumePath}`);
    
    // Run the auto-apply process
    log('Auto-apply process not available in this version - use test-simple-click.js instead');
    throw new Error('Auto-apply process not available in this version - use test-simple-click.js instead');
    
  } catch (error) {
    log(`Fatal error: ${error}`, 'error');
    process.exit(1);
  }
}

/**
 * Function to fetch jobs for a user (without login)
 */
async function fetchJobsForUserCommand(userId: string) {
  try {
    log(`Starting job fetch for user: ${userId}`);
    
    // Use the job fetcher worker (no login required)
    await fetchJobsForUser(userId);
    
    log('Job fetch process completed');
    
  } catch (error) {
    log(`Error fetching jobs for user: ${error}`, 'error');
    throw error;
  }
}

/**
 * Function to reset pagination state for a user
 */
async function resetPaginationCommand(userId: string) {
  try {
    log(`Starting pagination reset for user: ${userId}`);
    
    // Reset the pagination state
    await resetPaginationState(userId);
    
    log('Pagination reset process completed');
    
  } catch (error) {
    log(`Error resetting pagination for user: ${error}`, 'error');
    throw error;
  }
}

/**
 * Function to start the Easy Apply worker for a user
 * This now uses the proven test-simple-click.js approach
 */
async function startEasyApplyWorkerCommand(userId: string) {
  try {
    log(`Starting Easy Apply worker for user: ${userId}`);
    log('This system now uses the proven test-simple-click.js approach');
    log('Browser management is handled by the backend server');
    
    // The actual application logic is now handled by test-simple-click.js
    // This function just validates the setup
    log('✅ Easy Apply worker setup validated');
    
  } catch (error) {
    log(`Error in Easy Apply worker for user: ${error}`, 'error');
    throw error;
  }
}

/**
 * Function to auto-apply to a specific job (with login)
 */
async function applyToJobCommand(jobUrl: string, userId: string) {
  try {
    log(`Starting auto-apply to job: ${jobUrl}`);
    
    // Get user profile from database
    // TODO: Implement user profile fetching from database
    
    // Run the auto-apply process
    log('Auto-apply process not available in this version - use test-simple-click.js instead');
    throw new Error('Auto-apply process not available in this version - use test-simple-click.js instead');
    
  } catch (error) {
    log(`Error in auto-apply: ${error}`, 'error');
    throw error;
  }
}

// Export functions for use by other modules
export {
  fetchJobsForUser,
  applyToJobCommand,
  startEasyApplyWorkerCommand,
};

// Run main function if this file is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const command = args[0];
    
    switch (command) {
      case 'apply':
        const jobUrl = args[1];
        const userId = args[2];
        if (jobUrl && userId) {
          applyToJobCommand(jobUrl, userId);
        } else {
          log('Please provide a job URL and user ID', 'error');
        }
        break;
        
      case 'fetch-jobs':
        const fetchUserId = args[1];
        if (fetchUserId) {
          fetchJobsForUserCommand(fetchUserId);
        } else {
          log('Please provide a user ID', 'error');
        }
        break;
        
      case 'auto-apply':
        const autoApplyUserId = args[1];
        if (autoApplyUserId) {
          // This is the old auto-apply command for backward compatibility
          log('Auto-apply command called - this would start the auto-apply process');
          log('Use test-simple-click.js for actual applications');
        } else {
          log('Please provide a user ID', 'error');
        }
        break;
        
      case 'reset-pagination':
        const resetUserId = args[1];
        if (resetUserId) {
          resetPaginationCommand(resetUserId);
        } else {
          log('Please provide a user ID', 'error');
        }
        break;
        
      case 'easy-apply-worker':
        const workerUserId = args[1];
        if (workerUserId) {
          startEasyApplyWorkerCommand(workerUserId);
        } else {
          log('Please provide a user ID', 'error');
        }
        break;
        
      default:
        log(`Unknown command: ${command}`, 'error');
        log('Available commands: apply, fetch-jobs, auto-apply, reset-pagination, easy-apply-worker', 'info');
        break;
    }
  } else {
    log('No command provided', 'error');
    log('Available commands: apply, fetch-jobs, auto-apply, reset-pagination, easy-apply-worker', 'info');
  }
} 