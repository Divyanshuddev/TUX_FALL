/**
 * Resolves the backend API URL dynamically based on environment.
 * - On Vercel: reads process.env.NEXT_PUBLIC_API_URL (e.g. https://your-backend.onrender.com)
 * - On Localhost: defaults to http://localhost:8000
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // 1. Check explicit environment variable (configured in Vercel / .env)
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    const baseUrl = envUrl.trim().replace(/\/+$/, '');
    return `${baseUrl}${cleanEndpoint}`;
  }

  // 2. Client-side browser fallback
  if (typeof window !== 'undefined') {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocal) {
      return `http://localhost:8000${cleanEndpoint}`;
    }

    // On remote hosting without env var set yet, use relative path for rewrites
    return cleanEndpoint;
  }

  // 3. Server-side rendering default
  return `http://127.0.0.1:8000${cleanEndpoint}`;
};
