import { checkSupabaseConnection } from '../supabaseClient';
import { getBackendUrl } from '../utils/backendUrl';

export interface HealthStatus {
  backend: boolean;
  supabase: boolean;
  internet: boolean;
  timestamp: Date;
}

/**
 * Check the health of all external services
 */
export async function checkHealth(): Promise<HealthStatus> {
  const status: HealthStatus = {
    backend: false,
    supabase: false,
    internet: false,
    timestamp: new Date()
  };

  // Check internet connectivity
  try {
    const response = await fetch('/vite.svg', { 
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000)
    });
    status.internet = response.ok;
  } catch (error) {
    console.warn('Internet connectivity check failed:', error);
  }

  // Check backend server
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/`, {
      signal: AbortSignal.timeout(5000)
    });
    status.backend = response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
  }

  // Check Supabase connection
  try {
    status.supabase = await checkSupabaseConnection();
  } catch (error) {
    console.warn('Supabase health check failed:', error);
  }

  return status;
}

/**
 * Get a user-friendly status message
 */
export function getHealthStatusMessage(status: HealthStatus): string {
  if (!status.internet) {
    return 'No internet connection';
  }
  
  if (!status.backend && !status.supabase) {
    return 'Unable to connect to services';
  }
  
  if (!status.backend) {
    return 'Backend server unavailable';
  }
  
  if (!status.supabase) {
    return 'Database connection issues';
  }
  
  return 'All systems operational';
}

/**
 * Simplified service check for SwipeCard component
 * This replaces the old ensureServicesRunning function
 */
export async function ensureServicesRunning(userId: string): Promise<boolean> {
  try {
    const health = await checkHealth();
    
    // For basic functionality, we only need internet and database
    // Backend is optional for storing swipes
    return health.internet && health.supabase;
  } catch (error) {
    console.warn('Service health check failed:', error);
    return false;
  }
} 