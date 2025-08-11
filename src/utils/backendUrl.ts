/**
 * Get the backend URL from environment variables
 * Falls back to localhost for development
 */
export function getBackendUrl(): string {
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
}

/**
 * Get the backend URL for a specific endpoint
 */
export function getBackendEndpoint(endpoint: string): string {
  const baseUrl = getBackendUrl();
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}
