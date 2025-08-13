/**
 * Get the backend URL from environment variables
 * Falls back to localhost for development
 */
export function getBackendUrl(): string {
  // Temporarily hardcode for testing - remove this after confirming it works
  const backendUrl = 'https://auto-apply-app-production.up.railway.app';
  console.log('🔧 Backend URL (hardcoded for testing):', backendUrl);
  console.log('🔧 Environment variable VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
  return backendUrl;
}

/**
 * Get the backend URL for a specific endpoint
 */
export function getBackendEndpoint(endpoint: string): string {
  const baseUrl = getBackendUrl();
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}
