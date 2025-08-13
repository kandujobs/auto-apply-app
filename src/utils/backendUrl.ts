/**
 * Get the backend URL from environment variables
 * Falls back to localhost for development
 */
export function getBackendUrl(): string {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  console.log('🔧 Backend URL:', backendUrl);
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
