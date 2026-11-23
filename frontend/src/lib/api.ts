export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:8000${cleanEndpoint}`;
  }
  return `http://127.0.0.1:8000${cleanEndpoint}`;
};
