/**
 * Test network connectivity by attempting to fetch a small resource
 * This is used for debugging network status detection
 */
export const testNetworkConnectivity = async (): Promise<{
  isOnline: boolean;
  responseTime: number;
  error?: string;
}> => {
  const startTime = Date.now();
  
  try {
    // Try to fetch a small resource (vite.svg is typically available)
    const response = await fetch('/vite.svg', { 
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        isOnline: true,
        responseTime
      };
    } else {
      return {
        isOnline: false,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      isOnline: false,
      responseTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Test if the browser reports being online
 */
export const testBrowserOnlineStatus = (): boolean => {
  return navigator.onLine;
};

/**
 * Log network status for debugging
 */
export const logNetworkStatus = async () => {
  console.log('🌐 Network Status Check:');
  console.log('Browser online status:', navigator.onLine);
  
  const connectivityTest = await testNetworkConnectivity();
  console.log('Connectivity test:', connectivityTest);
  
  return connectivityTest;
}; 